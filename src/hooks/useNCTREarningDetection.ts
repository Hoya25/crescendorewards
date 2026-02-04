import { useEffect, useState, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EarningData {
  nctrEarned: number;
  brandName: string;
  notificationId: string;
}

export function useNCTREarningDetection(userId: string | undefined) {
  const [pendingEarning, setPendingEarning] = useState<EarningData | null>(null);
  const lastCheckedRef = useRef<string>(new Date().toISOString());
  const queryClient = useQueryClient();

  // Poll notifications table for new NCTR earning notifications every 30 seconds
  const { data: recentNotifications } = useQuery({
    queryKey: ['nctr-earning-check', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'nctr_earned')
        .eq('is_read', false)
        .gt('created_at', lastCheckedRef.current)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('Could not fetch NCTR earning notifications:', error.message);
        return null;
      }

      return data;
    },
    enabled: !!userId,
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 25000,
  });

  useEffect(() => {
    if (recentNotifications && recentNotifications.length > 0) {
      const notification = recentNotifications[0];
      
      try {
        // Parse metadata which may contain nctr_earned and brand_name
        const metadata = notification.metadata as Record<string, unknown> | null;
        
        const nctrEarned = typeof metadata?.nctr_earned === 'number' 
          ? metadata.nctr_earned 
          : 0;
        const brandName = typeof metadata?.brand_name === 'string'
          ? metadata.brand_name
          : 'The Garden';

        if (nctrEarned > 0) {
          setPendingEarning({
            nctrEarned,
            brandName,
            notificationId: notification.id,
          });
        }
      } catch (e) {
        console.warn('Error parsing NCTR earning notification:', e);
      }

      // Update last checked timestamp
      lastCheckedRef.current = new Date().toISOString();
    }
  }, [recentNotifications]);

  // Also set up realtime subscription for instant detection
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('nctr-earning-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as {
            id: string;
            type: string;
            metadata: Record<string, unknown> | null;
          };

          if (notification.type === 'nctr_earned') {
            const metadata = notification.metadata;
            const nctrEarned = typeof metadata?.nctr_earned === 'number'
              ? metadata.nctr_earned
              : 0;
            const brandName = typeof metadata?.brand_name === 'string'
              ? metadata.brand_name
              : 'The Garden';

            if (nctrEarned > 0) {
              setPendingEarning({
                nctrEarned,
                brandName,
                notificationId: notification.id,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const clearEarning = useCallback(async () => {
    if (pendingEarning?.notificationId) {
      // Mark the notification as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', pendingEarning.notificationId);

      // Invalidate notifications query to update unread count
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['nctr-earning-check'] });
    }
    setPendingEarning(null);
  }, [pendingEarning?.notificationId, queryClient]);

  return {
    pendingEarning,
    clearEarning,
  };
}
