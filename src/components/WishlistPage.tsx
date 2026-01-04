import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, Trash2, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

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
  claimBalance: number;
}

const categoryLabels: Record<string, string> = {
  alliance_tokens: 'Alliance Tokens',
  experiences: 'Experiences',
  merch: 'Merch',
  gift_cards: 'Gift Cards',
  wellness: 'Wellness & Health',
  opportunity: 'Opportunity',
};

export function WishlistPage({ claimBalance }: WishlistPageProps) {
  const navigate = useNavigate();
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
        p_user_id: user.id,
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

  const removeFromWishlist = async (wishlistId: string) => {
    try {
      const { error } = await supabase
        .from('reward_wishlists')
        .delete()
        .eq('id', wishlistId);

      if (error) throw error;

      setWishlist(wishlist.filter(item => item.wishlist_id !== wishlistId));
      toast({
        title: 'Removed',
        description: 'Item removed from wishlist',
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Heart className="w-8 h-8 text-red-500" />
            My Wishlist
          </h1>
          <p className="text-muted-foreground mt-1">
            Rewards you're saving for later
          </p>
        </div>

        {wishlist.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Your Wishlist is Empty</h3>
              <p className="text-muted-foreground mb-4">
                Browse rewards and add items to your wishlist!
              </p>
              <Button onClick={() => navigate('/rewards')}>
                Explore Rewards
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {wishlist.map((item) => (
              <Card key={item.wishlist_id} className="overflow-hidden">
                <div className="aspect-video overflow-hidden">
                  <ImageWithFallback
                    src={item.reward_image || '/placeholder.svg'}
                    alt={item.reward_title}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => navigate(`/rewards/${item.reward_id}`)}
                  />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle 
                      className="text-lg cursor-pointer hover:text-violet-600"
                      onClick={() => navigate(`/rewards/${item.reward_id}`)}
                    >
                      {item.reward_title}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromWishlist(item.wishlist_id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <CardDescription>
                    {categoryLabels[item.reward_category] || item.reward_category}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex items-center justify-between">
                  <Badge variant="secondary">{item.reward_cost} Claims</Badge>
                  {claimBalance >= item.reward_cost ? (
                    <Badge className="bg-green-100 text-green-700">
                      Can Afford
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      Need {item.reward_cost - claimBalance} more
                    </Badge>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
