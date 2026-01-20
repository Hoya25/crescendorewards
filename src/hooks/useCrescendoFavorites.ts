import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { toast } from 'sonner';

interface UseCrescendoFavoritesReturn {
  favorites: Set<string>;
  favoritesCount: number;
  loading: boolean;
  isFavorite: (rewardId: string) => boolean;
  toggleFavorite: (rewardId: string) => Promise<void>;
  animatingIds: Set<string>;
}

export function useCrescendoFavorites(): UseCrescendoFavoritesReturn {
  const { profile } = useUnifiedUser();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  const fetchFavorites = useCallback(async () => {
    if (!profile) {
      setFavorites(new Set());
      setLoading(false);
      return;
    }

    try {
      // Use reward_wishlists table which exists in the database
      const { data, error } = await supabase
        .from('reward_wishlists')
        .select('reward_id')
        .eq('user_id', profile.id);

      if (error) {
        // Table might not exist or RLS issue - fail gracefully
        console.warn('Could not fetch favorites:', error.message);
        setFavorites(new Set());
        setLoading(false);
        return;
      }

      setFavorites(new Set((data || []).map(item => item.reward_id)));
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites(new Set());
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavorite = useCallback((rewardId: string) => {
    return favorites.has(rewardId);
  }, [favorites]);

  const toggleFavorite = useCallback(async (rewardId: string) => {
    if (!profile) {
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
          .eq('user_id', profile.id)
          .eq('reward_id', rewardId);

        if (error) throw error;
        toast.success('Removed from favorites');
      } else {
        const { error } = await supabase
          .from('reward_wishlists')
          .insert({
            user_id: profile.id,
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
  }, [profile, favorites]);

  return {
    favorites,
    favoritesCount: favorites.size,
    loading,
    isFavorite,
    toggleFavorite,
    animatingIds,
  };
}
