import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';

export interface Bounty {
  id: string;
  title: string;
  description: string | null;
  category: string;
  nctr_reward: number;
  image_url: string | null;
  image_emoji: string | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  total_completions: number;
  max_completions: number | null;
  expires_at: string | null;
  min_status_required: string | null;
  requires_360lock: boolean;
  lock_multiplier: number;
  requires_purchase: boolean;
  purchase_product_type: string | null;
  bounty_tier: string;
  is_recurring: boolean;
  recurrence_period: string | null;
  cta_text: string | null;
  instructions: string | null;
  completion_message: string | null;
  created_at: string;
}

export interface BountyClaim {
  id: string;
  user_id: string;
  bounty_id: string;
  nctr_earned: number;
  multiplier_applied: number;
  locked_to_360: boolean;
  status: string;
  completed_at: string | null;
  created_at: string;
}

export function useBounties() {
  return useQuery({
    queryKey: ['bounties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bounties')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data || []) as Bounty[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useBountyClaims() {
  const { profile } = useUnifiedUser();

  return useQuery({
    queryKey: ['bounty-claims', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('bounty_claims')
        .select('*')
        .eq('user_id', profile.id);

      if (error) throw error;
      return (data || []) as BountyClaim[];
    },
    enabled: !!profile?.id,
    staleTime: 60 * 1000,
  });
}

export function useMerchEligibility() {
  const { profile } = useUnifiedUser();

  return useQuery({
    queryKey: ['merch-eligibility', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('merch_purchase_bounty_eligibility')
        .select('*')
        .eq('user_id', profile.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useBountyStats() {
  return useQuery({
    queryKey: ['bounty-stats'],
    queryFn: async () => {
      const { data: bounties, error: bErr } = await supabase
        .from('bounties')
        .select('id, bounty_tier, nctr_reward, total_completions, lock_multiplier')
        .eq('is_active', true);

      if (bErr) throw bErr;

      const merchBounties = (bounties || []).filter(b => 
        (b.bounty_tier as string)?.startsWith('merch_')
      );

      return {
        activeMerchCount: merchBounties.length,
        totalNctrEarned: merchBounties.reduce(
          (sum, b) => sum + ((b.nctr_reward as number) * (b.lock_multiplier as number) * (b.total_completions as number)), 0
        ),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Helper: check if user completed a recurring bounty in current period
export function hasCompletedInPeriod(
  claims: BountyClaim[],
  bountyId: string,
  period: string | null
): boolean {
  if (!period) return false;
  const now = new Date();
  const completedClaims = claims.filter(
    c => c.bounty_id === bountyId && c.status === 'completed' && c.completed_at
  );

  for (const claim of completedClaims) {
    const completedAt = new Date(claim.completed_at!);
    switch (period) {
      case 'daily':
        if (completedAt.toDateString() === now.toDateString()) return true;
        break;
      case 'weekly': {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
        startOfWeek.setHours(0, 0, 0, 0);
        if (completedAt >= startOfWeek) return true;
        break;
      }
      case 'monthly': {
        if (completedAt.getMonth() === now.getMonth() && completedAt.getFullYear() === now.getFullYear()) return true;
        break;
      }
    }
  }
  return false;
}

// Helper: get period reset label
export function getPeriodResetLabel(period: string | null): string {
  switch (period) {
    case 'daily': return 'Resets tomorrow';
    case 'weekly': return 'Resets Monday';
    case 'monthly': return 'Resets next month';
    default: return '';
  }
}
