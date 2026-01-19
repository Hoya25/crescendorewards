import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Sparkles, Lock, Gift, Trophy, TrendingUp, ChevronRight, Award, Plus, Calendar, UserPlus, Moon, Sun, Store, Wallet, User, Settings, ChevronDown, LogOut, Coins, CheckCircle2, Zap, FileCheck, Receipt, Crown, BarChart3, UtensilsCrossed, Heart, ShoppingBag, ExternalLink } from "lucide-react";
import { NCTRLogo } from "./NCTRLogo";
import { CrescendoLogo } from "./CrescendoLogo";
import { ThemeToggle } from "./ThemeToggle";
import { ReferralCard } from "./ReferralCard";
import { BuyClaims } from "./BuyClaims";
import { WelcomeModal } from "./WelcomeModal";
import { OnboardingProgress } from "./OnboardingProgress";
import { SEO } from "./SEO";
import { getMembershipTierByNCTR, getNextMembershipTier, getMembershipProgress, getNCTRNeededForNextLevel } from '@/utils/membershipLevels';
import { useTheme } from "./ThemeProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { toast } from "sonner";
import { DashboardSkeleton } from "./skeletons/DashboardSkeleton";

const WELCOME_SEEN_KEY = "crescendo_welcome_seen";

export function Dashboard() {
  const navigate = useNavigate();
  const { profile, signOut, refreshProfile } = useAuthContext();
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
          <AppSidebar onNavigate={() => navigate('/brands')} />
          <div className="flex-1 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <DashboardSkeleton />
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  // Calculate tier based on locked NCTR (360LOCK)
  const currentTier = getMembershipTierByNCTR(profile.locked_nctr);
  const nextTier = getNextMembershipTier(profile.locked_nctr);
  const progressPercent = getMembershipProgress(profile.locked_nctr);
  const nctrNeeded = getNCTRNeededForNextLevel(profile.locked_nctr);

  const userData = {
    level: currentTier.level,
    tier: currentTier.name,
    lockedNCTR: profile.locked_nctr,
    nextLevelThreshold: nextTier?.requirement || currentTier.requirement,
    multiplier: currentTier.multiplier.toString() + 'x',
    claimBalance: profile.claim_balance,
    claimsPerYear: currentTier.claims,
    discount: currentTier.discount + '%',
    hasStatusAccessPass: profile.has_status_access_pass,
  };

  // Mock referral data (will be calculated from referrals table in future)
  const referralStats = {
    totalReferrals: 0,
    totalEarned: profile.has_claimed_signup_bonus ? profile.available_nctr : 0,
    signupBonus: 100,
    hasClaimedSignupBonus: profile.has_claimed_signup_bonus,
  };

  const referralCode = profile.referral_code || 'CRES-LOADING';

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

  const handleClaimNFT = () => {
    toast.info("Claim NFT modal coming soon!");
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
        <AppSidebar onNavigate={() => navigate('/brands')} />
        
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
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <CrescendoLogo />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
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
                  <ThemeToggle />
                </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
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
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <CrescendoLogo />
                  </button>
                </div>

                <div className="flex items-center gap-4">
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
                  <ThemeToggle />
                </div>

                <div className="flex items-center gap-4">
                  <Badge className="gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Wallet Connected
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-2">
                        <User className="w-4 h-4" />
                        {profile.full_name || profile.email?.split('@')[0] || 'User'}
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

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Status Access Pass Banner */}
              {!userData.hasStatusAccessPass && (
                <Card className="border-2 border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20">
                  <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Claim Your Status Access Pass</h3>
                        <p className="text-sm text-muted-foreground">Mint your Status NFT on Base to unlock exclusive benefits</p>
                      </div>
                    </div>
                    <Button onClick={handleClaimNFT} className="bg-violet-600 hover:bg-violet-700">
                      Claim NFT <Sparkles className="ml-2 w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              )}

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
                  {nextTier && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress to {nextTier.name}</span>
                        <span className="font-medium flex items-center gap-1">
                          {userData.lockedNCTR.toLocaleString()} / {userData.nextLevelThreshold.toLocaleString()} <NCTRLogo />
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-3" />
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        Lock {nctrNeeded.toLocaleString()} more <NCTRLogo /> to reach {nextTier.name}
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
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card 
                  className="cursor-pointer hover:border-violet-300 transition-colors"
                  onClick={() => navigate('/rewards')}
                >
                  <CardContent className="p-4 text-center">
                    <Gift className="w-8 h-8 mx-auto mb-2 text-violet-600" />
                    <h3 className="font-medium">Browse Rewards</h3>
                    <p className="text-sm text-muted-foreground">Explore marketplace</p>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:border-emerald-300 transition-colors group"
                  onClick={() => window.open('https://thegarden.nctr.live/', '_blank')}
                >
                  <CardContent className="p-4 text-center relative">
                    <ExternalLink className="w-3 h-3 absolute top-2 right-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                    <h3 className="font-medium">Earn NCTR</h3>
                    <p className="text-sm text-muted-foreground">Via The Garden</p>
                  </CardContent>
                </Card>
                {/* HIDDEN FOR REWARDS-FOCUSED PHASE - TODO: Restore when re-enabling brand partnerships */}
                {false && (
                  <>
                    <Card 
                      className="cursor-pointer hover:border-blue-300 transition-colors"
                      onClick={() => navigate('/brands')}
                    >
                      <CardContent className="p-4 text-center">
                        <Store className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <h3 className="font-medium">Crescendo Brands</h3>
                        <p className="text-sm text-muted-foreground">Exclusive rewards</p>
                      </CardContent>
                    </Card>
                    <Card 
                      className="cursor-pointer hover:border-amber-300 transition-colors"
                      onClick={() => navigate('/food-beverage')}
                    >
                      <CardContent className="p-4 text-center">
                        <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                        <h3 className="font-medium">Food & Beverage</h3>
                        <p className="text-sm text-muted-foreground">Local rewards</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

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

                <BuyClaims currentBalance={userData.claimBalance} onPurchaseSuccess={refreshProfile} />
              </div>

              {/* Referral Card */}
              <ReferralCard
                referralCode={referralCode}
                stats={referralStats}
              />

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <div className="flex-1">
                        <p className="font-medium">Account Created</p>
                        <p className="text-sm text-muted-foreground">Welcome to Crescendo!</p>
                      </div>
                    </div>
                    {profile.has_claimed_signup_bonus && (
                      <div className="flex items-center gap-4 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        <Sparkles className="w-5 h-5 text-violet-500" />
                        <div className="flex-1">
                          <p className="font-medium">Signup Bonus Claimed</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            Received 100 <NCTRLogo />
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
      <WelcomeModal isOpen={showWelcomeModal} onClose={handleWelcomeClose} />
      <OnboardingProgress />
    </SidebarProvider>
  );
}
