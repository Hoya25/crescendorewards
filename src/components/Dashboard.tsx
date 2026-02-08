import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ChevronRight, ChevronDown, Gift, TrendingUp } from "lucide-react";
import { SEO } from "./SEO";
import { FeaturedRewardsCarousel } from "./rewards/FeaturedRewardsCarousel";
import { WelcomeFlow, hasBeenOnboarded } from "./onboarding/WelcomeFlow";
import { OnboardingChecklist } from "./onboarding/OnboardingChecklist";
import { OnboardingProgress } from "./OnboardingProgress";
import { ReferredWelcomeModal } from "./referral/ReferredWelcomeModal";
import { AppLayout } from "./layout/AppLayout";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUnifiedUser } from "@/contexts/UnifiedUserContext";
import { supabase } from "@/lib/supabase";
import { DashboardSkeleton } from "./skeletons/DashboardSkeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { ActivityFeed } from "./ActivityFeed";
import { trackEvent } from "@/lib/analytics";
import { HeroVideoSection } from "./dashboard/HeroVideoSection";
import { QuickStatsBar } from "./dashboard/QuickStatsBar";
import { BrandSpotlight } from "./dashboard/BrandSpotlight";

export function Dashboard() {
  const navigate = useNavigate();
  const { profile, tier } = useUnifiedUser();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showReferredModal, setShowReferredModal] = useState(false);
  const [referrerName, setReferrerName] = useState<string | undefined>();
  const [activityOpen, setActivityOpen] = useState(false);
  const [featuredBrands, setFeaturedBrands] = useState<any[]>([]);
  const [spotlightBrand, setSpotlightBrand] = useState<any | null>(null);

  // Load featured brands for hero + spotlight
  useEffect(() => {
    const loadBrands = async () => {
      const { data } = await supabase
        .from('brands')
        .select('id, name, description, hero_video_url, image_url, logo_emoji, logo_color, shop_url, category, base_earning_rate, is_featured')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (data && data.length > 0) {
        setFeaturedBrands(data);
        // Pick a random brand for spotlight that's different from hero
        const spotlightIdx = data.length > 1 ? 1 : 0;
        setSpotlightBrand(data[spotlightIdx]);
      }
    };
    loadBrands();
  }, []);

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

    if (profile) checkReferralStatus();
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
  const tierName = tier?.display_name || 'Member';
  const userName = profile?.display_name || profile?.email?.split('@')[0] || 'User';

  return (
    <AppLayout>
      <SEO
        title="Dashboard"
        description="Your Crescendo dashboard — discover brands and claim rewards."
      />

      <main className="flex-1 px-4 md:px-6 pt-2 pb-4">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Onboarding */}
          <OnboardingChecklist />

          {/* 1. HERO VIDEO SECTION */}
          {featuredBrands.length > 0 && (
            <HeroVideoSection brands={featuredBrands} />
          )}

          {/* 2. QUICK STATS BAR */}
          <QuickStatsBar
            lockedNCTR={lockedNCTR}
            tierName={tierName}
            claimBalance={claimBalance}
          />

          {/* 3. FEATURED REWARDS */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" />
                Featured Rewards
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/rewards')} className="gap-1 h-7 text-xs">
                Browse All <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
            <FeaturedRewardsCarousel type="all" maxItems={6} showHeader={false} claimBalance={claimBalance} />
          </section>

          {/* 4. BRAND SPOTLIGHT */}
          {spotlightBrand && (
            <BrandSpotlight brand={spotlightBrand} />
          )}

          {/* 5. COMPACT ACTIVITY FEED */}
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
