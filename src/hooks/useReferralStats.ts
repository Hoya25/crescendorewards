import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  totalEarned: number;
  signupBonus: number;
  hasClaimedSignupBonus: boolean;
}

export function useReferralStats() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['referral-stats', user?.id],
    queryFn: async (): Promise<ReferralStats> => {
      if (!user?.id) {
        return {
          totalReferrals: 0,
          successfulReferrals: 0,
          totalEarned: 0,
          signupBonus: 100,
          hasClaimedSignupBonus: false,
        };
      }

      // Fetch referrals where current user is the referrer
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select('id, is_paid, referral_bonus')
        .eq('referrer_id', user.id);

      if (referralsError) {
        console.error('Error fetching referrals:', referralsError);
        throw referralsError;
      }

      // Fetch user profile for signup bonus status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('has_claimed_signup_bonus')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }

      const totalReferrals = referrals?.length ?? 0;
      const successfulReferrals = referrals?.filter(r => r.is_paid)?.length ?? 0;
      const totalEarned = referrals?.reduce((sum, r) => sum + (r.referral_bonus || 0), 0) ?? 0;

      return {
        totalReferrals,
        successfulReferrals,
        totalEarned,
        signupBonus: 100,
        hasClaimedSignupBonus: profile?.has_claimed_signup_bonus ?? false,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
