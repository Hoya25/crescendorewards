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

const tierEmoji: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  diamond: '👑',
};

const tierLabel: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  diamond: 'Diamond',
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
      <section className="py-20 md:py-28 px-4 md:px-6" style={{ background: '#1A1A1A' }}>
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-10 w-64 mx-auto mb-10 bg-white/5" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl bg-white/5" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (rewards.length === 0) return null;

  return (
    <section className="py-20 md:py-28 px-4 md:px-6" style={{ background: '#1A1A1A' }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-3 text-white">
          A Taste of What's Waiting
        </h2>
        <p className="text-center max-w-xl mx-auto mb-12 text-sm md:text-base" style={{ color: '#999' }}>
          Real rewards from real partners. New ones added by the community every week.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {rewards.map((reward) => {
            const tier = (reward.min_status_tier || 'member').toLowerCase();
            return (
              <div
                key={reward.id}
                className="group relative rounded-xl overflow-hidden border transition-all duration-300 hover:border-[rgba(170,255,0,0.3)]"
                style={{ background: '#222', borderColor: '#333' }}
              >
                <div className="aspect-[4/3] w-full overflow-hidden" style={{ background: '#2a2a2a' }}>
                  {reward.image_url ? (
                    <ImageWithFallback
                      src={reward.image_url}
                      alt={reward.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gift className="w-12 h-12" style={{ color: '#444' }} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <Badge
                    variant="outline"
                    className="mb-1.5 text-[10px] border-white/20 text-white/80"
                  >
                    {tierEmoji[tier] || '⭐'} {tierLabel[tier] || 'All Members'}
                  </Badge>
                  <h3 className="font-bold text-sm text-white leading-tight line-clamp-2 drop-shadow-md">
                    {reward.title}
                  </h3>
                </div>
                {/* Join overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                  <span
                    className="text-sm font-bold px-4 py-2 rounded-full"
                    style={{ background: '#AAFF00', color: '#111' }}
                  >
                    Join to Unlock
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            onClick={onJoin}
            className="font-semibold rounded-full px-8 gap-2"
            style={{ background: '#AAFF00', color: '#111' }}
          >
            Join and Start Unlocking <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
