import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Gift, ChevronRight, ChevronDown, ShoppingBag, UserPlus, TrendingUp, Sparkles } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { SEO } from "./SEO";
import { FeaturedRewardsCarousel } from "./rewards/FeaturedRewardsCarousel";
import { WelcomeFlow, hasBeenOnboarded } from "./onboarding/WelcomeFlow";
import { OnboardingChecklist } from "./onboarding/OnboardingChecklist";
import { OnboardingProgress } from "./OnboardingProgress";
import { ReferredWelcomeModal } from "./referral/ReferredWelcomeModal";
import { REFERRAL_REWARDS } from "@/constants/referral";
import { getMembershipTierByNCTR, getNextMembershipTier, getMembershipProgress, getNCTRNeededForNextLevel } from '@/utils/membershipLevels';
import { AppLayout } from "./layout/AppLayout";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUnifiedUser } from "@/contexts/UnifiedUserContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useReferralSettings } from "@/hooks/useReferralSettings";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { DashboardSkeleton } from "./skeletons/DashboardSkeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { ActivityFeed } from "./ActivityFeed";
import { trackEvent } from "@/lib/analytics";

export function Dashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuthContext();
  const { profile, tier, refreshUnifiedProfile } = useUnifiedUser();
  const { isAdmin } = useAdminRole();
  const { data: referralSettings } = useReferralSettings();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showReferredModal, setShowReferredModal] = useState(false);
  const [referrerName, setReferrerName] = useState<string | undefined>();
  const [activityOpen, setActivityOpen] = useState(false);
  
  const allocation = referralSettings?.allocation360Lock ?? REFERRAL_REWARDS.defaults.allocation360Lock;

  // Check if user was referred and show welcome modal
  useEffect(() => {
    const checkReferralStatus = async () => {
      const referralCode = sessionStorage.getItem('referral_code');
      const shownReferredModal = sessionStorage.getItem('shown_referred_modal');
      
      if (referralCode && !shownReferredModal && profile) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('referral_code', referralCode)
            .maybeSingle();
          
          if (data?.full_name) {
            setReferrerName(data.full_name.split(' ')[0]);
          }
          
          setShowReferredModal(true);
          sessionStorage.setItem('shown_referred_modal', 'true');
          
          localStorage.removeItem('referral_code');
          localStorage.removeItem('referral_link_type');
          localStorage.removeItem('referral_expiry');
          sessionStorage.removeItem('referral_code');
          sessionStorage.removeItem('referral_link_type');
        } catch (error) {
          console.error('Error fetching referrer info:', error);
        }
      }
    };
    
    if (profile) {
      checkReferralStatus();
    }
  }, [profile]);

  useEffect(() => {
    if (!hasBeenOnboarded() && !showReferredModal) {
      setShowWelcomeModal(true);
    }
  }, [showReferredModal]);

  const handleWelcomeClose = () => {
    setShowWelcomeModal(false);
    trackEvent('onboarding_completed');
  };

  const handleReferredModalClose = () => {
    setShowReferredModal(false);
    trackEvent('referred_welcome_completed');
  };

  if (!profile) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <DashboardSkeleton />
          </div>
        </div>
      </AppLayout>
    );
  }

  const crescendoData = profile?.crescendo_data || {};
  const lockedNCTR = crescendoData.locked_nctr || 0;
  const claimBalance = crescendoData.claims_balance || 0;
  const hasClaimedSignupBonus = crescendoData.has_claimed_signup_bonus || false;
  const referralCode = crescendoData.referral_code || 'CRES-LOADING';

  const nextTierData = getNextMembershipTier(lockedNCTR);
  const progressPercent = getMembershipProgress(lockedNCTR);
  const nctrNeeded = getNCTRNeededForNextLevel(lockedNCTR);

  const userName = profile?.display_name || profile?.email?.split('@')[0] || 'User';
  const firstName = userName.split(' ')[0];

  return (
    <AppLayout>
      <SEO 
        title="Dashboard"
        description="Your Crescendo dashboard — track your progress and claim rewards."
      />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Onboarding Checklist for new users */}
          <OnboardingChecklist />

          {/* ROW 1: Compact Welcome Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-card border">
            <div className="flex items-center gap-3">
              <StatusBadge tier={tier} size="md" showTooltip={false} />
              <div>
                <h1 className="text-lg font-bold">Welcome back, {firstName}!</h1>
                <p className="text-sm text-muted-foreground">
                  {claimBalance} claims available
                </p>
              </div>
            </div>
            {nextTierData && (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex-1 sm:w-48">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{nctrNeeded.toLocaleString()} pts to {nextTierData.name}</span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-1.5" />
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/membership')} className="text-xs gap-1 shrink-0">
                  Level Up <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          {/* ROW 2: Featured Rewards Carousel — HERO of dashboard */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                Rewards For You
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/rewards')} className="gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <FeaturedRewardsCarousel type="all" maxItems={8} showHeader={false} claimBalance={claimBalance} />
          </section>

          {/* ROW 3: Quick Actions — 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all" onClick={() => window.open('https://thegarden.nctr.live/', '_blank')}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shrink-0">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">Earn Points</h3>
                  <p className="text-sm text-muted-foreground">Shop 6,000+ brands</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all" onClick={() => navigate('/invite')}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shrink-0">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">Invite Friends</h3>
                  <p className="text-sm text-muted-foreground">Earn {allocation} pts per signup</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all" onClick={() => navigate('/membership')}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">Your Progress</h3>
                  <p className="text-sm text-muted-foreground">{tier?.display_name || 'Member'} level</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </div>

          {/* ROW 4: Collapsible Activity Feed */}
          <Collapsible open={activityOpen} onOpenChange={setActivityOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between py-3 text-muted-foreground hover:text-foreground">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Recent Activity
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${activityOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ActivityFeed />
            </CollapsibleContent>
          </Collapsible>
          
          {/* Bottom padding for mobile nav */}
          <div className="h-20 md:hidden" />
        </div>
      </main>

      <WelcomeFlow 
        isOpen={showWelcomeModal} 
        onClose={handleWelcomeClose} 
        claimsBalance={claimBalance}
      />
      <ReferredWelcomeModal
        isOpen={showReferredModal}
        onClose={handleReferredModalClose}
        userName={userName}
        referrerName={referrerName}
      />
      <OnboardingProgress />
    </AppLayout>
  );
}
