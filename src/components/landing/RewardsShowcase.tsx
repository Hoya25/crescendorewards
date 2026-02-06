import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { ChevronRight, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ShowcaseReward {
  id: string;
  title: string;
  image_url: string | null;
  category: string;
  cost: number;
}

export function RewardsShowcase() {
  const navigate = useNavigate();
  const [rewards, setRewards] = useState<ShowcaseReward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const { data, error } = await supabase
          .from('rewards')
          .select('id, title, image_url, category, cost')
          .eq('is_active', true)
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(8);

        if (error) throw error;
        setRewards(data || []);
      } catch (error) {
        console.error('Error fetching showcase rewards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, []);

  if (loading) {
    return (
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-64 mx-auto mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (rewards.length === 0) return null;

  return (
    <section className="py-12 md:py-20 px-4 md:px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-4xl font-bold mb-3">What Can You Unlock?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Real rewards from real brands — streaming, gift cards, experiences, and more.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {rewards.map((reward) => (
            <Card
              key={reward.id}
              className="group cursor-pointer overflow-hidden border hover:border-primary/40 hover:shadow-lg transition-all rounded-xl"
              onClick={() => navigate(`/rewards/${reward.id}`)}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                {reward.image_url ? (
                  <ImageWithFallback
                    src={reward.image_url}
                    alt={reward.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <Lock className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {reward.cost > 0 && (
                  <Badge className="absolute top-2 left-2 bg-primary/90 text-primary-foreground border-0 text-xs">
                    {reward.cost} Claims
                  </Badge>
                )}
              </div>
              <CardContent className="p-3">
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {reward.title}
                </h3>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={() => navigate('/rewards')}
            className="gap-2"
          >
            View All Rewards <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
