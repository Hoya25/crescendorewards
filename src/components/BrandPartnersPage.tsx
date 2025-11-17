import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { 
  ArrowLeft, 
  Store, 
  Trophy, 
  Gift, 
  Sparkles, 
  ShoppingBag, 
  Utensils, 
  Plane, 
  Star,
  TrendingUp,
  ExternalLink,
  Tag,
  Zap,
  LinkIcon,
  Search,
  ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import Autoplay from 'embla-carousel-autoplay';

interface BrandPartnersPageProps {
  onBack: () => void;
  onNavigateToStatus: () => void;
  onNavigateToRewards: () => void;
  onNavigateToBrandDetail: (brandId: string) => void;
}

interface Brand {
  id: string;
  name: string;
  description: string;
  category: string;
  base_earning_rate: number;
  logo_emoji: string;
  logo_color: string;
  shop_url: string;
  is_featured: boolean;
  created_at: string;
}

const categories = [
  { id: 'all', label: 'All Partners', icon: Store },
  { id: 'Retail', label: 'Retail', icon: ShoppingBag },
  { id: 'Dining', label: 'Dining', icon: Utensils },
  { id: 'Travel', label: 'Travel', icon: Plane },
  { id: 'Entertainment', label: 'Entertainment', icon: Star },
  { id: 'Wellness', label: 'Wellness', icon: TrendingUp },
  { id: 'Technology', label: 'Technology', icon: ExternalLink },
  { id: 'Lifestyle', label: 'Lifestyle', icon: Tag },
];

const statusMultipliers: Record<number, number> = {
  0: 1.0,
  1: 1.1,
  2: 1.25,
  3: 1.4,
  4: 1.6,
  5: 2.0,
};

export function BrandPartnersPage({ onBack, onNavigateToStatus, onNavigateToRewards, onNavigateToBrandDetail }: BrandPartnersPageProps) {
  const { profile } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [featuredBrands, setFeaturedBrands] = useState<Brand[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [loading, setLoading] = useState(true);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  
  const userLevel = profile?.level || 0;
  const multiplier = statusMultipliers[userLevel] || 1.0;

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    let filtered = brands;
    
    // Apply category filter
    if (activeCategory !== 'all') {
      filtered = filtered.filter(b => b.category === activeCategory);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.name.toLowerCase().includes(query) || 
        b.description.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'rate-high':
          return b.base_earning_rate - a.base_earning_rate;
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
    
    setFilteredBrands(sorted.filter(b => !b.is_featured));
    setFeaturedBrands(sorted.filter(b => b.is_featured));
  }, [activeCategory, searchQuery, sortBy, brands]);

  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') return brands.length;
    return brands.filter(b => b.category === categoryId).length;
  };

  const loadBrands = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      setBrands(data || []);
      setFeaturedBrands((data || []).filter(b => b.is_featured));
      setFilteredBrands((data || []).filter(b => !b.is_featured));
    } catch (error: any) {
      console.error('Error loading brands:', error);
      toast.error('Failed to load brand partners');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBrand = (brand: Brand) => {
    onNavigateToBrandDetail(brand.id);
  };

  const calculateMultipliedRate = (baseRate: number) => {
    return (baseRate * multiplier).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <Store className="w-4 h-4" />
                Brands
              </Button>
              <Button variant="outline" className="gap-2" onClick={onNavigateToStatus}>
                <Trophy className="w-4 h-4" />
                Status
              </Button>
              <Button variant="outline" className="gap-2" onClick={onNavigateToRewards}>
                <Gift className="w-4 h-4" />
                Rewards
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
              <Store className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Alliance Brand Partners</h1>
              <p className="text-muted-foreground">Brands that honor your Crescendo Status Benefits</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* How Shop & Earn Works */}
        <Card className="bg-primary/5">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              How Shop & Earn Works
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Browse Partners</h3>
                  <p className="text-sm text-muted-foreground">Discover brands across retail, dining, travel, and more</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Shop & Link</h3>
                  <p className="text-sm text-muted-foreground">Click through to shop and link your purchase to your account</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Earn NCTR</h3>
                  <p className="text-sm text-muted-foreground">Base rate × your status multiplier ({multiplier}x)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Earnings Multiplier Banner */}
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Your Current Earnings Multiplier</p>
              <p className="text-5xl font-bold">{multiplier}x</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90 mb-1">Example: 5 NCTR base rate</p>
              <p className="text-3xl font-bold">= {(5 * multiplier).toFixed(2)} NCTR per $1</p>
            </div>
          </CardContent>
        </Card>

        {/* Featured Partners Carousel */}
        {featuredBrands.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Star className="w-6 h-6 text-primary" />
              Featured Partners
            </h2>
            <Carousel
              setApi={setCarouselApi}
              plugins={[
                Autoplay({
                  delay: 5000,
                }),
              ]}
              className="w-full"
            >
              <CarouselContent>
                {featuredBrands.map((brand) => (
                  <CarouselItem key={brand.id}>
                    <Card className="overflow-hidden">
                      <div className="relative h-[400px] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                        <div className="absolute top-4 left-4 flex gap-2">
                          <Badge className="bg-primary">
                            <Star className="w-3 h-3 mr-1" />
                            Featured Partner
                          </Badge>
                          <Badge variant="secondary">{brand.category}</Badge>
                        </div>
                        
                        <div className="text-center px-8 space-y-6">
                          <div className="flex items-center justify-center gap-4">
                            <div 
                              className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
                              style={{ backgroundColor: brand.logo_color }}
                            >
                              {brand.logo_emoji}
                            </div>
                            <h3 className="text-5xl font-bold">{brand.name}</h3>
                          </div>
                          
                          <p className="text-lg text-muted-foreground max-w-2xl">
                            {brand.description}
                          </p>
                          
                          
                          <Button 
                            size="lg" 
                            className="gap-2"
                            onClick={() => handleViewBrand(brand)}
                          >
                            View Opportunities
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          </div>
        )}

        {/* Search and Filter */}
        <Card className="sticky top-[73px] z-[5] bg-background/95 backdrop-blur">
          <CardContent className="p-6 space-y-4">
            {/* Search Bar and Sort */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search brands by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    Clear
                  </Button>
                )}
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px] h-12">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="rate-high">Highest Rate</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filters */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Filter by Category</h2>
                <Badge variant="secondary" className="text-sm">
                  {filteredBrands.length + featuredBrands.length} Partners
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeCategory === category.id;
                  const count = getCategoryCount(category.id);
                  return (
                    <Button
                      key={category.id}
                      variant={isActive ? 'default' : 'outline'}
                      onClick={() => setActiveCategory(category.id)}
                      className="gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {category.label}
                      <Badge 
                        variant={isActive ? 'secondary' : 'outline'} 
                        className="ml-1 px-1.5 py-0 text-xs"
                      >
                        {count}
                      </Badge>
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Partners Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            {activeCategory === 'all' ? 'All Partners' : categories.find(c => c.id === activeCategory)?.label}
          </h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading partners...</p>
            </div>
          ) : filteredBrands.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No partners found in this category</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredBrands.map((brand) => (
                <Card key={brand.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
                        style={{ backgroundColor: brand.logo_color }}
                      >
                        {brand.logo_emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-bold mb-1">{brand.name}</h3>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground">{brand.description}</p>
                    
                    <Button
                      className="w-full gap-2" 
                      variant="outline"
                      onClick={() => handleViewBrand(brand)}
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Opportunities
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Earning Tips */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Earning Tips</h2>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Status Multiplier Applies</h3>
                  <p className="text-sm text-muted-foreground">
                    Your status level multiplier automatically applies to all partner earnings
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Higher Tiers, Better Rates</h3>
                  <p className="text-sm text-muted-foreground">
                    Some partners offer exclusive higher rates for Gold, Platinum, and Diamond members
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Stack with Promotions</h3>
                  <p className="text-sm text-muted-foreground">
                    Earn even more during special promotional periods and bonus events
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <LinkIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Link Your Accounts</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect your payment methods for automatic earning tracking
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand CTA */}
        <Card className="bg-primary/10">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary mx-auto mb-4 flex items-center justify-center">
              <Store className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Are You a Brand?</h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join the Crescendo Rewards Alliance and connect with our engaged community of members. 
              Drive sales while rewarding loyal customers with NCTR tokens.
            </p>
            <Button size="lg" className="gap-2">
              <Trophy className="w-4 h-4" />
              Become a Partner
              <ExternalLink className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 pb-0 ${className}`}>{children}</div>;
}
