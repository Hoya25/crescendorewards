import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthContext } from "@/contexts/AuthContext";
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
  id: keyof Pick<OnboardingProgress, 'profile_completed' | 'how_it_works_viewed' | 'garden_visited' | 'first_wishlist_item' | 'first_referral'>;
  title: string;
  description: string;
  nctrReward: number;
  route?: string;
  externalUrl?: string;
  completed: boolean;
}

const NCTR_REWARDS = {
  profile_completed: 10,
  how_it_works_viewed: 5,
  garden_visited: 5,
  first_wishlist_item: 10,
  first_referral: 50,
};

export function useUserOnboarding() {
  const { user } = useAuthContext();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  // Fetch or create onboarding progress
  const fetchProgress = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // First try to get existing record
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching onboarding:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setProgress(data);
        
        // Check if user is "new" (signed up within 7 days OR completed < 3 items)
        const completedCount = [
          data.profile_completed,
          data.how_it_works_viewed,
          data.garden_visited,
          data.first_wishlist_item,
          data.first_referral,
        ].filter(Boolean).length;

        const createdAt = new Date(data.created_at);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        setIsNewUser(createdAt > sevenDaysAgo || completedCount < 3);
      } else {
        // Create new record - use upsert to handle race conditions
        const { data: newData, error: insertError } = await supabase
          .from('user_onboarding')
          .upsert({ user_id: user.id }, { onConflict: 'user_id' })
          .select()
          .single();

        if (insertError) {
          // If upsert fails, try fetching again (might have been created by another request)
          const { data: retryData } = await supabase
            .from('user_onboarding')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (retryData) {
            setProgress(retryData);
            setIsNewUser(true);
          } else {
            console.error('Error creating onboarding:', insertError);
          }
        } else {
          setProgress(newData);
          setIsNewUser(true);
        }
      }
    } catch (err) {
      console.error('Error in onboarding fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Complete an onboarding item
  const completeItem = useCallback(async (
    itemId: keyof typeof NCTR_REWARDS,
    skipToast = false
  ) => {
    if (!user?.id || !progress) return;

    // Check if already completed
    if (progress[itemId]) return;

    const timestampField = `${itemId}_at` as keyof OnboardingProgress;
    const nctrReward = NCTR_REWARDS[itemId];

    try {
      // Update onboarding progress
      const { error: updateError } = await supabase
        .from('user_onboarding')
        .update({
          [itemId]: true,
          [timestampField]: new Date().toISOString(),
          onboarding_nctr_awarded: (progress.onboarding_nctr_awarded || 0) + nctrReward,
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating onboarding:', updateError);
        return;
      }

      // Award NCTR to user's available balance
      const { data: profileData } = await supabase
        .from('profiles')
        .select('available_nctr')
        .eq('id', user.id)
        .single();

      if (profileData) {
        await supabase
          .from('profiles')
          .update({
            available_nctr: (profileData.available_nctr || 0) + nctrReward,
          })
          .eq('id', user.id);
      }

      // Update local state
      setProgress(prev => prev ? {
        ...prev,
        [itemId]: true,
        [timestampField]: new Date().toISOString(),
        onboarding_nctr_awarded: (prev.onboarding_nctr_awarded || 0) + nctrReward,
      } : null);

      // Show toast
      if (!skipToast) {
        const itemTitles: Record<string, string> = {
          profile_completed: 'completing your profile',
          how_it_works_viewed: 'learning How It Works',
          garden_visited: 'visiting The Garden',
          first_wishlist_item: 'adding to your wishlist',
          first_referral: 'your first referral',
        };

        toast.success(`🎉 You earned ${nctrReward} NCTR for ${itemTitles[itemId]}!`, {
          duration: 4000,
        });
      }
    } catch (err) {
      console.error('Error completing onboarding item:', err);
    }
  }, [user?.id, progress]);

  // Dismiss the onboarding checklist
  const dismissOnboarding = useCallback(async () => {
    if (!user?.id) return;

    try {
      await supabase
        .from('user_onboarding')
        .update({ is_dismissed: true })
        .eq('user_id', user.id);

      setProgress(prev => prev ? { ...prev, is_dismissed: true } : null);
    } catch (err) {
      console.error('Error dismissing onboarding:', err);
    }
  }, [user?.id]);

  // Get checklist items with completion status
  const checklistItems: OnboardingItem[] = progress ? [
    {
      id: 'profile_completed',
      title: 'Complete your profile',
      description: 'Add your name and avatar',
      nctrReward: NCTR_REWARDS.profile_completed,
      route: '/profile',
      completed: progress.profile_completed,
    },
    {
      id: 'how_it_works_viewed',
      title: 'Learn How It Works',
      description: 'Understand the Crescendo system',
      nctrReward: NCTR_REWARDS.how_it_works_viewed,
      route: '/how-it-works',
      completed: progress.how_it_works_viewed,
    },
    {
      id: 'garden_visited',
      title: 'Browse The Garden',
      description: 'Discover 6,000+ earning brands',
      nctrReward: NCTR_REWARDS.garden_visited,
      externalUrl: 'https://thegarden.nctr.live/',
      completed: progress.garden_visited,
    },
    {
      id: 'first_wishlist_item',
      title: 'Add to wishlist',
      description: 'Save a reward you want',
      nctrReward: NCTR_REWARDS.first_wishlist_item,
      route: '/rewards',
      completed: progress.first_wishlist_item,
    },
    {
      id: 'first_referral',
      title: 'Invite a friend',
      description: 'Earn when they sign up',
      nctrReward: NCTR_REWARDS.first_referral,
      route: '/invite',
      completed: progress.first_referral,
    },
  ] : [];

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalItems = checklistItems.length;
  const progressPercent = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;
  const totalPotentialNCTR = Object.values(NCTR_REWARDS).reduce((a, b) => a + b, 0);
  const earnedNCTR = progress?.onboarding_nctr_awarded || 0;

  // Should show the checklist
  const shouldShowChecklist = isNewUser && !progress?.is_dismissed && completedCount < totalItems;

  return {
    progress,
    loading,
    checklistItems,
    completedCount,
    totalItems,
    progressPercent,
    totalPotentialNCTR,
    earnedNCTR,
    shouldShowChecklist,
    completeItem,
    dismissOnboarding,
    refetch: fetchProgress,
  };
}
