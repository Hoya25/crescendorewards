import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface AdminNotifications {
  pendingClaims: number;
  pendingSubmissions: number;
  loading: boolean;
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotifications>({
    pendingClaims: 0,
    pendingSubmissions: 0,
    loading: true,
  });

  const fetchCounts = useCallback(async () => {
    try {
      const [claimsResult, submissionsResult] = await Promise.all([
        supabase
          .from('rewards_claims')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('reward_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .eq('is_latest_version', true),
      ]);

      setNotifications({
        pendingClaims: claimsResult.count || 0,
        pendingSubmissions: submissionsResult.count || 0,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      setNotifications(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchCounts();

    // Refresh every 30 seconds
    const interval = setInterval(fetchCounts, 30000);

    // Subscribe to realtime updates
    const claimsChannel = supabase
      .channel('admin-claims-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rewards_claims',
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    const submissionsChannel = supabase
      .channel('admin-submissions-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reward_submissions',
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(claimsChannel);
      supabase.removeChannel(submissionsChannel);
    };
  }, [fetchCounts]);

  return {
    ...notifications,
    totalPending: notifications.pendingClaims + notifications.pendingSubmissions,
    refetch: fetchCounts,
  };
}
