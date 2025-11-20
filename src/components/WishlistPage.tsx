import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, Trash2, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface WishlistItem {
  wishlist_id: string;
  reward_id: string;
  reward_title: string;
  reward_cost: number;
  reward_image: string | null;
  reward_category: string;
  notes: string | null;
  added_at: string;
}

interface WishlistPageProps {
  onBack: () => void;
  onViewRewardDetail?: (rewardId: string) => void;
  claimBalance: number;
}

const categoryLabels: Record<string, string> = {
  alliance_tokens: 'Alliance Tokens',
  experiences: 'Experiences',
  merch: 'Merch',
  gift_cards: 'Gift Cards',
  wellness: 'Wellness & Health',
};

export function WishlistPage({ onBack, onViewRewardDetail, claimBalance }: WishlistPageProps) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_user_wishlist', {
        p_user_id: user.id
      });

      if (error) throw error;
      setWishlist(data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to load wishlist',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (wishlistId: string, rewardTitle: string) => {
    try {
      const { error } = await supabase
        .from('reward_wishlists')
        .delete()
        .eq('id', wishlistId);

      if (error) throw error;

      toast({
        title: 'Removed',
        description: `${rewardTitle} removed from wishlist`,
      });

      // Refresh wishlist
      fetchWishlist();
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove from wishlist',
        variant: 'destructive',
      });
    }
  };

  const getTotalCost = () => {
    return wishlist.reduce((sum, item) => sum + item.reward_cost, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary/10">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                My Wishlist
              </h1>
              <p className="text-muted-foreground mt-1">
                {wishlist.length} {wishlist.length === 1 ? 'reward' : 'rewards'} saved for later
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Wishlist Items</p>
                  <p className="text-3xl font-bold">{wishlist.length}</p>
                </div>
                <Heart className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border-accent/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="text-3xl font-bold">{getTotalCost()} Claims</p>
                </div>
                <Gift className="h-8 w-8 text-accent/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Your Balance</p>
                  <p className="text-3xl font-bold">{claimBalance} Claims</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wishlist Items */}
        {wishlist.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Your Wishlist is Empty</h3>
              <p className="text-muted-foreground mb-4">
                Start adding rewards you'd like to claim later!
              </p>
              <Button onClick={onBack}>Browse Rewards</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => {
              const canAfford = claimBalance >= item.reward_cost;

              return (
                <Card key={item.wishlist_id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="relative aspect-video overflow-hidden">
                    <ImageWithFallback
                      src={item.reward_image || '/placeholder.svg'}
                      alt={item.reward_title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <Badge className="absolute top-2 right-2 bg-background/90">
                      {item.reward_cost} Claims
                    </Badge>
                  </div>
                  
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="secondary">
                        {categoryLabels[item.reward_category] || item.reward_category}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2">{item.reward_title}</CardTitle>
                    <CardDescription className="text-xs">
                      Added {new Date(item.added_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>

                  <CardFooter className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant={canAfford ? 'default' : 'secondary'}
                      disabled={!canAfford}
                      onClick={() => onViewRewardDetail?.(item.reward_id)}
                    >
                      {canAfford ? 'Claim Now' : 'Insufficient Claims'}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveFromWishlist(item.wishlist_id, item.reward_title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
