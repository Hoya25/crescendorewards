import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';

export interface EarningsEntry {
  id: string;
  source: string;
  title: string;
  amount: number;
  status: string;
  created_at: string;
}

export function useBountyEarningsHistory(enabled: boolean) {
  const { profile } = useUnifiedUser();

  return useQuery({
    queryKey: ['bounty-earnings-history', profile?.id],
    queryFn: async (): Promise<EarningsEntry[]> => {
      if (!profile?.id) return [];

      const { data, error } = await supabase.rpc('get_bounty_earnings_history', {
        p_user_id: profile.id,
      });

      if (error) throw error;
      return (data as unknown as EarningsEntry[]) ?? [];
    },
    enabled: enabled && !!profile?.id,
    staleTime: 60 * 1000,
  });
}
