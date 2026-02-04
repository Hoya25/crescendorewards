import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StatusTier {
  id: string;
  display_name: string;
  min_nctr_360_locked: number;
  badge_emoji: string;
  badge_color: string;
}

export function useStatusTiers() {
  return useQuery({
    queryKey: ['status-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('status_tiers')
        .select('id, display_name, min_nctr_360_locked, badge_emoji, badge_color')
        .order('min_nctr_360_locked', { ascending: true });

      if (error) {
        console.error('Error fetching status tiers:', error);
        // Return default tiers as fallback
        return getDefaultTiers();
      }

      return data as StatusTier[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Fallback tiers if DB query fails
function getDefaultTiers(): StatusTier[] {
  return [
    { id: '1', display_name: 'Bronze', min_nctr_360_locked: 100, badge_emoji: '🥉', badge_color: '#CD7F32' },
    { id: '2', display_name: 'Gold', min_nctr_360_locked: 500, badge_emoji: '🥇', badge_color: '#FFD700' },
    { id: '3', display_name: 'Silver', min_nctr_360_locked: 1000, badge_emoji: '🥈', badge_color: '#C0C0C0' },
    { id: '4', display_name: 'Platinum', min_nctr_360_locked: 2000, badge_emoji: '💎', badge_color: '#E5E4E2' },
    { id: '5', display_name: 'Diamond', min_nctr_360_locked: 10000, badge_emoji: '👑', badge_color: '#00BFFF' },
  ];
}

export function getTierByBalance(tiers: StatusTier[], balance: number) {
  // Sort by min requirement descending to find the highest tier the user qualifies for
  const sortedTiers = [...tiers].sort((a, b) => b.min_nctr_360_locked - a.min_nctr_360_locked);
  
  for (const tier of sortedTiers) {
    if (balance >= tier.min_nctr_360_locked) {
      return tier;
    }
  }
  
  // Return lowest tier if balance is below all thresholds
  return tiers.sort((a, b) => a.min_nctr_360_locked - b.min_nctr_360_locked)[0];
}

export function getNextTier(tiers: StatusTier[], currentBalance: number) {
  const sortedTiers = [...tiers].sort((a, b) => a.min_nctr_360_locked - b.min_nctr_360_locked);
  
  for (const tier of sortedTiers) {
    if (tier.min_nctr_360_locked > currentBalance) {
      return tier;
    }
  }
  
  return null; // User is at max tier
}

export function getProgressToNextTier(tiers: StatusTier[], currentBalance: number) {
  const currentTier = getTierByBalance(tiers, currentBalance);
  const nextTier = getNextTier(tiers, currentBalance);
  
  if (!nextTier) return 100; // Max tier reached
  
  const progress = ((currentBalance - currentTier.min_nctr_360_locked) / 
    (nextTier.min_nctr_360_locked - currentTier.min_nctr_360_locked)) * 100;
  
  return Math.max(0, Math.min(100, progress));
}
