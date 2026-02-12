import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';

export interface UncelebratedPurchase {
  id: string;
  nctr_earned: number;
  order_total: number;
  customer_name: string | null;
  metadata: any;
  shopify_data: any;
  created_at: string;
}

export function useUncelebratedPurchases() {
  const { profile } = useUnifiedUser();

  const query = useQuery({
    queryKey: ['uncelebrated-purchases', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('shop_transactions')
        .select('id, nctr_earned, order_total, customer_name, metadata, shopify_data, created_at')
        .eq('user_id', profile.id)
        .eq('celebrated', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as UncelebratedPurchase[];
    },
    enabled: !!profile?.id,
    staleTime: 30 * 1000,
  });

  return query;
}

export function useMarkCelebrated() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionIds: string[]) => {
      const { error } = await supabase
        .from('shop_transactions')
        .update({ celebrated: true })
        .in('id', transactionIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uncelebrated-purchases'] });
    },
  });
}

export function useUncompletedMerchBountyCount() {
  const { profile, tier } = useUnifiedUser();
  const tierName = (tier?.tier_name || 'bronze').toLowerCase();
  const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const tierIndex = TIER_ORDER.indexOf(tierName);

  return useQuery({
    queryKey: ['uncompleted-merch-bounties', profile?.id, tierName],
    queryFn: async () => {
      if (!profile?.id) return { count: 0, totalPossibleNctr: 0 };

      // Get all active merch bounties
      const { data: bounties, error: bErr } = await supabase
        .from('bounties')
        .select('id, nctr_reward, lock_multiplier, min_status_required')
        .eq('is_active', true)
        .eq('requires_purchase', true);

      if (bErr) throw bErr;

      // Get user's completed bounty claims
      const { data: claims, error: cErr } = await supabase
        .from('bounty_claims')
        .select('bounty_id')
        .eq('user_id', profile.id)
        .in('status', ['completed', 'pending']);

      if (cErr) throw cErr;

      const completedIds = new Set((claims || []).map(c => c.bounty_id));

      // Filter to accessible + uncompleted
      const accessibleStatuses: (string | null)[] = [null];
      for (let i = 0; i <= tierIndex; i++) {
        accessibleStatuses.push(TIER_ORDER[i]);
      }

      let count = 0;
      let totalPossibleNctr = 0;
      for (const b of bounties || []) {
        const req = b.min_status_required?.toLowerCase() || null;
        const accessible = req === null || accessibleStatuses.includes(req);
        if (accessible && !completedIds.has(b.id)) {
          count++;
          totalPossibleNctr += Math.round(b.nctr_reward * (b.lock_multiplier || 3));
        }
      }

      return { count, totalPossibleNctr };
    },
    enabled: !!profile?.id,
    staleTime: 60 * 1000,
  });
}

export function useHasMerchPurchases() {
  const { profile } = useUnifiedUser();

  return useQuery({
    queryKey: ['has-merch-purchases', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return false;
      const { count, error } = await supabase
        .from('merch_purchase_bounty_eligibility')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id);

      if (error) throw error;
      return (count || 0) > 0;
    },
    enabled: !!profile?.id,
    staleTime: 2 * 60 * 1000,
  });
}
