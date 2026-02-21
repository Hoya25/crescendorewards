import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { toast } from 'sonner';

/**
 * Listens for real-time referral_success notifications and fires a styled toast.
 */
export function useReferralSuccessNotification() {
  const { profile } = useUnifiedUser();
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    const authUserId = profile?.auth_user_id;
    if (!authUserId) return;

    const channel = supabase
      .channel('referral-success-toast')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${authUserId}`,
        },
        (payload) => {
          const row = payload.new as { id: string; type: string };
          if (row.type !== 'referral_success') return;
          if (seen.current.has(row.id)) return;
          seen.current.add(row.id);

          toast('🎉 You earned NCTR!', {
            description: 'Someone just joined using your invite link. Your NCTR reward is on its way.',
            duration: 8000,
            style: {
              backgroundColor: '#323232',
              color: '#ffffff',
              borderLeft: '4px solid #E2FF6D',
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.auth_user_id]);
}
