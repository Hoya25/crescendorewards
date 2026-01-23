import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReferralMilestone {
  id: string;
  referral_count: number;
  nctr_reward: number;
  claims_reward: number;
  badge_name: string | null;
  badge_emoji: string | null;
  title_unlock: string | null;
  description: string | null;
  is_active: boolean;
}

export function useReferralMilestones() {
  return useQuery({
    queryKey: ['referral-milestones'],
    queryFn: async (): Promise<ReferralMilestone[]> => {
      const { data, error } = await supabase
        .from('referral_milestones')
        .select('*')
        .eq('is_active', true)
        .order('referral_count', { ascending: true });

      if (error) {
        console.error('Error fetching referral milestones:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - milestones rarely change
  });
}

export function useCheckMilestones(userId: string | undefined) {
  return useQuery({
    queryKey: ['check-milestones', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase.rpc('check_referral_milestones', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error checking milestones:', error);
        throw error;
      }

      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
