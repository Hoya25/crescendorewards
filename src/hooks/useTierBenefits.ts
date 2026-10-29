import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  resolveTier, progressLabel, nextTierFor, opensAt,
  type TierRow, type TierSayRow, type OpenReward, type TierBenefitRows,
} from '@/lib/tierBenefits';

/** Single source for EARN · OPENS · YOUR SAY · PERKS on every surface. */
export function useTierBenefits(balance?: number) {
  const tiersQ = useQuery({
    queryKey: ['tier-benefits', 'tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('status_tiers')
        .select('tier_name, display_name, min_nctr_360_locked, earning_multiplier')
        .eq('is_active', true)
        .order('min_nctr_360_locked', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((t) => ({ ...t, min_nctr_360_locked: Number(t.min_nctr_360_locked), earning_multiplier: Number(t.earning_multiplier) })) as TierRow[];
    },
    staleTime: 5 * 60 * 1000,
  });
  const sayQ = useQuery({
    queryKey: ['tier-benefits', 'say'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tier_benefits').select('tier_name, backing_weight, can_nominate, council_eligible, perks');
      if (error) throw error;
      return (data ?? []).map((s) => ({ ...s, backing_weight: Number(s.backing_weight), perks: Array.isArray(s.perks) ? (s.perks as string[]) : [] })) as TierSayRow[];
    },
    staleTime: 5 * 60 * 1000,
  });
  const rewardsQ = useQuery({
    queryKey: ['tier-benefits', 'opens'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('id, title, image_url, min_tier_required')
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as OpenReward[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const tiers = tiersQ.data ?? [];
  const says = sayQ.data ?? [];
  const rewards = rewardsQ.data ?? [];

  return useMemo(() => {
    const rows: TierBenefitRows[] = tiers.map((t) => resolveTier(t, tiers, says, rewards));
    const next = balance !== undefined ? nextTierFor(tiers, balance) : null;
    return {
      isLoading: tiersQ.isLoading || sayQ.isLoading || rewardsQ.isLoading,
      tiers,
      rows,
      forTier: (name?: string | null) => rows.find((r) => r.tier.tier_name.toLowerCase() === (name || '').toLowerCase()) ?? null,
      next,
      nextOpens: next ? opensAt(next, rewards) : [],
      remaining: next && balance !== undefined ? Math.max(0, next.min_nctr_360_locked - balance) : 0,
      progressLabel: balance !== undefined ? progressLabel(balance, tiers, rewards) : null,
    };
  }, [tiers, says, rewards, balance, tiersQ.isLoading, sayQ.isLoading, rewardsQ.isLoading]);
}
