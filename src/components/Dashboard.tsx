import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Sparkles, Lock, Gift, Trophy, TrendingUp, ChevronRight, Plus, Calendar, UserPlus, Moon, Sun, Store, Wallet, User, Settings, ChevronDown, LogOut, Coins, CheckCircle2, Zap, FileCheck, Receipt, Crown, BarChart3, UtensilsCrossed, Heart, ShoppingBag, ExternalLink, AlertCircle, ClipboardList } from "lucide-react";
import { NCTRLogo } from "./NCTRLogo";
import { CrescendoLogo } from "./CrescendoLogo";
import { BetaBadge } from "./BetaBadge";
import { ThemeToggle } from "./ThemeToggle";
import { ReferralCard } from "./ReferralCard";
import { BuyClaims } from "./BuyClaims";
import { WelcomeModal } from "./WelcomeModal";
import { OnboardingProgress } from "./OnboardingProgress";
import { NeedsAttention } from "./NeedsAttention";
import { ActivityFeed } from "./ActivityFeed";
import { FavoritesIndicator } from "./FavoritesIndicator";
import { StatusBadge } from "./StatusBadge";
import { SEO } from "./SEO";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { Footer } from "./Footer";
import { SponsoredRewardsCarousel } from "./rewards/SponsoredRewardsCarousel";
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
import { toast } from "sonner";
import { DashboardSkeleton } from "./skeletons/DashboardSkeleton";
import { useFavorites } from "@/hooks/useFavorites";

const WELCOME_SEEN_KEY = "crescendo_welcome_seen";

// Quick Actions component with Favorites
function QuickActionsWithFavorites({ navigate }: { navigate: (path: string) => void }) {
  const { favoritesCount } = useFavorites();
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card 
        className="cursor-pointer hover:border-primary/30 transition-colors"
        onClick={() => navigate('/rewards')}
      >
        <CardContent className="p-4 text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
            <Gift className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="font-medium">Browse Rewards</h3>
          <p className="text-sm text-muted-foreground">Explore marketplace</p>
        </CardContent>
      </Card>
      
      <Card 
        className="cursor-pointer hover:border-primary/30 transition-colors group"
        onClick={() => window.open('https://thegarden.nctr.live/', '_blank')}
      >
        <CardContent className="p-4 text-center relative">
          <ExternalLink className="w-3 h-3 absolute top-2 right-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="font-medium">Earn NCTR</h3>
          <p className="text-sm text-muted-foreground">Via The Garden</p>
        </CardContent>
      </Card>
      
      <Card 
        className="cursor-pointer hover:border-primary/30 transition-colors"
        onClick={() => navigate('/favorites')}
      >
        <CardContent className="p-4 text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center relative">
            <Heart className="w-6 h-6 text-red-500" />
            {favoritesCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-xs bg-red-500 hover:bg-red-500 text-white border-0">
                {favoritesCount}
              </Badge>
            )}
          </div>
          <h3 className="font-medium">My Favorites</h3>
          <p className="text-sm text-muted-foreground">{favoritesCount} saved</p>
        </CardContent>
      </Card>
      
      <Card 
        className="cursor-pointer hover:border-primary/30 transition-colors"
        onClick={() => navigate('/submit-reward')}
      >
        <CardContent className="p-4 text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
            <Plus className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-medium">Submit Reward</h3>
          <p className="text-sm text-muted-foreground">Contribute ideas</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Admin Stats Banner Component
function AdminStatsBanner({ navigate }: { navigate: (path: string) => void }) {
  const { pendingClaims, pendingSubmissions, loading, totalPending } = useAdminNotifications();

  if (loading || totalPending === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-500/20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
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
                <ClipboardList className="w-4 h-4 text-orange-600 dark:text-orange-400" />
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
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(WELCOME_SEEN_KEY);
    if (hasSeenWelcome !== "true") {
      setShowWelcomeModal(true);
    }
  }, []);

  const handleWelcomeClose = () => {
    localStorage.setItem(WELCOME_SEEN_KEY, "true");
    setShowWelcomeModal(false);
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
  const hasStatusAccessPass = crescendoData.has_status_access_pass || false;
  const hasClaimedSignupBonus = crescendoData.has_claimed_signup_bonus || false;
  const referralCode = crescendoData.referral_code || 'CRES-LOADING';

  // Calculate tier based on locked NCTR (360LOCK)
  const currentTier = getMembershipTierByNCTR(lockedNCTR);
  const nextTierData = getNextMembershipTier(lockedNCTR);
  const progressPercent = getMembershipProgress(lockedNCTR);
  const nctrNeeded = getNCTRNeededForNextLevel(lockedNCTR);

  const userData = {
    level: currentTier.level,
    tier: currentTier.name,
    lockedNCTR: lockedNCTR,
    nextLevelThreshold: nextTierData?.requirement || currentTier.requirement,
    multiplier: currentTier.multiplier.toString() + 'x',
    claimBalance: claimBalance,
    claimsPerYear: currentTier.claims,
    discount: currentTier.discount + '%',
    hasStatusAccessPass: hasStatusAccessPass,
  };

  // Mock referral data (will be calculated from referrals table in future)
  const referralStats = {
    totalReferrals: 0,
    totalEarned: hasClaimedSignupBonus ? availableNCTR : 0,
    signupBonus: 100,
    hasClaimedSignupBonus: hasClaimedSignupBonus,
  };

  const levelColors = {
    0: { gradient: 'from-slate-400 to-gray-500', bg: 'bg-slate-50', border: 'border-slate-200' },
    1: { gradient: 'from-emerald-400 to-green-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    2: { gradient: 'from-blue-400 to-cyan-500', bg: 'bg-blue-50', border: 'border-blue-200' },
    3: { gradient: 'from-purple-400 to-violet-500', bg: 'bg-purple-50', border: 'border-purple-200' },
    4: { gradient: 'from-amber-400 to-yellow-500', bg: 'bg-amber-50', border: 'border-amber-200' },
    5: { gradient: 'from-cyan-400 to-blue-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
  };

  const currentLevelStyle = levelColors[userData.level as keyof typeof levelColors];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast.success("Signed out successfully");
  };

  const handleConnectWallet = () => {
    toast.info("Wallet connection coming soon!");
  };

  const handleLockTokens = () => {
    toast.info("Lock tokens modal coming soon!");
  };


  const handleLevelUp = () => {
    toast.info("Level up modal coming soon!");
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
              {/* Mobile Layout - Stacked */}
              <div className="flex flex-col gap-4 md:hidden">
                <div className="flex items-center justify-center gap-4">
                  <SidebarTrigger />
                  <button
                    onClick={() => navigate('/rewards')}
                    className="hover:opacity-80 transition-opacity cursor-pointer flex items-center"
                  >
                    <CrescendoLogo />
                    <BetaBadge />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {/* Admin Quick Access - Mobile */}
                  {isAdmin && (
                    <Button
                      onClick={() => navigate('/admin')}
                      size="sm"
                      className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                    >
                      <Crown className="w-4 h-4" />
                      Admin
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => navigate('/membership')}
                    className="gap-2"
                    size="sm"
                  >
                    <Trophy className="w-4 h-4" />
                    Membership
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/rewards')}
                    className="gap-2"
                    size="sm"
                  >
                    <Gift className="w-4 h-4" />
                    Rewards
                  </Button>
                  <FavoritesIndicator />
                  <NotificationsDropdown />
                  <ThemeToggle />
                </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <StatusBadge tier={tier} size="sm" showTooltip={false} />
              <Badge className="gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Wallet Connected
              </Badge>
              <Button variant="ghost" onClick={handleSignOut} size="sm">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

              {/* Desktop Layout - Single Row */}
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

                <div className="flex items-center gap-4">
                  {/* Admin Quick Access Button - Prominent placement */}
                  {isAdmin && (
                    <Button
                      onClick={() => navigate('/admin')}
                      className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md"
                    >
                      <Crown className="w-4 h-4" />
                      Admin Panel
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => navigate('/membership')}
                    className="gap-2"
                  >
                    <Trophy className="w-4 h-4" />
                    Membership
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/rewards')}
                    className="gap-2"
                  >
                    <Gift className="w-4 h-4" />
                    Rewards
                  </Button>
                  <FavoritesIndicator />
                  <NotificationsDropdown />
                  <ThemeToggle />
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge tier={tier} size="sm" />
                  
                  <Badge className="gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Wallet Connected
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-2">
                        <User className="w-4 h-4" />
                        {profile?.display_name || profile?.email?.split('@')[0] || 'User'}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => navigate('/profile')}>
                        <User className="w-4 h-4 mr-2" />
                        Profile
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
            <div className="max-w-7xl mx-auto space-y-6">

              {/* Needs Your Attention */}
              <NeedsAttention />

              {/* Membership Progress Card */}
              <Card className={`border-2 ${currentLevelStyle.border} dark:border-neutral-700`}>
                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${currentLevelStyle.gradient} flex items-center justify-center shadow-lg`}>
                        <Trophy className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{userData.tier}</CardTitle>
                        <p className="text-muted-foreground">Level {userData.level + 1} Membership</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {userData.multiplier} Multiplier
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Gift className="w-3 h-3" />
                        {userData.claimsPerYear}
                      </Badge>
                      {Number(userData.discount.replace('%', '')) > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          {userData.discount} Off
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {nextTierData && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress to {nextTierData.name}</span>
                        <span className="font-medium flex items-center gap-1">
                          {userData.lockedNCTR.toLocaleString()} / {userData.nextLevelThreshold.toLocaleString()} <NCTRLogo />
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-3" />
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        Lock {nctrNeeded.toLocaleString()} more <NCTRLogo /> to reach {nextTierData.name}
                      </p>
                    </>
                  )}
                  <div className="flex flex-col md:flex-row gap-3 pt-2">
                    <Button onClick={handleLockTokens} className="flex-1 gap-2">
                      <Lock className="w-4 h-4" />
                      Lock More NCTR
                    </Button>
                    <Button onClick={() => navigate('/membership')} variant="outline" className="flex-1 gap-2">
                      View All Levels <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <QuickActionsWithFavorites navigate={navigate} />

              {/* Sponsored Opportunities */}
              <SponsoredRewardsCarousel />

              {/* Claim Balance & Buy Claims */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500" />
                      Claim Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold mb-2">{userData.claimBalance}</div>
                    <p className="text-muted-foreground mb-4">Claims available to redeem rewards</p>
                    <Button onClick={() => navigate('/rewards')} className="w-full">
                      Use Claims <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>

                <BuyClaims currentBalance={userData.claimBalance} onPurchaseSuccess={refreshUnifiedProfile} />
              </div>

              {/* Referral Card */}
              <ReferralCard
                referralCode={referralCode}
                stats={referralStats}
              />

              {/* Recent Activity */}
              <ActivityFeed />
            </div>
          </main>
          <Footer />
        </div>
      </div>
      <WelcomeModal isOpen={showWelcomeModal} onClose={handleWelcomeClose} />
      <OnboardingProgress />
    </SidebarProvider>
  );
}
