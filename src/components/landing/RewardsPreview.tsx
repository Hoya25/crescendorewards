import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { ArrowRight, Gift } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';

interface PreviewReward {
  id: string;
  title: string;
  image_url: string | null;
  min_status_tier: string | null;
}

const tierStyle: Record<string, string> = {
  bronze: 'bg-amber-700/10 text-amber-700 border-amber-700/20',
  silver: 'bg-slate-400/10 text-slate-600 border-slate-400/20',
  gold: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  platinum: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  diamond: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
  member: 'bg-cta/10 text-foreground border-cta/20',
};

const tierLabel: Record<string, string> = {
  bronze: 'Bronze Status',
  silver: 'Silver Status',
  gold: 'Gold Status',
  platinum: 'Platinum Status',
  diamond: 'Diamond Status',
  member: 'All Members',
};

interface RewardsPreviewProps {
  onJoin: () => void;
}

export function RewardsPreview({ onJoin }: RewardsPreviewProps) {
  const [rewards, setRewards] = useState<PreviewReward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from('rewards')
          .select('id, title, image_url, min_status_tier')
          .eq('is_active', true)
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(6);
        setRewards(data || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <section className="py-16 md:py-24 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-10 w-64 mx-auto mb-10" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (rewards.length === 0) return null;

  return (
    <section className="py-16 md:py-24 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-4 text-foreground">
          Rewards Worth Earning
        </h2>
        <p className="text-center text-muted-foreground max-w-xl mx-auto mb-10">
          These are real rewards from real partners. And new ones are added by the community every week.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {rewards.map((reward) => {
            const tier = (reward.min_status_tier || 'member').toLowerCase();
            return (
              <div
                key={reward.id}
                className="group relative rounded-xl overflow-hidden border bg-background hover:shadow-lg transition-all duration-300"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                  {reward.image_url ? (
                    <ImageWithFallback
                      src={reward.image_url}
                      alt={reward.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gift className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <Badge variant="outline" className={`mb-1.5 text-[10px] ${tierStyle[tier] || tierStyle.member}`}>
                    {tierLabel[tier] || 'All Members'}
                  </Badge>
                  <h3 className="font-bold text-sm text-white leading-tight line-clamp-2 drop-shadow-md">
                    {reward.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Button
            size="lg"
            onClick={onJoin}
            className="bg-cta hover:bg-cta/90 text-cta-foreground font-semibold rounded-full px-8 gap-2"
          >
            Start Earning <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
