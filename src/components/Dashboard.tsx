import { useState, useEffect } from "react";
import { SEO } from "./SEO";
import { WelcomeFlow, hasBeenOnboarded } from "./onboarding/WelcomeFlow";
import { OnboardingChecklist } from "./onboarding/OnboardingChecklist";
import { OnboardingProgress } from "./OnboardingProgress";
import { ReferredWelcomeModal } from "./referral/ReferredWelcomeModal";
import { useNavigate } from "react-router-dom";
import { useUnifiedUser } from "@/contexts/UnifiedUserContext";
import { supabase } from "@/lib/supabase";
import { DashboardSkeleton } from "./skeletons/DashboardSkeleton";
import { ActivityFeed } from "./ActivityFeed";
import { trackEvent } from "@/lib/analytics";
import { StatusHero } from "./dashboard/StatusHero";
import { QuickActions } from "./dashboard/QuickActions";
import { NextUnlocks } from "./dashboard/NextUnlocks";
import { StatusExplainer } from "./dashboard/StatusExplainer";
import { MerchBountiesWidget } from "./dashboard/MerchBountiesWidget";
import { YourNextStep } from "./dashboard/YourNextStep";
import { MerchBountyReminderCard } from "./dashboard/MerchBountyReminderCard";
import { MerchCelebrationModal } from "./merch/MerchCelebrationModal";
import { useUncelebratedPurchases } from "@/hooks/useMerchCelebration";

export function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useUnifiedUser();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showReferredModal, setShowReferredModal] = useState(false);
  const [referrerName, setReferrerName] = useState<string | undefined>();
  const [showMerchCelebration, setShowMerchCelebration] = useState(false);

  const { data: uncelebratedPurchases = [] } = useUncelebratedPurchases();

  const crescendoData = profile?.crescendo_data || {};
  const claimBalance = (crescendoData as any).claims_balance || 0;
  const userName = profile?.display_name || profile?.email?.split("@")[0] || "User";

  // Show merch celebration when uncelebrated purchases are detected
  useEffect(() => {
    if (uncelebratedPurchases.length > 0 && !showWelcomeModal && !showReferredModal) {
      setShowMerchCelebration(true);
    }
  }, [uncelebratedPurchases.length, showWelcomeModal, showReferredModal]);

  // Check if user was referred and show welcome modal
  useEffect(() => {
    const checkReferralStatus = async () => {
      const referralCode = sessionStorage.getItem("referral_code");
      const shownReferredModal = sessionStorage.getItem("shown_referred_modal");

      if (referralCode && !shownReferredModal && profile) {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("referral_code", referralCode)
            .maybeSingle();

          if (data?.full_name) {
            setReferrerName(data.full_name.split(" ")[0]);
          }

          setShowReferredModal(true);
          sessionStorage.setItem("shown_referred_modal", "true");
          localStorage.removeItem("referral_code");
          localStorage.removeItem("referral_link_type");
          localStorage.removeItem("referral_expiry");
          sessionStorage.removeItem("referral_code");
          sessionStorage.removeItem("referral_link_type");
        } catch (error) {
          console.error("Error fetching referrer info:", error);
        }
      }
    };

    if (profile) checkReferralStatus();
  }, [profile]);

  useEffect(() => {
    if (!hasBeenOnboarded() && !showReferredModal) {
      setShowWelcomeModal(true);
    }
  }, [showReferredModal]);

  const handleWelcomeClose = () => {
    setShowWelcomeModal(false);
    trackEvent("onboarding_completed");
  };

  const handleReferredModalClose = () => {
    setShowReferredModal(false);
    trackEvent("referred_welcome_completed");
  };

  if (!profile) {
    return (
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Dashboard"
        description="Your Crescendo dashboard — discover brands and claim rewards."
      />

      <main className="flex-1 px-4 md:px-6 pt-3 pb-4">
        <div className="max-w-7xl mx-auto space-y-5">
          {/* 0. YOUR NEXT STEP — dynamic contextual CTA */}
          <YourNextStep />

          {/* 0.5 MERCH BOUNTY REMINDER — persistent until bounties completed */}
          <MerchBountyReminderCard />

          {/* Onboarding checklist (conditional) */}
          <OnboardingChecklist />

          {/* 1. STATUS PROGRESS CARD */}
          <StatusHero />

          {/* 2. QUICK ACTIONS — "Your Next Move" */}
          <QuickActions />

          {/* 3. ACTIVITY FEED */}
          <ActivityFeed maxItems={10} />

          {/* 4. WHAT'S UNLOCKING NEXT */}
          <div id="next-unlocks">
            <NextUnlocks />
          </div>

          {/* 5. MERCH BOUNTIES (conditional) */}
          <MerchBountiesWidget />

          {/* 6. STATUS EXPLAINER (collapsible) */}
          <StatusExplainer />

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

      {/* Merch Purchase Celebration Modal */}
      {showMerchCelebration && uncelebratedPurchases.length > 0 && (
        <MerchCelebrationModal
          purchases={uncelebratedPurchases}
          onDismiss={() => setShowMerchCelebration(false)}
        />
      )}
    </>
  );
}
