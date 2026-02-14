import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Clock, Lock, Flame, Gift, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/contexts/AuthContext';

interface MonthlyDrop {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  cost: number;
  claim_limit: number | null;
  total_claims: number | null;
  min_status_tier: string | null;
  publish_at: string;
  unpublish_at: string;
  category: string;
}

interface MonthlyDropsProps {
  userTierName: string;
  onViewReward: (rewardId: string) => void;
}

const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

const tierDisplayNames: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  diamond: 'Diamond',
};

function getDaysRemaining(unpublishAt: string): number {
  const now = new Date();
  const end = new Date(unpublishAt);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function isUserTierEligible(minTier: string | null, userTierName: string): boolean {
  if (!minTier) return true;
  const minIdx = tierOrder.indexOf(minTier.toLowerCase());
  const userIdx = tierOrder.indexOf(userTierName.toLowerCase());
  if (minIdx === -1 || userIdx === -1) return true;
  return userIdx >= minIdx;
}

export function MonthlyDrops({ userTierName, onViewReward }: MonthlyDropsProps) {
  const [drops, setDrops] = useState<MonthlyDrop[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    loadDrops();
  }, []);

  const loadDrops = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('rewards')
        .select('id, title, description, image_url, cost, claim_limit, total_claims, min_status_tier, publish_at, unpublish_at, category')
        .eq('is_active', true)
        .not('publish_at', 'is', null)
        .not('unpublish_at', 'is', null)
        .lte('publish_at', now)
        .gte('unpublish_at', now)
        .order('unpublish_at', { ascending: true });

      if (error) throw error;
      setDrops((data as MonthlyDrop[]) || []);
    } catch (err) {
      console.error('Failed to load monthly drops:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || drops.length === 0) return null;

  return (
    <section className="container mx-auto px-4 pt-6 pb-2 max-w-full">
      <div className="flex items-center gap-2.5 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h2 className="text-xl font-bold">This Month's Drops</h2>
        <Badge variant="secondary" className="text-xs">
          {drops.length} active
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {drops.map((drop) => {
          const eligible = isUserTierEligible(drop.min_status_tier, userTierName);
          const daysLeft = getDaysRemaining(drop.unpublish_at);
          const totalClaims = drop.total_claims ?? 0;
          const claimLimit = drop.claim_limit ?? 0;
          const claimProgress = claimLimit > 0 ? Math.min((totalClaims / claimLimit) * 100, 100) : 0;

          return (
            <Card
              key={drop.id}
              className={cn(
                "group cursor-pointer overflow-hidden transition-all duration-300 rounded-xl border shadow-md",
                "hover:scale-[1.02] hover:shadow-2xl",
                eligible
                  ? "border-orange-400/40 ring-1 ring-orange-400/20"
                  : "border-border/40 opacity-60 grayscale"
              )}
              onClick={() => eligible && onViewReward(drop.id)}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                {drop.image_url ? (
                  <ImageWithFallback
                    src={drop.image_url}
                    alt={drop.title}
                    className={cn(
                      "w-full h-full object-cover transition-transform duration-500",
                      eligible && "group-hover:scale-105"
                    )}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    <Gift className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                {/* LIMITED badge */}
                <Badge className="absolute top-3 left-3 bg-orange-500 text-white border-0 text-xs font-bold px-2.5 py-1 shadow-lg">
                  <Flame className="w-3 h-3 mr-1" />
                  LIMITED
                </Badge>

                {/* Min tier badge */}
                {drop.min_status_tier && (
                  <Badge className={cn(
                    "absolute top-3 right-3 text-xs font-semibold shadow-lg border-0 px-2.5 py-1",
                    eligible 
                      ? "bg-amber-500 text-white" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {eligible ? (
                      `${tierDisplayNames[drop.min_status_tier.toLowerCase()] || drop.min_status_tier}+`
                    ) : (
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {tierDisplayNames[drop.min_status_tier.toLowerCase()] || drop.min_status_tier}
                      </span>
                    )}
                  </Badge>
                )}

                {/* Lock overlay for ineligible */}
                {!eligible && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="text-center space-y-2">
                      <Lock className="w-8 h-8 text-white/80 mx-auto" />
                      <p className="text-white/90 text-sm font-medium">
                        Unlock with {tierDisplayNames[drop.min_status_tier?.toLowerCase() || ''] || drop.min_status_tier} status
                      </p>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/profile');
                        }}
                      >
                        View Status
                      </Button>
                    </div>
                  </div>
                )}

                {/* Title at bottom */}
                <div className="absolute left-0 right-0 bottom-0 p-4">
                  <h3 className="font-bold text-base text-white leading-tight line-clamp-2 drop-shadow-lg">
                    {drop.title}
                  </h3>
                </div>
              </div>

              {/* Content */}
              <div className="p-3.5 space-y-2.5 bg-card">
                {/* Countdown */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-orange-500 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {daysLeft === 0 ? 'Last day!' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                  </div>
                  {drop.cost > 0 && (
                    <div className="flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-primary" />
                      <span className="font-bold text-foreground">{drop.cost}</span>
                    </div>
                  )}
                  {drop.cost === 0 && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs font-semibold">
                      FREE
                    </Badge>
                  )}
                </div>

                {/* Progress bar */}
                {claimLimit > 0 && (
                  <div className="space-y-1">
                    <Progress 
                      value={claimProgress} 
                      className="h-2 bg-muted"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{totalClaims} claimed</span>
                      <span>{claimLimit - totalClaims} remaining</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
