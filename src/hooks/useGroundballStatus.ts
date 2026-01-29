import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { toast } from 'sonner';

// Costs in Claims
export const BONUS_SLOT_COST = 25;
export const SWAP_COST = 15;
export const GIFT_SELECTION_COST = 30;

export interface GroundballStatus {
  id: string;
  member_id: string;
  groundball_locked: number;
  status_tier: 'none' | 'bronze' | 'silver' | 'gold';
  selections_used: number;
  selections_max: number;
  bonus_selections: number;
  free_swaps_remaining: number;
  current_period_start: string | null;
  current_period_end: string | null;
}

export interface GroundballReward {
  id: string;
  title: string;
  description: string | null;
  sponsor: string | null;
  category: string | null;
  required_status: string | null;
  cadence: string | null;
  cadence_description: string | null;
  image_url: string | null;
  image_emoji: string | null;
  multiplier_text: string | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  is_giveback: boolean | null;
  quantity_available: number | null;
}

export interface RewardSelection {
  id: string;
  member_id: string;
  reward_id: string;
  selected_at: string;
  last_redeemed_at: string | null;
  redemption_count: number;
  is_active: boolean;
  reward?: GroundballReward;
}

const STATUS_HIERARCHY = ['any', 'none', 'bronze', 'silver', 'gold'];

export function useGroundballStatus() {
  const { profile, refreshUnifiedProfile } = useUnifiedUser();
  const queryClient = useQueryClient();
  const memberId = profile?.auth_user_id;
  const claimsBalance = profile?.crescendo_data?.claims_balance || 0;

  // Fetch member status
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['groundball-status', memberId],
    queryFn: async () => {
      if (!memberId) return null;
      
      const { data, error } = await supabase
        .from('member_groundball_status')
        .select('*')
        .eq('member_id', memberId)
        .maybeSingle();
      
      if (error) throw error;
      return data as GroundballStatus | null;
    },
    enabled: !!memberId,
  });

  // Fetch all rewards
  const { data: rewards, isLoading: rewardsLoading } = useQuery({
    queryKey: ['groundball-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groundball_rewards')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('title', { ascending: true });
      
      if (error) throw error;
      return data as GroundballReward[];
    },
  });

  // Fetch member's selections
  const { data: selections, isLoading: selectionsLoading } = useQuery({
    queryKey: ['groundball-selections', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      
      const { data, error } = await supabase
        .from('member_reward_selections')
        .select(`
          *,
          reward:groundball_rewards(*)
        `)
        .eq('member_id', memberId)
        .eq('is_active', true);
      
      if (error) throw error;
      return data as RewardSelection[];
    },
    enabled: !!memberId,
  });

  // Select a reward
  const selectReward = useMutation({
    mutationFn: async (rewardId: string) => {
      if (!memberId) throw new Error('Not authenticated');
      
      const reward = rewards?.find(r => r.id === rewardId);
      if (!reward) throw new Error('Reward not found');
      
      // Check if already selected
      const existing = selections?.find(s => s.reward_id === rewardId);
      if (existing) throw new Error('Reward already selected');
      
      // Check slots (skip for give-back rewards)
      const totalSlots = (status?.selections_max || 0) + (status?.bonus_selections || 0);
      const usedSlots = status?.selections_used || 0;
      
      if (!reward.is_giveback && usedSlots >= totalSlots) {
        throw new Error('No selection slots available');
      }
      
      // Check status requirement
      const userTier = status?.status_tier || 'none';
      const requiredTier = reward.required_status || 'any';
      if (!meetsStatusRequirement(userTier, requiredTier)) {
        throw new Error(`Requires ${requiredTier} status`);
      }
      
      // Insert selection
      const { error: insertError } = await supabase
        .from('member_reward_selections')
        .insert({
          member_id: memberId,
          reward_id: rewardId,
          is_active: true,
        });
      
      if (insertError) throw insertError;
      
      // Update selections_used (only for non-giveback)
      if (!reward.is_giveback) {
        const { error: updateError } = await supabase
          .from('member_groundball_status')
          .update({ 
            selections_used: usedSlots + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('member_id', memberId);
        
        if (updateError) throw updateError;
      }
      
      return { reward, isGiveback: reward.is_giveback };
    },
    onSuccess: ({ reward, isGiveback }) => {
      queryClient.invalidateQueries({ queryKey: ['groundball-selections'] });
      queryClient.invalidateQueries({ queryKey: ['groundball-status'] });
      toast.success(
        isGiveback 
          ? `${reward?.title} activated! Give-back rewards don't use a slot.`
          : `${reward?.title} added to your selections!`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Swap out a reward
  const swapReward = useMutation({
    mutationFn: async ({ selectionId, useFreeSwap }: { selectionId: string; useFreeSwap: boolean }) => {
      if (!memberId) throw new Error('Not authenticated');
      
      const selection = selections?.find(s => s.id === selectionId);
      if (!selection) throw new Error('Selection not found');
      
      const reward = rewards?.find(r => r.id === selection.reward_id);
      const isGiveback = reward?.is_giveback || false;
      
      // Check if we need to deduct Claims for paid swap
      if (!useFreeSwap && !isGiveback) {
        // Check Claims balance
        if (claimsBalance < SWAP_COST) {
          throw new Error(`Insufficient Claims. You need ${SWAP_COST} Claims for this swap.`);
        }
        
        // Deduct Claims
        const { error: claimsError } = await supabase
          .from('unified_profiles')
          .update({ 
            crescendo_data: {
              ...profile?.crescendo_data,
              claims_balance: claimsBalance - SWAP_COST
            }
          })
          .eq('auth_user_id', memberId);
        
        if (claimsError) throw claimsError;
      }
      
      // Deactivate selection
      const { error: updateError } = await supabase
        .from('member_reward_selections')
        .update({ is_active: false })
        .eq('id', selectionId);
      
      if (updateError) throw updateError;
      
      // Update status (only for non-giveback)
      if (!isGiveback) {
        const updates: Record<string, unknown> = {
          selections_used: Math.max(0, (status?.selections_used || 1) - 1),
          updated_at: new Date().toISOString(),
        };
        
        if (useFreeSwap) {
          updates.free_swaps_remaining = Math.max(0, (status?.free_swaps_remaining || 1) - 1);
        }
        
        const { error: statusError } = await supabase
          .from('member_groundball_status')
          .update(updates)
          .eq('member_id', memberId);
        
        if (statusError) throw statusError;
      }
      
      return { reward, usedFreeSwap: useFreeSwap, paidSwap: !useFreeSwap && !isGiveback };
    },
    onSuccess: ({ reward, usedFreeSwap, paidSwap }) => {
      queryClient.invalidateQueries({ queryKey: ['groundball-selections'] });
      queryClient.invalidateQueries({ queryKey: ['groundball-status'] });
      refreshUnifiedProfile(); // Refresh Claims balance
      
      if (paidSwap) {
        toast.success(`${reward?.title} removed. ${SWAP_COST} Claims used.`);
      } else if (usedFreeSwap) {
        toast.success(`${reward?.title} removed. Free swap used.`);
      } else {
        toast.success(`${reward?.title} removed from your selections.`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Purchase a bonus selection slot
  const purchaseBonusSlot = useMutation({
    mutationFn: async () => {
      if (!memberId) throw new Error('Not authenticated');
      
      // Check Claims balance
      if (claimsBalance < BONUS_SLOT_COST) {
        throw new Error(`Insufficient Claims. You need ${BONUS_SLOT_COST} Claims for a bonus slot.`);
      }
      
      // Deduct Claims
      const { error: claimsError } = await supabase
        .from('unified_profiles')
        .update({ 
          crescendo_data: {
            ...profile?.crescendo_data,
            claims_balance: claimsBalance - BONUS_SLOT_COST
          }
        })
        .eq('auth_user_id', memberId);
      
      if (claimsError) throw claimsError;
      
      // Check if member has a status record, if not create one
      if (!status) {
        const { error: insertError } = await supabase
          .from('member_groundball_status')
          .insert({
            member_id: memberId,
            bonus_selections: 1,
            selections_max: 3, // Default slots
            selections_used: 0,
            free_swaps_remaining: 1,
          });
        
        if (insertError) throw insertError;
      } else {
        // Increment bonus_selections
        const { error: updateError } = await supabase
          .from('member_groundball_status')
          .update({ 
            bonus_selections: (status.bonus_selections || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('member_id', memberId);
        
        if (updateError) throw updateError;
      }
      
      return { newBonusSlots: (status?.bonus_selections || 0) + 1 };
    },
    onSuccess: ({ newBonusSlots }) => {
      queryClient.invalidateQueries({ queryKey: ['groundball-status'] });
      refreshUnifiedProfile(); // Refresh Claims balance
      
      const totalSlots = (status?.selections_max || 3) + newBonusSlots;
      toast.success(`Bonus slot added! You now have ${totalSlots} selections.`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Helper functions
  const meetsStatusRequirement = (userTier: string, requiredTier: string): boolean => {
    if (requiredTier === 'any') return true;
    return STATUS_HIERARCHY.indexOf(userTier) >= STATUS_HIERARCHY.indexOf(requiredTier);
  };

  const getSelectionState = (rewardId: string) => {
    const reward = rewards?.find(r => r.id === rewardId);
    const isSelected = selections?.some(s => s.reward_id === rewardId);
    const userTier = status?.status_tier || 'none';
    const requiredTier = reward?.required_status || 'any';
    const meetsStatus = meetsStatusRequirement(userTier, requiredTier);
    const totalSlots = (status?.selections_max || 0) + (status?.bonus_selections || 0);
    const usedSlots = status?.selections_used || 0;
    const hasSlots = usedSlots < totalSlots;
    const isGiveback = reward?.is_giveback || false;
    
    if (isSelected) return 'selected';
    if (isGiveback && meetsStatus) return 'giveback';
    if (!meetsStatus) return 'locked';
    if (!hasSlots && !isGiveback) return 'no-slots';
    return 'available';
  };

  return {
    status,
    rewards: rewards || [],
    selections: selections || [],
    isLoading: statusLoading || rewardsLoading || selectionsLoading,
    selectReward,
    swapReward,
    purchaseBonusSlot,
    meetsStatusRequirement,
    getSelectionState,
    totalSlots: (status?.selections_max || 0) + (status?.bonus_selections || 0),
    usedSlots: status?.selections_used || 0,
    freeSwaps: status?.free_swaps_remaining || 0,
    bonusSlots: status?.bonus_selections || 0,
    claimsBalance,
    canAffordBonusSlot: claimsBalance >= BONUS_SLOT_COST,
    canAffordSwap: claimsBalance >= SWAP_COST,
  };
}
