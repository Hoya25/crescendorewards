import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Gift, Trophy, TrendingUp, ChevronRight, ChevronDown, LogOut, Zap, FileCheck, Receipt, Crown, BarChart3, Heart, ShoppingBag, User, UserPlus } from "lucide-react";
import { NCTRLogo } from "./NCTRLogo";
import { CrescendoLogo } from "./CrescendoLogo";
import { BetaBadge } from "./BetaBadge";
import { ThemeToggle } from "./ThemeToggle";
import { ReferralCard } from "./ReferralCard";
import { useReferralStats } from "@/hooks/useReferralStats";
import { useReferralSettings } from "@/hooks/useReferralSettings";
import { WelcomeFlow, hasBeenOnboarded } from "./onboarding/WelcomeFlow";
import { OnboardingProgress } from "./OnboardingProgress";
import { NeedsAttention } from "./NeedsAttention";
import { ActivityFeed } from "./ActivityFeed";
import { FavoritesIndicator } from "./FavoritesIndicator";
import { ClaimsBalanceIndicator } from "./claims/ClaimsBalanceIndicator";
import { ClaimsAccountDashboard } from "./claims/ClaimsAccountDashboard";
import { PortfolioSummaryCard } from "./PortfolioSummaryCard";
import { StatusBadge } from "./StatusBadge";
import { PortfolioIndicator } from "./PortfolioIndicator";
import { SEO } from "./SEO";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { Footer } from "./Footer";
import { SponsoredRewardsCarousel } from "./rewards/SponsoredRewardsCarousel";
import { FeaturedRewardsCarousel } from "./rewards/FeaturedRewardsCarousel";
import { BetaTestingNotice } from "./BetaTestingNotice";
import { InviteHeaderCTA } from "./navigation/InviteHeaderCTA";
import { EarnNCTRQuickCard } from "./dashboard/EarnNCTRQuickCard";
import { ReferredWelcomeModal } from "./referral/ReferredWelcomeModal";
import { REFERRAL_REWARDS } from "@/constants/referral";
import { getMembershipTierByNCTR, getNextMembershipTier, getMembershipProgress, getNCTRNeededForNextLevel } from '@/utils/membershipLevels';
import { useTheme } from "./ThemeProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUnifiedUser } from "@/contexts/UnifiedUserContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { DashboardSkeleton } from "./skeletons/DashboardSkeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { trackEvent } from "@/lib/analytics";

// Simplified Quick Actions - 3 cards only
function SimplifiedQuickActions({ navigate, claimBalance, allocation }: { navigate: (path: string) => void; claimBalance: number; allocation: number }) {
  const showGetClaimsHighlight = claimBalance < 20;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Primary: Browse Rewards */}
      <Card 
        className="cursor-pointer border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/50 transition-all hover:shadow-md"
        onClick={() => navigate('/rewards')}
      >
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <Gift className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Browse Rewards</h3>
            <p className="text-sm text-muted-foreground">Explore the marketplace</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
        </CardContent>
      </Card>
      
      {/* Earn Free Claims */}
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${showGetClaimsHighlight ? 'border-amber-400/50 bg-gradient-to-br from-amber-500/5 to-amber-500/10' : 'hover:border-primary/30'}`}
        onClick={() => navigate('/buy-claims')}
      >
        <CardContent className="p-5 flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${showGetClaimsHighlight ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-emerald-500 to-green-500'}`}>
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              {showGetClaimsHighlight ? 'Get More Claims' : 'Earn Free Claims'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {showGetClaimsHighlight ? 'Low balance - top up now' : 'Purchase claim packs'}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
        </CardContent>
      </Card>
      
      {/* Invite Friends - Made prominent */}
      <Card 
        className="cursor-pointer border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/50 transition-all hover:shadow-md"
        onClick={() => navigate('/invite')}
      >
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <UserPlus className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Invite Friends</h3>
            <p className="text-sm text-muted-foreground">{REFERRAL_REWARDS.descriptions.inviter.short(allocation)}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
        </CardContent>
      </Card>
    </div>
  );
}

// Consolidated Hero Card
function HeroCard({ 
  userName, 
  tier, 
  claimBalance, 
  lockedNCTR,
  nextTier,
  progressPercent,
  nctrNeeded,
  navigate 
}: { 
  userName: string;
  tier: any;
  claimBalance: number;
  lockedNCTR: number;
  nextTier: any;
  progressPercent: number;
  nctrNeeded: number;
  navigate: (path: string) => void;
}) {
  const showGetMore = claimBalance < 20;
  
  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left: Welcome + Status */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <Trophy className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {userName}!</h1>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge tier={tier} size="md" showTooltip={false} />
                {nextTier && (
                  <span className="text-sm text-muted-foreground">
                    · {nctrNeeded.toLocaleString()} NCTR to {nextTier.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Right: Claims Balance */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Claims Balance</p>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-4xl font-bold">{claimBalance}</span>
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
            </div>
            {showGetMore && (
              <Button 
                onClick={() => navigate('/buy-claims')} 
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                Get More
              </Button>
            )}
          </div>
        </div>
        
        {/* Progress bar (subtle) */}
        {nextTier && (
          <div className="mt-6 pt-4 border-t border-border/50">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Tier Progress</span>
              <span className="font-medium flex items-center gap-1">
                {lockedNCTR.toLocaleString()} / {nextTier.requirement.toLocaleString()} <NCTRLogo />
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Admin Stats Banner Component (unchanged)
function AdminStatsBanner({ navigate }: { navigate: (path: string) => void }) {
  const { pendingClaims, pendingSubmissions, loading, totalPending } = useAdminNotifications();

  if (loading || totalPending === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-500/20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="font-medium text-amber-700 dark:text-amber-300">Admin Quick Stats</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {pendingClaims > 0 && (
              <button
                onClick={() => navigate('/admin?tab=claims')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 transition-colors"
              >
                <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  {pendingClaims} Pending Claim{pendingClaims !== 1 ? 's' : ''}
                </span>
              </button>
            )}
            
            {pendingSubmissions > 0 && (
              <button
                onClick={() => navigate('/admin?tab=submissions')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 transition-colors"
              >
                <FileCheck className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  {pendingSubmissions} Pending Submission{pendingSubmissions !== 1 ? 's' : ''}
                </span>
              </button>
            )}
            
            <Button
              onClick={() => navigate('/admin')}
              size="sm"
              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
            >
              <Crown className="w-4 h-4" />
              Open Admin
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuthContext();
  const { profile, tier, refreshUnifiedProfile } = useUnifiedUser();
  const { isAdmin } = useAdminRole();
  const { theme } = useTheme();
  const { data: referralStats, isLoading: referralLoading } = useReferralStats();
  const { data: referralSettings } = useReferralSettings();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showReferredModal, setShowReferredModal] = useState(false);
  const [referrerName, setReferrerName] = useState<string | undefined>();
  const [activityOpen, setActivityOpen] = useState(false);
  
  const allocation = referralSettings?.allocation360Lock ?? REFERRAL_REWARDS.defaults.allocation360Lock;

  // Check if user was referred and show welcome modal
  useEffect(() => {
    const checkReferralStatus = async () => {
      // Check for stored referral info that hasn't been shown yet
      const referralCode = sessionStorage.getItem('referral_code');
      const shownReferredModal = sessionStorage.getItem('shown_referred_modal');
      
      if (referralCode && !shownReferredModal && profile) {
        // Fetch referrer name
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
          
          // Clear referral data from storage after crediting
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
      <SidebarProvider>
        <div className="min-h-screen w-full flex bg-neutral-50 dark:bg-neutral-950">
          <AppSidebar />
          <div className="flex-1 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <DashboardSkeleton />
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  // Get crescendo data from unified profile
  const crescendoData = profile?.crescendo_data || {};
  const lockedNCTR = crescendoData.locked_nctr || 0;
  const availableNCTR = crescendoData.available_nctr || 100;
  const claimBalance = crescendoData.claims_balance || 0;
  const hasClaimedSignupBonus = crescendoData.has_claimed_signup_bonus || false;
  const referralCode = crescendoData.referral_code || 'CRES-LOADING';

  // Calculate tier based on locked NCTR
  const currentTier = getMembershipTierByNCTR(lockedNCTR);
  const nextTierData = getNextMembershipTier(lockedNCTR);
  const progressPercent = getMembershipProgress(lockedNCTR);
  const nctrNeeded = getNCTRNeededForNextLevel(lockedNCTR);

  const userName = profile?.display_name || profile?.email?.split('@')[0] || 'User';

  // Default referral stats while loading
  const defaultReferralStats = {
    totalReferrals: 0,
    successfulReferrals: 0,
    totalEarned: 0,
    signupBonus: 100,
    hasClaimedSignupBonus: hasClaimedSignupBonus,
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast.success("Signed out successfully");
  };

  return (
    <SidebarProvider>
      <SEO 
        title="Dashboard"
        description="Manage your Crescendo membership, track your NCTR balance, and access exclusive rewards."
      />
      <div className="min-h-screen w-full flex bg-neutral-50 dark:bg-neutral-950">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Navigation */}
          <nav className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
            <div className="max-w-7xl mx-auto px-6 py-4">
              {/* Mobile Layout */}
              <div className="flex flex-col gap-4 md:hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <CrescendoLogo />
                    <BetaBadge />
                  </div>
                  <div className="flex items-center gap-2">
                    <NotificationsDropdown />
                    <ThemeToggle />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClaimsBalanceIndicator compact />
                    <FavoritesIndicator />
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <button
                    onClick={() => navigate('/rewards')}
                    className="hover:opacity-80 transition-opacity cursor-pointer flex items-center"
                  >
                    <CrescendoLogo />
                    <BetaBadge />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <Button
                      onClick={() => navigate('/admin')}
                      className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md"
                    >
                      <Crown className="w-4 h-4" />
                      Admin Panel
                    </Button>
                  )}
                  <InviteHeaderCTA />
                  <Button variant="outline" onClick={() => navigate('/rewards')} className="gap-2">
                    <Gift className="w-4 h-4" />
                    Rewards
                  </Button>
                  <PortfolioIndicator />
                  <ClaimsBalanceIndicator />
                  <FavoritesIndicator />
                  <NotificationsDropdown />
                  <ThemeToggle />
                </div>

                <div className="flex items-center gap-3">
                  <Badge className="gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Connected
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-2">
                        <User className="w-4 h-4" />
                        {userName}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => navigate('/profile')}>
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/membership')}>
                        <Trophy className="w-4 h-4 mr-2" />
                        Membership
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/my-submissions')}>
                        <FileCheck className="w-4 h-4 mr-2" />
                        My Submissions
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/purchase-history')}>
                        <Receipt className="w-4 h-4 mr-2" />
                        Purchase History
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/referrals')}>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Referral Analytics
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/wishlist')}>
                        <Heart className="w-4 h-4 mr-2" />
                        Wishlist
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                          <Crown className="w-4 h-4 mr-2" />
                          Admin Panel
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </nav>

          {/* Admin Quick Stats Banner */}
          {isAdmin && <AdminStatsBanner navigate={navigate} />}

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Beta Testing Notice */}
              <BetaTestingNotice variant="compact" />

              {/* Needs Your Attention (kept) */}
              <NeedsAttention />

              {/* 1. Consolidated Hero Card */}
              <HeroCard 
                userName={userName}
                tier={tier}
                claimBalance={claimBalance}
                lockedNCTR={lockedNCTR}
                nextTier={nextTierData}
                progressPercent={progressPercent}
                nctrNeeded={nctrNeeded}
                navigate={navigate}
              />

              {/* 2. Referral Card - Moved up for prominence */}
              <ReferralCard
                referralCode={referralCode}
                stats={referralStats || defaultReferralStats}
                isLoading={referralLoading}
              />

              {/* 3. Simplified Quick Actions (3 cards) */}
              <SimplifiedQuickActions navigate={navigate} claimBalance={claimBalance} allocation={allocation} />

              {/* 4. Portfolio, Claims & Earn Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <PortfolioSummaryCard />
                <ClaimsAccountDashboard />
                <EarnNCTRQuickCard />
              </div>

              {/* 5. Featured Rewards Carousel */}
              <FeaturedRewardsCarousel />

              {/* 6. Sponsored Rewards Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Gift className="w-5 h-5 text-primary" />
                    Rewards You Can Claim
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/rewards')} className="gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <SponsoredRewardsCarousel />
              </section>

              {/* Collapsible Activity Feed */}
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
          <Footer />
        </div>
      </div>
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
    </SidebarProvider>
  );
}
