import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface StreakStatus {
  streak: number;
  checked_in_today: boolean;
  max: number;
}

interface CheckinResult {
  success: boolean;
  already_checked_in: boolean;
  streak: number;
  streak_completed: boolean;
  reward?: number;
  message: string;
}

export function useCheckinStreak() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const streakQuery = useQuery({
    queryKey: ['checkin-streak', user?.id],
    queryFn: async (): Promise<StreakStatus> => {
      if (!user?.id) return { streak: 0, checked_in_today: false, max: 7 };

      const { data, error } = await supabase.rpc('get_checkin_streak', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data as unknown as StreakStatus;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  const checkinMutation = useMutation({
    mutationFn: async (): Promise<CheckinResult> => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('perform_daily_checkin', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data as unknown as CheckinResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-streak', user?.id] });
    },
  });

  return {
    streak: streakQuery.data?.streak ?? 0,
    checkedInToday: streakQuery.data?.checked_in_today ?? false,
    max: streakQuery.data?.max ?? 7,
    isLoading: streakQuery.isLoading,
    checkIn: checkinMutation.mutateAsync,
    isCheckingIn: checkinMutation.isPending,
  };
}
