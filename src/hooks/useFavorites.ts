import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UseFavoritesReturn {
  favorites: Set<string>;
  favoritesCount: number;
  loading: boolean;
  isFavorite: (rewardId: string) => boolean;
  toggleFavorite: (rewardId: string) => Promise<void>;
  animatingIds: Set<string>;
}

export function useFavorites(): UseFavoritesReturn {
  const { user } = useAuthContext();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites(new Set());
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reward_wishlists')
        .select('reward_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavorites(new Set(data?.map(item => item.reward_id) || []));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavorite = useCallback((rewardId: string) => {
    return favorites.has(rewardId);
  }, [favorites]);

  const toggleFavorite = useCallback(async (rewardId: string) => {
    if (!user) {
      toast.error('Please sign in to save favorites');
      return;
    }

    const wasInFavorites = favorites.has(rewardId);
    
    // Trigger animation
    setAnimatingIds(prev => new Set([...prev, rewardId]));
    setTimeout(() => {
      setAnimatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(rewardId);
        return newSet;
      });
    }, 400);

    // Optimistic update
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (wasInFavorites) {
        newSet.delete(rewardId);
      } else {
        newSet.add(rewardId);
      }
      return newSet;
    });

    try {
      if (wasInFavorites) {
        const { error } = await supabase
          .from('reward_wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('reward_id', rewardId);

        if (error) throw error;
        toast.success('Removed from favorites');
      } else {
        const { error } = await supabase
          .from('reward_wishlists')
          .insert({
            user_id: user.id,
            reward_id: rewardId,
          });

        if (error) throw error;
        toast.success('Added to favorites');
      }
    } catch (error: any) {
      // Revert optimistic update on error
      setFavorites(prev => {
        const newSet = new Set(prev);
        if (wasInFavorites) {
          newSet.add(rewardId);
        } else {
          newSet.delete(rewardId);
        }
        return newSet;
      });
      console.error('Error toggling favorite:', error);
      toast.error(error.message || 'Failed to update favorites');
    }
  }, [user, favorites]);

  return {
    favorites,
    favoritesCount: favorites.size,
    loading,
    isFavorite,
    toggleFavorite,
    animatingIds,
  };
}
