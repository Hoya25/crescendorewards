import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface LeaderboardEntry {
  rank: number;
  display_name: string;
  referral_count: number;
  paid_referrals: number;
  is_current_user?: boolean;
}

interface CurrentUserEntry {
  rank: number | null;
  display_name: string;
  referral_count: number;
  paid_referrals: number;
  opted_in: boolean;
}

interface LeaderboardData {
  top_10: LeaderboardEntry[];
  current_user: CurrentUserEntry;
  month: string;
  bonus_nctr: number;
}

export function useReferralLeaderboard() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const leaderboardQuery = useQuery({
    queryKey: ['referral-leaderboard', user?.id],
    queryFn: async (): Promise<LeaderboardData> => {
      const { data, error } = await supabase.rpc('get_referral_leaderboard', {
        p_user_id: user?.id ?? null,
      });
      if (error) throw error;
      const d = data as Record<string, unknown>;
      return {
        top_10: (d.top_10 as LeaderboardEntry[]) || [],
        current_user: (d.current_user as CurrentUserEntry) || { rank: null, display_name: '', referral_count: 0, paid_referrals: 0, opted_in: false },
        month: (d.month as string) || '',
        bonus_nctr: (d.bonus_nctr as number) || 5000,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  const toggleOptIn = useMutation({
    mutationFn: async (optIn: boolean) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase.rpc('toggle_leaderboard_opt_in', {
        p_user_id: user.id,
        p_opt_in: optIn,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-leaderboard'] });
    },
  });

  return {
    data: leaderboardQuery.data,
    isLoading: leaderboardQuery.isLoading,
    toggleOptIn: toggleOptIn.mutateAsync,
    isToggling: toggleOptIn.isPending,
  };
}
