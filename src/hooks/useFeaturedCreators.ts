import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { FeaturedCreator, RewardFeaturedCreator } from '@/types/creators';

export function useFeaturedCreators() {
  const [creators, setCreators] = useState<FeaturedCreator[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCreators = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('featured_creators')
      .select('*')
      .order('display_priority', { ascending: false });
    if (!error) setCreators((data || []) as unknown as FeaturedCreator[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadCreators(); }, [loadCreators]);

  return { creators, loading, refresh: loadCreators };
}

export function useRewardCreators(rewardId: string | undefined) {
  const [creators, setCreators] = useState<FeaturedCreator[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!rewardId) return;
    setLoading(true);
    
    const load = async () => {
      const { data } = await supabase
        .from('reward_featured_creators')
        .select('*, creator:featured_creators(*)')
        .eq('reward_id', rewardId)
        .order('display_order', { ascending: true });

      if (data) {
        const mapped = (data as any[])
          .map(d => d.creator)
          .filter(Boolean) as FeaturedCreator[];
        setCreators(mapped);
      }
      setLoading(false);
    };
    load();
  }, [rewardId]);

  return { creators, loading };
}
