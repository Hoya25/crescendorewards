import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

interface CompletionItem {
  id: string;
  label: string;
  isComplete: boolean;
  weight: number;
}

interface UseProfileCompletionResult {
  percentage: number;
  completedCount: number;
  totalCount: number;
  items: CompletionItem[];
  isComplete: boolean;
  loading: boolean;
}

export function useProfileCompletion(profile: Profile | null): UseProfileCompletionResult {
  const [hasClaimedReward, setHasClaimedReward] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRewardClaims = async () => {
      if (!profile?.id) {
        setLoading(false);
        return;
      }
      
      try {
        const { count, error } = await supabase
          .from('rewards_claims')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id);

        if (error) throw error;
        setHasClaimedReward((count ?? 0) > 0);
      } catch (error) {
        console.error('Error checking reward claims:', error);
      } finally {
        setLoading(false);
      }
    };

    checkRewardClaims();
  }, [profile?.id]);

  const items: CompletionItem[] = useMemo(() => {
    if (!profile) return [];
    
    return [
      {
        id: 'avatar',
        label: 'Upload avatar',
        isComplete: !!profile.avatar_url,
        weight: 20,
      },
      {
        id: 'name',
        label: 'Set display name',
        isComplete: !!profile.full_name && profile.full_name.trim().length > 0,
        weight: 20,
      },
      {
        id: 'bio',
        label: 'Add bio',
        isComplete: !!profile.bio && profile.bio.trim().length > 0,
        weight: 20,
      },
      {
        id: 'wallet',
        label: 'Link wallet',
        isComplete: !!profile.wallet_address,
        weight: 20,
      },
      {
        id: 'reward',
        label: 'Claim first reward',
        isComplete: hasClaimedReward,
        weight: 20,
      },
    ];
  }, [profile, hasClaimedReward]);

  const percentage = items
    .filter(item => item.isComplete)
    .reduce((sum, item) => sum + item.weight, 0);

  const completedCount = items.filter(item => item.isComplete).length;
  const totalCount = items.length;
  const isComplete = percentage === 100;

  return {
    percentage,
    completedCount,
    totalCount,
    items,
    isComplete,
    loading,
  };
}
