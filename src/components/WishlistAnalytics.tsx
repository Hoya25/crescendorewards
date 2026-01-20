import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { TrendingUp, Heart, Clock, Flame } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface WishlistAnalytic {
  reward_id: string;
  reward_title: string;
  reward_cost: number;
  reward_image: string | null;
  reward_category: string;
  wishlist_count: number;
  recent_adds: number;
  avg_days_on_wishlist: number;
  is_trending: boolean;
}

const categoryLabels: Record<string, string> = {
  alliance_tokens: 'Alliance Tokens',
  experiences: 'Experiences',
  merch: 'Merch',
  gift_cards: 'Gift Cards',
  wellness: 'Wellness & Health',
};

export function WishlistAnalytics() {
  const [analytics, setAnalytics] = useState<WishlistAnalytic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_wishlist_analytics');

      if (error) throw error;
      setAnalytics(data || []);
    } catch (error) {
      console.error('Error fetching wishlist analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load wishlist analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const topWished = analytics.slice(0, 5);
  const trending = analytics.filter(item => item.is_trending).slice(0, 5);
  const totalWishlisted = analytics.reduce((sum, item) => sum + Number(item.wishlist_count), 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Wishlisted</p>
                <p className="text-3xl font-bold">{totalWishlisted}</p>
              </div>
              <Heart className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent border-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trending Items</p>
                <p className="text-3xl font-bold">{trending.length}</p>
              </div>
              <Flame className="h-8 w-8 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Popular Rewards</p>
                <p className="text-3xl font-bold">{analytics.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Wished Rewards */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Most Wished Rewards</CardTitle>
              <CardDescription>Top 5 rewards members want most</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {topWished.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No wishlist data available yet
            </div>
          ) : (
            <div className="space-y-4">
              {topWished.map((item, index) => (
                <div
                  key={item.reward_id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {index + 1}
                  </div>
                  
                  <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                    <ImageWithFallback
                      src={item.reward_image || '/placeholder.svg'}
                      alt={item.reward_title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{item.reward_title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {categoryLabels[item.reward_category] || item.reward_category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {item.reward_cost} Claims
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-primary font-semibold">
                      <Heart className="h-4 w-4" />
                      <span>{item.wishlist_count}</span>
                    </div>
                    {item.is_trending && (
                      <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">
                        <Flame className="h-3 w-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trending Rewards */}
      {trending.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <CardTitle>Trending Now</CardTitle>
                <CardDescription>Rewards gaining popularity this week</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trending.map((item) => (
                <div
                  key={item.reward_id}
                  className="group rounded-lg border overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="relative aspect-video">
                    <ImageWithFallback
                      src={item.reward_image || '/placeholder.svg'}
                      alt={item.reward_title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <Badge className="absolute top-2 right-2 bg-orange-500">
                      <Flame className="h-3 w-3 mr-1" />
                      +{item.recent_adds} this week
                    </Badge>
                  </div>
                  
                  <div className="p-4">
                    <h4 className="font-semibold line-clamp-1 mb-2">{item.reward_title}</h4>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-primary">
                        <Heart className="h-4 w-4" />
                        <span>{item.wishlist_count}</span>
                      </div>
                      <span className="text-muted-foreground">{item.reward_cost} Claims</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Distribution</CardTitle>
          <CardDescription>Wishlist items by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(
              analytics.reduce((acc, item) => {
                const category = categoryLabels[item.reward_category] || item.reward_category;
                acc[category] = (acc[category] || 0) + Number(item.wishlist_count);
                return acc;
              }, {} as Record<string, number>)
            )
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => {
                const percentage = totalWishlisted > 0 ? (count / totalWishlisted) * 100 : 0;
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{category}</span>
                      <span className="text-sm text-muted-foreground">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
