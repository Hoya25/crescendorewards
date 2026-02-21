import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Heart, Sparkles } from 'lucide-react';
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
        <div
          className="rounded-xl px-4 py-3 max-w-xl text-sm leading-relaxed"
          style={{ backgroundColor: '#323232', color: '#E2FF6D' }}
        >
          <span className="font-semibold">How it works:</span>{' '}
          Shop through The Garden → Earn INSPIRATION → Commit via 360LOCK → Unlock these rewards.
          Your commitment unlocks value — you never spend your earned rewards.
        </div>
      </div>
    </section>
  );
}
