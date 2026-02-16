import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';

export interface PurchaseMilestoneData {
  total_purchases: number;
  total_merch_purchases: number;
  milestones_hit: number[];
  next_milestone: number | null;
  total_drip_nctr: number;
}

export function usePurchaseMilestones() {
  const { profile } = useUnifiedUser();

  return useQuery({
    queryKey: ['purchase-milestones', profile?.id],
    queryFn: async (): Promise<PurchaseMilestoneData> => {
      if (!profile?.id) {
        return {
          total_purchases: 0,
          total_merch_purchases: 0,
          milestones_hit: [],
          next_milestone: 1,
          total_drip_nctr: 0,
        };
      }

      const { data, error } = await supabase.rpc('get_purchase_milestones', {
        p_user_id: profile.id,
      });

      if (error) throw error;

      const result = data as unknown as PurchaseMilestoneData;
      return {
        total_purchases: result.total_purchases ?? 0,
        total_merch_purchases: result.total_merch_purchases ?? 0,
        milestones_hit: result.milestones_hit ?? [],
        next_milestone: result.next_milestone,
        total_drip_nctr: result.total_drip_nctr ?? 0,
      };
    },
    enabled: !!profile?.id,
    staleTime: 60 * 1000,
  });
}
