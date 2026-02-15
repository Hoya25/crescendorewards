import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface ShareStatus {
  sharesThisMonth: number;
  maxShares: number;
  platformsShared: string[];
}

export function useSocialShares() {
  const { user } = useAuthContext();
  const [status, setStatus] = useState<ShareStatus>({
    sharesThisMonth: 0,
    maxShares: 4,
    platformsShared: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc('get_share_status', {
        p_user_id: user.id,
      });
      if (error) throw error;
      const d = data as Record<string, unknown>;
      setStatus({
        sharesThisMonth: (d.shares_this_month as number) || 0,
        maxShares: (d.max_shares as number) || 4,
        platformsShared: (d.platforms_shared as string[]) || [],
      });
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const recordShare = useCallback(
    async (platform: 'twitter' | 'farcaster' | 'telegram') => {
      if (!user || isSharing) return null;
      setIsSharing(true);
      try {
        const { data, error } = await supabase.rpc('perform_social_share', {
          p_user_id: user.id,
          p_platform: platform,
        });
        if (error) throw error;
        const d = data as Record<string, unknown>;
        if (d.success) {
          setStatus((prev) => ({
            ...prev,
            sharesThisMonth: (d.shares_this_month as number) || prev.sharesThisMonth + 1,
            platformsShared: [...new Set([...prev.platformsShared, platform])],
          }));
        }
        return d;
      } catch {
        return { success: false, error: 'Failed to record share' };
      } finally {
        setIsSharing(false);
      }
    },
    [user, isSharing],
  );

  const atCap = status.sharesThisMonth >= status.maxShares;

  return { ...status, atCap, isLoading, isSharing, recordShare };
}
