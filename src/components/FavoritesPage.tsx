import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Heart, Gift, Sparkles, ShoppingBag, CreditCard, Coins, ArrowUpDown, Filter, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { useAuthContext } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useFavorites } from '@/hooks/useFavorites';
import { SEO } from '@/components/SEO';
import { Progress } from '@/components/ui/progress';

interface FavoriteItem {
  id: string;
  reward_id: string;
  reward_title: string;
  reward_cost: number;
  reward_image: string | null;
  reward_category: string;
  stock_quantity: number | null;
  added_at: string;
}

const categoryLabels: Record<string, string> = {
  all: 'All',
  alliance_tokens: 'Alliance Tokens',
  experiences: 'Experiences',
  merch: 'Merch',
  gift_cards: 'Gift Cards',
  wellness: 'Wellness & Health',
};

const categoryIcons: Record<string, React.ElementType> = {
  all: Gift,
  alliance_tokens: Coins,
  experiences: Sparkles,
  merch: ShoppingBag,
  gift_cards: CreditCard,
  wellness: Heart,
};

function FavoriteCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <div className="flex justify-between">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

interface FavoritesPageProps {
  claimBalance: number;
}

export function FavoritesPage({ claimBalance }: FavoritesPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthContext();
  const { toggleFavorite, animatingIds } = useFavorites();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states from URL
  const activeCategory = searchParams.get('category') || 'all';
  const sortBy = searchParams.get('sort') || 'newest';

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('reward_wishlists')
        .select(`
          id,
          reward_id,
          created_at,
          rewards:reward_id (
            title,
            cost,
            image_url,
            category,
            stock_quantity
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mapped = (data || []).map((item: any) => ({
        id: item.id,
        reward_id: item.reward_id,
        reward_title: item.rewards?.title || 'Unknown Reward',
        reward_cost: item.rewards?.cost || 0,
        reward_image: item.rewards?.image_url,
        reward_category: item.rewards?.category || 'other',
        stock_quantity: item.rewards?.stock_quantity,
        added_at: item.created_at,
      }));
      
      setFavorites(mapped);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (rewardId: string) => {
    await toggleFavorite(rewardId);
    setFavorites(prev => prev.filter(item => item.reward_id !== rewardId));
  };

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all' || value === 'newest') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    setSearchParams(params, { replace: true });
  };

  // Filter and sort favorites
  const filteredFavorites = useMemo(() => {
    let result = [...favorites];
    
    // Category filter
    if (activeCategory !== 'all') {
      result = result.filter(item => item.reward_category === activeCategory);
    }
    
    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.added_at).getTime() - new Date(b.added_at).getTime());
        break;
      case 'priceLow':
        result.sort((a, b) => a.reward_cost - b.reward_cost);
        break;
      case 'priceHigh':
        result.sort((a, b) => b.reward_cost - a.reward_cost);
        break;
      case 'inStock':
        result.sort((a, b) => {
          const aStock = a.stock_quantity ?? 999;
          const bStock = b.stock_quantity ?? 999;
          return bStock - aStock;
        });
        break;
    }
    
    return result;
  }, [favorites, activeCategory, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="My Favorites"
        description="View and manage your favorite rewards on Crescendo."
      />
      
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                My Favorites
              </h1>
              <p className="text-sm text-muted-foreground">
                {favorites.length} {favorites.length === 1 ? 'reward' : 'rewards'} saved
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <div className="space-y-4">
          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={(v) => updateFilters('category', v)}>
            <div className="overflow-x-auto -mx-4 px-4">
              <TabsList className="w-max">
                {Object.entries(categoryLabels).map(([key, label]) => {
                  const Icon = categoryIcons[key] || Gift;
                  return (
                    <TabsTrigger key={key} value={key} className="flex items-center gap-2 whitespace-nowrap">
                      <Icon className="w-4 h-4" />
                      {label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </Tabs>

          {/* Sort & Results */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(v) => updateFilters('sort', v)}>
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Date Added (Newest)</SelectItem>
                  <SelectItem value="oldest">Date Added (Oldest)</SelectItem>
                  <SelectItem value="priceLow">Price: Low to High</SelectItem>
                  <SelectItem value="priceHigh">Price: High to Low</SelectItem>
                  <SelectItem value="inStock">Availability</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant="secondary">
              {filteredFavorites.length} {filteredFavorites.length === 1 ? 'result' : 'results'}
            </Badge>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <FavoriteCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredFavorites.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-xl font-semibold mb-2">
                {favorites.length === 0 
                  ? "No favorites yet" 
                  : "No matches found"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {favorites.length === 0 
                  ? "Browse rewards to find something you love. Tap the heart icon to save it here."
                  : "Try adjusting your filters to see more results."}
              </p>
              <Button onClick={() => navigate('/rewards')}>
                <Gift className="w-4 h-4 mr-2" />
                Browse Rewards
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map((item) => {
              const affordable = claimBalance >= item.reward_cost;
              const outOfStock = item.stock_quantity !== null && item.stock_quantity <= 0;
              const lowStock = item.stock_quantity !== null && item.stock_quantity > 0 && item.stock_quantity <= 5;
              const isAnimating = animatingIds.has(item.reward_id);
              
              return (
                <Card 
                  key={item.id} 
                  className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => navigate(`/rewards/${item.reward_id}`)}
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <ImageWithFallback
                      src={item.reward_image || '/placeholder.svg'}
                      alt={item.reward_title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    
                    {/* Remove favorite button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 bg-background/90 hover:bg-background backdrop-blur-sm h-9 w-9 rounded-full shadow-lg border border-border/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(item.reward_id);
                      }}
                    >
                      <Heart
                        className={`h-5 w-5 fill-red-500 text-red-500 transition-transform ${
                          isAnimating ? 'scale-125' : ''
                        }`}
                      />
                    </Button>

                    {/* Status badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {outOfStock && (
                        <Badge variant="destructive" className="text-xs">
                          Out of Stock
                        </Badge>
                      )}
                      {lowStock && !outOfStock && (
                        <Badge className="bg-orange-500/90 text-white text-xs">
                          Only {item.stock_quantity} left
                        </Badge>
                      )}
                    </div>

                    {/* Cost badge */}
                    <div className="absolute bottom-3 left-3">
                      <Badge className="bg-background/90 backdrop-blur-sm border border-primary/20 text-primary font-bold shadow-lg">
                        <Coins className="w-3 h-3 mr-1" />
                        {item.reward_cost}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                        {item.reward_title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {categoryLabels[item.reward_category] || item.reward_category}
                      </p>
                    </div>

                    {item.stock_quantity !== null && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {item.stock_quantity} left
                          </span>
                        </div>
                        <Progress value={Math.min((item.stock_quantity / 100) * 100, 100)} className="h-1" />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      {affordable ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Can Afford
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Need {item.reward_cost - claimBalance} more
                        </Badge>
                      )}
                      <Button 
                        size="sm" 
                        variant={affordable && !outOfStock ? "default" : "secondary"}
                        disabled={outOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/rewards/${item.reward_id}`);
                        }}
                      >
                        {outOfStock ? 'Out of Stock' : 'View'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
