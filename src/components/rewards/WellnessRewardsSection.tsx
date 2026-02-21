import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Heart, Sparkles, Lock, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { VisualRewardCard } from '@/components/rewards/VisualRewardCard';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface WellnessReward {
  id: string;
  title: string;
  description: string;
  category: string;
  cost: number;
  image_url: string | null;
  stock_quantity: number | null;
  is_active: boolean;
  is_featured: boolean;
  sponsor_enabled?: boolean;
  sponsor_name?: string | null;
  sponsor_logo?: string | null;
  min_status_tier?: string | null;
  is_sponsored?: boolean;
  status_tier_claims_cost?: Record<string, number> | null;
}

const TIER_WELLNESS_UNLOCKS: { tier: string; level: number; color: string; emoji: string; items: string[] }[] = [
  { tier: 'Bronze', level: 1, color: '#CD7F32', emoji: '🥉', items: ['Kroma Starter Bundle ($75 value)', 'Access to all Bronze-tier wellness rewards'] },
  { tier: 'Silver', level: 2, color: '#C0C0C0', emoji: '🥈', items: ['Kroma Beauty Matcha 3-Pack ($120 value)', 'Kroma Super Core 3-Pack ($150 value)', '+ all Bronze rewards'] },
  { tier: 'Gold', level: 3, color: '#FFD700', emoji: '🥇', items: ['Kroma 5-Day Reset Kit ($385 value)', '+ all Silver & Bronze rewards'] },
  { tier: 'Platinum', level: 4, color: '#E5E4E2', emoji: '💎', items: ['Kroma VIP Reset + Consultation ($750 value)', '+ all Gold, Silver & Bronze rewards'] },
  { tier: 'Diamond', level: 5, color: '#B9F2FF', emoji: '👑', items: ['Everything + priority access to new INSPIRATION partner rewards', '+ founding recognition in the INSPIRATION ecosystem'] },
];

function TierUnlockPreview({ userTierLevel, userTierName }: { userTierLevel: number; userTierName: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-left hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-foreground">
            What each tier unlocks in INSPIRATION Wellness
          </span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            Your tier: {userTierName}
          </Badge>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 animate-fade-in">
          {TIER_WELLNESS_UNLOCKS.map((t) => {
            const isUnlocked = userTierLevel >= t.level;
            return (
              <div
                key={t.tier}
                className={cn(
                  'rounded-xl border p-3 transition-all relative overflow-hidden',
                  isUnlocked
                    ? 'border-primary/30 bg-card shadow-sm'
                    : 'border-border bg-muted/30 opacity-70'
                )}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-base">{t.emoji}</span>
                  <span className="text-xs font-bold" style={{ color: t.color }}>{t.tier}</span>
                  {isUnlocked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                  )}
                </div>
                <ul className="space-y-1">
                  {t.items.map((item, i) => (
                    <li key={i} className="text-[11px] leading-snug text-muted-foreground flex items-start gap-1">
                      <span className="shrink-0 mt-0.5">🌿</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {isUnlocked && (
                  <div
                    className="absolute inset-x-0 bottom-0 h-0.5"
                    style={{ backgroundColor: t.color }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function WellnessRewardsSection() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const { tier, profile } = useUnifiedUser();
  const { favorites, toggleFavorite, animatingIds } = useFavorites();
  const [rewards, setRewards] = useState<WellnessReward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWellnessRewards = async () => {
      try {
        const { data, error } = await supabase
          .from('rewards')
          .select('id, title, description, category, cost, image_url, stock_quantity, is_active, is_featured, sponsor_enabled, sponsor_name, sponsor_logo, min_status_tier, is_sponsored, status_tier_claims_cost')
          .eq('category', 'wellness')
          .eq('is_active', true)
          .order('is_featured', { ascending: false })
          .order('cost', { ascending: true });

        if (error) throw error;
        setRewards((data as WellnessReward[]) || []);
      } catch (err) {
        console.error('Error fetching wellness rewards:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWellnessRewards();
  }, []);

  if (loading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-full">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-xl" />)}
          </div>
        </div>
      </section>
    );
  }

  if (rewards.length === 0) return null;

  const userTier = tier
    ? { tierName: tier.display_name || tier.tier_name, tierLevel: tier.sort_order }
    : { tierName: 'Bronze', tierLevel: 1 };

  return (
    <section
      className="py-8 relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #F5EDE3 0%, hsl(var(--background)) 100%)',
      }}
    >
      <div className="container mx-auto px-4 max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-5 h-5 text-rose-500" />
              <h2 className="text-xl font-bold">
                ✨ Wellness Rewards — Powered by INSPIRATION
              </h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-lg">
              Earn through participation. Unlock through commitment. These rewards are earned, not bought.
            </p>
          </div>
          <Badge
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1 text-xs font-semibold border-0 whitespace-nowrap"
            style={{ backgroundColor: '#E2FF6D', color: '#323232' }}
          >
            <Sparkles className="w-3 h-3" />
            INSPIRATION Ecosystem
          </Badge>
        </div>

        {/* Kroma Cross-Link Banner */}
        <a
          href="https://thegarden.nctr.live"
          target="_blank"
          rel="noopener noreferrer"
          className="group mb-6 flex items-center gap-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-amber-50 dark:from-emerald-950/30 dark:to-amber-950/20 p-4 hover:shadow-md transition-all"
        >
          <span className="text-3xl shrink-0">🌿</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">
              Shop Kroma Wellness on The Garden → Earn INSPIRATION toward these rewards
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Every Kroma purchase earns NCTR. Commit via 360LOCK to unlock the rewards below.
            </p>
          </div>
          <span className="text-muted-foreground group-hover:translate-x-1 transition-transform text-lg shrink-0">→</span>
        </a>
        {/* Tier Unlock Preview */}
        <TierUnlockPreview userTierLevel={userTier.tierLevel} userTierName={userTier.tierName} />

        {/* Rewards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-5">
          {rewards.map((reward, i) => (
            <div
              key={reward.id}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <VisualRewardCard
                reward={{
                  ...reward,
                  is_sponsored: reward.sponsor_enabled || false,
                }}
                isInFavorites={favorites.has(reward.id)}
                onToggleFavorites={(id, e) => {
                  e.stopPropagation();
                  toggleFavorite(id);
                }}
                onClick={() => navigate(`/rewards/${reward.id}`)}
                isAnimatingHeart={animatingIds.has(reward.id)}
                claimBalance={profile?.crescendo_data?.claims_balance ?? 0}
                userTier={userTier}
              />
            </div>
          ))}
        </div>

        {/* Explainer Callout */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-3xl">
          <div
            className="rounded-xl px-4 py-3 flex-1 text-sm leading-relaxed"
            style={{ backgroundColor: '#323232', color: '#E2FF6D' }}
          >
            <span className="font-semibold">How it works:</span>{' '}
            Shop through The Garden → Earn INSPIRATION → Commit via 360LOCK → Unlock these rewards.
            Your commitment unlocks value — you never spend your earned rewards.
          </div>
          <a
            href="https://thegarden.nctr.live"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl px-4 py-3 text-sm leading-relaxed border border-emerald-200 dark:border-emerald-800 bg-card hover:bg-accent transition-colors flex items-center gap-2 sm:max-w-[240px]"
          >
            <span className="text-base">🛒</span>
            <span>
              <span className="font-semibold block text-foreground">Shop Kroma &amp; 6,000+ brands</span>
              <span className="text-muted-foreground text-xs">on The Garden to earn toward these rewards →</span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
