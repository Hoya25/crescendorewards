import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedUser } from "@/contexts/UnifiedUserContext";
import { toast } from "sonner";

interface OnboardingProgress {
  id: string;
  user_id: string;
  profile_completed: boolean;
  profile_completed_at: string | null;
  how_it_works_viewed: boolean;
  how_it_works_viewed_at: string | null;
  garden_visited: boolean;
  garden_visited_at: string | null;
  first_wishlist_item: boolean;
  first_wishlist_item_at: string | null;
  first_referral: boolean;
  first_referral_at: string | null;
  onboarding_nctr_awarded: number;
  is_dismissed: boolean;
  created_at: string;
  updated_at: string;
}

interface OnboardingItem {
  id: 'profile_completed' | 'first_wishlist_item' | 'first_referral';
  title: string;
  description: string;
  nctrReward: number;
  route?: string;
  externalUrl?: string;
  completed: boolean;
}

const NCTR_REWARDS = {
  profile_completed: 10,
  first_wishlist_item: 10,
  first_referral: 50,
} as const;

export function useUserOnboarding() {
  // Use unified profile ID (the one user_onboarding FK references)
  const { profile } = useUnifiedUser();
  const unifiedId = profile?.id;

  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasWishlistItem, setHasWishlistItem] = useState(false);
  const [hasReferral, setHasReferral] = useState(false);

  // Fetch or create onboarding progress + derived signals
  const fetchProgress = useCallback(async () => {
    if (!unifiedId) {
      setLoading(false);
      return;
    }

    try {
      const [{ data, error }, wishlistRes, referralRes] = await Promise.all([
        supabase
          .from('user_onboarding')
          .select('*')
          .eq('user_id', unifiedId)
          .maybeSingle(),
        supabase
          .from('reward_wishlists')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', unifiedId),
        supabase
          .from('referrals')
          .select('id', { count: 'exact', head: true })
          .eq('referrer_id', unifiedId),
      ]);

      setHasWishlistItem((wishlistRes.count ?? 0) > 0);
      setHasReferral((referralRes.count ?? 0) > 0);

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching onboarding:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setProgress(data);
      } else {
        const { data: newData, error: insertError } = await supabase
          .from('user_onboarding')
          .upsert({ user_id: unifiedId }, { onConflict: 'user_id' })
          .select()
          .single();

        if (insertError) {
          const { data: retryData } = await supabase
            .from('user_onboarding')
            .select('*')
            .eq('user_id', unifiedId)
            .maybeSingle();
          if (retryData) setProgress(retryData);
          else console.error('Error creating onboarding:', insertError);
        } else {
          setProgress(newData);
        }
      }
    } catch (err) {
      console.error('Error in onboarding fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [unifiedId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Complete an onboarding item (kept for compatibility; only used now to award NCTR
  // when a user clicks an item that we still surface and want to credit explicitly)
  const completeItem = useCallback(async (
    itemId: keyof typeof NCTR_REWARDS,
    skipToast = false
  ) => {
    if (!unifiedId || !profile?.auth_user_id || !progress) return;
    if ((progress as any)[itemId]) return;

    const timestampField = `${itemId}_at` as keyof OnboardingProgress;
    const nctrReward = NCTR_REWARDS[itemId];

    try {
      // Server-owned award. The RPC validates the item, enforces the canonical
      // amount (10/10/50) and is idempotent per item — the client cannot choose
      // the amount or award the same item twice.
      const { data, error: rpcError } = await (supabase as any).rpc('award_onboarding_item', {
        p_item: itemId,
      });

      if (rpcError) {
        console.error('Error awarding onboarding item:', rpcError);
        return;
      }
      if (!data?.success) {
        console.error('Onboarding award rejected:', data?.error);
        return;
      }
      if (!data.awarded) {
        // Already credited server-side; just re-sync local state.
        await fetchProgress();
        return;
      }


      setProgress(prev => prev ? {
        ...prev,
        [itemId]: true,
        [timestampField]: new Date().toISOString(),
        onboarding_nctr_awarded: (prev.onboarding_nctr_awarded || 0) + nctrReward,
      } : null);

      if (!skipToast) {
        const itemTitles: Record<string, string> = {
          profile_completed: 'completing your profile',
          first_wishlist_item: 'adding to your wishlist',
          first_referral: 'your first referral',
        };
        toast.success(`🎉 You earned ${nctrReward} NCTR for ${itemTitles[itemId]}!`, { duration: 4000 });
      }
    } catch (err) {
      console.error('Error completing onboarding item:', err);
    }
  }, [unifiedId, profile?.auth_user_id, progress]);

  const dismissOnboarding = useCallback(async () => {
    if (!unifiedId) return;
    try {
      await supabase
        .from('user_onboarding')
        .update({ is_dismissed: true })
        .eq('user_id', unifiedId);
      setProgress(prev => prev ? { ...prev, is_dismissed: true } : null);
    } catch (err) {
      console.error('Error dismissing onboarding:', err);
    }
  }, [unifiedId]);

  // Derive completion from REAL data, not just stored flags.
  const profileName = (profile?.display_name || '').trim();
  const profileComplete = !!profileName && !!profile?.avatar_url;

  const checklistItems: OnboardingItem[] = profile ? [
    {
      id: 'profile_completed',
      title: 'Complete your profile',
      description: 'Add your name and avatar',
      nctrReward: NCTR_REWARDS.profile_completed,
      route: '/profile',
      completed: profileComplete || !!progress?.profile_completed,
    },
    {
      id: 'first_wishlist_item',
      title: 'Add to wishlist',
      description: 'Save a reward you want',
      nctrReward: NCTR_REWARDS.first_wishlist_item,
      route: '/rewards',
      completed: hasWishlistItem || !!progress?.first_wishlist_item,
    },
    {
      id: 'first_referral',
      title: 'Invite a friend',
      description: 'Earn when they sign up',
      nctrReward: NCTR_REWARDS.first_referral,
      route: '/invite',
      completed: hasReferral || !!progress?.first_referral,
    },
  ] : [];

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalItems = checklistItems.length;
  const progressPercent = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;
  const totalPotentialNCTR = Object.values(NCTR_REWARDS).reduce((a, b) => a + b, 0);
  const remainingNCTR = checklistItems
    .filter(i => !i.completed)
    .reduce((sum, i) => sum + i.nctrReward, 0);
  const earnedNCTR = totalPotentialNCTR - remainingNCTR;

  // Hide widget when everything is done OR user dismissed it.
  const shouldShowChecklist =
    !loading &&
    !!progress &&
    !progress.is_dismissed &&
    totalItems > 0 &&
    completedCount < totalItems;

  return {
    progress,
    loading,
    checklistItems,
    completedCount,
    totalItems,
    progressPercent,
    totalPotentialNCTR,
    remainingNCTR,
    earnedNCTR,
    shouldShowChecklist,
    completeItem,
    dismissOnboarding,
    refetch: fetchProgress,
  };
}
