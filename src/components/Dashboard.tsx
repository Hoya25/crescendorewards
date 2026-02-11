import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ChevronRight } from "lucide-react";
import { SEO } from "./SEO";
import { FeaturedRewardsCarousel } from "./rewards/FeaturedRewardsCarousel";
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
import { MerchBountiesWidget } from "./dashboard/MerchBountiesWidget";
import { CommunityFeedSection } from "./dashboard/CommunityFeedSection";
import { Gift } from "lucide-react";

export function Dashboard() {
  const navigate = useNavigate();
  const { profile, tier } = useUnifiedUser();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showReferredModal, setShowReferredModal] = useState(false);
  const [referrerName, setReferrerName] = useState<string | undefined>();

  const crescendoData = profile?.crescendo_data || {};
  const claimBalance = (crescendoData as any).claims_balance || 0;
  const userName = profile?.display_name || profile?.email?.split("@")[0] || "User";

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
          {/* Onboarding */}
          <OnboardingChecklist />

          {/* 1. STATUS HERO */}
          <StatusHero />

          {/* 2. QUICK ACTIONS */}
          <QuickActions />

          {/* 3. WHAT'S UNLOCKING NEXT */}
          <NextUnlocks />

          {/* 4. FEATURED REWARDS */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" />
                Featured Rewards
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/rewards")}
                className="gap-1 h-7 text-xs"
              >
                Browse All <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
            <FeaturedRewardsCarousel
              type="all"
              maxItems={6}
              showHeader={false}
              claimBalance={claimBalance}
            />
          </section>

          {/* 5. MERCH BOUNTIES (conditional) */}
          <MerchBountiesWidget />

          {/* 6. COMMUNITY FEED */}
          <CommunityFeedSection />

          {/* 7. ACTIVITY FEED */}
          <ActivityFeed maxItems={10} />

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
    </>
  );
}
