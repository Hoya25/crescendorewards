import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

/**
 * On mount, checks for unread referral_success notifications,
 * fires ONE toast, and marks them read. Only once per session.
 */
export function useReferralSuccessToast() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const shown = useRef(false);

  const { data: unread } = useQuery({
    queryKey: ['referral-success-unread', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'referral_success')
        .eq('is_read', false)
        .limit(50);
      return data ?? [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (!unread || unread.length === 0 || shown.current || !user?.id) return;
    shown.current = true;

    const count = unread.length;
    const body =
      count === 1
        ? 'Someone joined using your invite. Your reward is on its way.'
        : `${count} friends joined using your invite!`;

    toast('🎉 You earned NCTR!', {
      description: (
        <div>
          <p style={{ color: '#D9D9D9', fontSize: 13 }}>{body}</p>
          <button
            onClick={() => navigate('/invite')}
            style={{ color: '#E2FF6D', fontSize: 12, marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            View →
          </button>
        </div>
      ),
      duration: 8000,
      style: {
        backgroundColor: '#323232',
        color: '#ffffff',
        borderLeft: '4px solid #E2FF6D',
        borderRadius: 0,
      },
    });

    // Mark as read
    const ids = unread.map((n) => n.id);
    supabase
      .from('notifications')
      .update({ read: true })
      .in('id', ids)
      .then(() => {});
  }, [unread, user?.id, navigate]);
}
