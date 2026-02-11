import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ChevronRight, ChevronDown, Gift, TrendingUp } from "lucide-react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { ActivityFeed } from "./ActivityFeed";
import { trackEvent } from "@/lib/analytics";
import { HeroVideoSection } from "./dashboard/HeroVideoSection";
import { QuickStatsBar } from "./dashboard/QuickStatsBar";
import { CommunityFeedSection } from "./dashboard/CommunityFeedSection";
import { BrandSpotlight } from "./dashboard/BrandSpotlight";
import { MerchBountiesWidget } from "./dashboard/MerchBountiesWidget";
import { MerchStoreCTA } from "./dashboard/MerchStoreCTA";
import { useQuery } from "@tanstack/react-query";

export function Dashboard() {
  const navigate = useNavigate();
  const { profile, tier } = useUnifiedUser();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showReferredModal, setShowReferredModal] = useState(false);
  const [referrerName, setReferrerName] = useState<string | undefined>();
  const [activityOpen, setActivityOpen] = useState(false);
  const [spotlightBrand, setSpotlightBrand] = useState<any | null>(null);

  // Load featured content from content_submissions
  const { data: featuredContent = [] } = useQuery({
    queryKey: ['featured-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_submissions')
        .select('*')
        .eq('status', 'featured')
        .order('submitted_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  // Load a spotlight brand (kept for BrandSpotlight section)
  useEffect(() => {
    const loadSpotlight = async () => {
      const { data } = await supabase
        .from('brands')
        .select('id, name, description, hero_video_url, image_url, logo_emoji, logo_color, shop_url, category, base_earning_rate, is_featured')
        .eq('is_active', true)
        .eq('is_featured', true)
        .limit(2);
      if (data && data.length > 0) {
        setSpotlightBrand(data[0]);
      }
    };
    loadSpotlight();
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
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  const crescendoData = profile?.crescendo_data || {};
  const lockedNCTR = crescendoData.locked_nctr || 0;
  const claimBalance = crescendoData.claims_balance || 0;
  const tierName = tier?.display_name || 'Member';
  const userName = profile?.display_name || profile?.email?.split('@')[0] || 'User';

  return (
    <>
      <SEO
        title="Dashboard"
        description="Your Crescendo dashboard — discover brands and claim rewards."
      />

      <main className="flex-1 px-4 md:px-6 pt-2 pb-4">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Onboarding */}
          <OnboardingChecklist />

          {/* 1. HERO VIDEO SECTION */}
          {featuredContent.length > 0 ? (
            <HeroVideoSection content={featuredContent} />
          ) : (
            <section
              className="relative w-full rounded-xl overflow-hidden flex flex-col items-center justify-center text-center p-10"
              style={{ minHeight: '30vh', background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--muted)))' }}
            >
              <h2 className="text-xl font-bold text-foreground">Community Content Coming Soon</h2>
              <p className="text-muted-foreground mt-1 text-sm">Sponsors and contributors are sharing their stories</p>
              <Button size="sm" className="mt-4 gap-1" onClick={() => navigate('/rewards')}>
                Browse Rewards <ChevronRight className="w-3 h-3" />
              </Button>
            </section>
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

          {/* 3.5 MERCH BOUNTIES + SHOP CTA */}
          <MerchBountiesWidget />
          <MerchStoreCTA />

          {/* 3.6 COMMUNITY FEED */}
          <CommunityFeedSection />

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
    </>
  );
}
