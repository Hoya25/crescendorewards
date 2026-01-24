import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { TIER_BENEFIT_SLOTS, getTierIndex } from '@/utils/tierBenefits';

export interface AlliancePartner {
  id: string;
  name: string;
  slug: string;
  category: string;
  logo_url: string | null;
  website_url: string | null;
  short_description: string | null;
  description: string | null;
  benefit_title: string;
  benefit_description: string;
  monthly_value: number;
  min_tier: string;
  slot_cost: number | null;
  is_diamond_exclusive: boolean | null;
  activation_type: string;
  activation_instructions: string | null;
  activation_url: string | null;
  is_creator_subscription: boolean | null;
  creator_platform: string | null;
  creator_channel_url: string | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  total_activations: number | null;
  display_order: number | null;
}

export interface MemberActiveBenefit {
  id: string;
  user_id: string;
  partner_id: string;
  status: string;
  activated_at: string | null;
  expires_at: string | null;
  can_swap_after: string | null;
  redemption_code: string | null;
  slots_used: number | null;
  created_at: string | null;
  partner?: AlliancePartner;
}

// Fetch all active partners
export function useAlliancePartners() {
  return useQuery({
    queryKey: ['alliance-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alliance_partners')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('display_order');
      
      if (error) throw error;
      return data as AlliancePartner[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch user's active benefits with partner details
export function useMemberBenefits(userId: string | undefined) {
  return useQuery({
    queryKey: ['member-benefits', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('member_active_benefits')
        .select(`
          *,
          partner:alliance_partners(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active');
      
      if (error) throw error;
      return data as MemberActiveBenefit[];
    },
    enabled: !!userId,
  });
}

// Activate a benefit
export function useActivateBenefit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      partnerId, 
      slotCost = 1 
    }: { 
      userId: string; 
      partnerId: string; 
      slotCost?: number;
    }) => {
      const now = new Date();
      const canSwapAfter = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      // Insert the active benefit
      const { data: benefit, error: benefitError } = await supabase
        .from('member_active_benefits')
        .insert({
          user_id: userId,
          partner_id: partnerId,
          status: 'active',
          activated_at: now.toISOString(),
          can_swap_after: canSwapAfter.toISOString(),
          slots_used: slotCost,
        })
        .select()
        .single();

      if (benefitError) throw benefitError;

      // Update partner activation count manually
      const { data: partner } = await supabase
        .from('alliance_partners')
        .select('total_activations')
        .eq('id', partnerId)
        .single();

      if (partner) {
        await supabase
          .from('alliance_partners')
          .update({ total_activations: (partner.total_activations || 0) + 1 })
          .eq('id', partnerId);
      }

      // Log activation history
      await supabase
        .from('benefit_activation_history')
        .insert({
          user_id: userId,
          partner_id: partnerId,
          action: 'activated',
        });

      return benefit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-benefits'] });
      queryClient.invalidateQueries({ queryKey: ['alliance-partners'] });
      toast.success('Benefit activated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to activate benefit: ${error.message}`);
    },
  });
}

// Deactivate a benefit
export function useDeactivateBenefit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      benefitId, 
      userId, 
      partnerId 
    }: { 
      benefitId: string; 
      userId: string;
      partnerId: string;
    }) => {
      // Update status to cancelled
      const { error: updateError } = await supabase
        .from('member_active_benefits')
        .update({ status: 'cancelled' })
        .eq('id', benefitId);

      if (updateError) throw updateError;

      // Log deactivation history
      await supabase
        .from('benefit_activation_history')
        .insert({
          user_id: userId,
          partner_id: partnerId,
          action: 'deactivated',
        });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-benefits'] });
      toast.success('Benefit deactivated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate benefit: ${error.message}`);
    },
  });
}

// Calculate benefit slots for a user
export function useBenefitSlots(userId: string | undefined, userTier: string) {
  const { data: activeBenefits = [] } = useMemberBenefits(userId);

  const totalSlots = TIER_BENEFIT_SLOTS[userTier.toLowerCase() as keyof typeof TIER_BENEFIT_SLOTS] || 1;
  const usedSlots = activeBenefits.reduce((sum, benefit) => sum + (benefit.slots_used || 1), 0);
  const availableSlots = Math.max(0, totalSlots - usedSlots);

  return {
    totalSlots,
    usedSlots,
    availableSlots,
    canActivate: (slotCost: number = 1) => availableSlots >= slotCost,
  };
}

// Get partners grouped by category
export function usePartnersByCategory() {
  const { data: partners = [], isLoading, error } = useAlliancePartners();

  const grouped = partners.reduce((acc, partner) => {
    const category = partner.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(partner);
    return acc;
  }, {} as Record<string, AlliancePartner[]>);

  return { grouped, isLoading, error };
}

// Check if user can access a partner based on tier
export function useCanAccessPartner(userTier: string, requiredTier: string): boolean {
  const userIndex = getTierIndex(userTier);
  const requiredIndex = getTierIndex(requiredTier);
  return userIndex >= requiredIndex;
}
