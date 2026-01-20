import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { toast } from '@/hooks/use-toast';

interface WatchlistItem {
  reward_id: string;
  notified: boolean;
  created_at: string;
}

interface WatchCount {
  reward_id: string;
  count: number;
}

export function useWatchlist() {
  const { profile } = useUnifiedUser();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchCounts, setWatchCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  // Fetch user's watchlist
  const fetchWatchlist = useCallback(async () => {
    if (!profile) {
      setWatchlist([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reward_watchlist')
        .select('reward_id, notified, created_at')
        .eq('user_id', profile.id);

      if (error) throw error;
      setWatchlist(data || []);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  // Fetch watch counts for specific rewards
  const fetchWatchCounts = useCallback(async (rewardIds: string[]) => {
    if (rewardIds.length === 0) return;

    try {
      const counts = new Map<string, number>();
      
      // Batch fetch counts
      for (const rewardId of rewardIds) {
        const { data, error } = await supabase
          .rpc('get_reward_watch_count', { p_reward_id: rewardId });
        
        if (!error && data !== null) {
          counts.set(rewardId, data);
        }
      }
      
      setWatchCounts(prev => {
        const newCounts = new Map(prev);
        counts.forEach((count, id) => newCounts.set(id, count));
        return newCounts;
      });
    } catch (error) {
      console.error('Error fetching watch counts:', error);
    }
  }, []);

  // Check if a reward is being watched
  const isWatching = useCallback((rewardId: string): boolean => {
    return watchlist.some(item => item.reward_id === rewardId && !item.notified);
  }, [watchlist]);

  // Get watch count for a reward
  const getWatchCount = useCallback((rewardId: string): number => {
    return watchCounts.get(rewardId) || 0;
  }, [watchCounts]);

  // Toggle watch status
  const toggleWatch = useCallback(async (rewardId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (!profile) {
      toast({
        title: "Sign in required",
        description: "Please sign in to get notified about restocks",
        variant: "destructive",
      });
      return;
    }

    const currentlyWatching = isWatching(rewardId);

    // Optimistic update
    if (currentlyWatching) {
      setWatchlist(prev => prev.filter(item => item.reward_id !== rewardId));
      setWatchCounts(prev => {
        const newCounts = new Map(prev);
        const current = newCounts.get(rewardId) || 0;
        newCounts.set(rewardId, Math.max(0, current - 1));
        return newCounts;
      });
    } else {
      setWatchlist(prev => [...prev, { 
        reward_id: rewardId, 
        notified: false, 
        created_at: new Date().toISOString() 
      }]);
      setWatchCounts(prev => {
        const newCounts = new Map(prev);
        const current = newCounts.get(rewardId) || 0;
        newCounts.set(rewardId, current + 1);
        return newCounts;
      });
      
      // Add animation
      setAnimatingIds(prev => new Set(prev).add(rewardId));
      setTimeout(() => {
        setAnimatingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(rewardId);
          return newSet;
        });
      }, 300);
    }

    try {
      if (currentlyWatching) {
        const { error } = await supabase
          .from('reward_watchlist')
          .delete()
          .eq('user_id', profile.id)
          .eq('reward_id', rewardId);

        if (error) throw error;

        toast({
          title: "Removed from watchlist",
          description: "You won't be notified when this restocks",
        });
      } else {
        const { error } = await supabase
          .from('reward_watchlist')
          .insert({ user_id: profile.id, reward_id: rewardId });

        if (error) throw error;

        toast({
          title: "We'll notify you!",
          description: "You'll get a notification when this is back in stock",
        });
      }
    } catch (error: any) {
      console.error('Error toggling watch:', error);
      // Revert optimistic update
      fetchWatchlist();
      toast({
        title: "Error",
        description: error.message || "Failed to update watchlist",
        variant: "destructive",
      });
    }
  }, [profile, isWatching, fetchWatchlist]);

  // Check if animation is active for a reward
  const isAnimating = useCallback((rewardId: string): boolean => {
    return animatingIds.has(rewardId);
  }, [animatingIds]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  return {
    watchlist,
    loading,
    isWatching,
    toggleWatch,
    isAnimating,
    getWatchCount,
    fetchWatchCounts,
    refetch: fetchWatchlist,
  };
}
