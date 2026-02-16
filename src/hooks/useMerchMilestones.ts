import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';

export interface MerchMilestoneData {
  total_merch_purchases: number;
  first_merch_completed: boolean;
  total_merch_drip_nctr: number;
}

export function useMerchMilestones() {
  const { profile } = useUnifiedUser();

  return useQuery({
    queryKey: ['merch-milestones', profile?.id],
    queryFn: async (): Promise<MerchMilestoneData> => {
      if (!profile?.id) {
        return {
          total_merch_purchases: 0,
          first_merch_completed: false,
          total_merch_drip_nctr: 0,
        };
      }

      const { data, error } = await supabase.rpc('get_merch_milestones', {
        p_user_id: profile.id,
      });

      if (error) throw error;

      const result = data as unknown as MerchMilestoneData;
      return {
        total_merch_purchases: result.total_merch_purchases ?? 0,
        first_merch_completed: result.first_merch_completed ?? false,
        total_merch_drip_nctr: result.total_merch_drip_nctr ?? 0,
      };
    },
    enabled: !!profile?.id,
    staleTime: 60 * 1000,
  });
}
