import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Sparkles, Lock, Gift, Trophy, TrendingUp, ChevronRight, Award, Plus, Calendar, UserPlus, Moon, Sun, Store, Wallet, User, Settings, ChevronDown, LogOut, Coins, CheckCircle2, Zap, FileCheck, Receipt, Crown, BarChart3, UtensilsCrossed, Heart } from "lucide-react";
import { NCTRLogo } from "./NCTRLogo";
import { CrescendoLogo } from "./CrescendoLogo";
import { ThemeToggle } from "./ThemeToggle";
import { ReferralCard } from "./ReferralCard";
import { BuyClaims } from "./BuyClaims";
import { getMembershipTierByNCTR, getNextMembershipTier, getMembershipProgress, getNCTRNeededForNextLevel } from '@/utils/membershipLevels';
import { useTheme } from "./ThemeProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import type { Profile } from '@/types';

interface DashboardProps {
  profile: Profile;
  walletConnected: boolean;
  onConnectWallet: () => void;
  onLockTokens: () => void;
  onClaimNFT: () => void;
  onViewRewards: () => void;
  onEarnNCTR: () => void;
  onSignOut: () => void;
  onLevelUp: () => void;
  onAdminRewards?: () => void;
  onAdminBrands?: () => void;
  onAdminExternalEarn?: () => void;
  onViewMembershipLevels: () => void;
  onViewProfile: () => void;
  onViewBrandPartners: () => void;
  onViewMarketplace?: () => void;
  onMySubmissions?: () => void;
  onPurchaseHistory?: () => void;
  onReferralAnalytics?: () => void;
  onFoodBeverage?: () => void;
  onViewWishlist?: () => void;
  isAdmin?: boolean;
  onAdminPanel?: () => void;
  onClaimSuccess?: () => void;
}

export function Dashboard({
  profile,
  walletConnected,
  onConnectWallet,
  onLockTokens,
  onClaimNFT,
  onViewRewards,
  onEarnNCTR,
  onSignOut,
  onLevelUp,
  onAdminRewards,
  onAdminBrands,
  onAdminExternalEarn,
  onViewMembershipLevels,
  onViewProfile,
  onViewBrandPartners,
  onViewMarketplace,
  onMySubmissions,
  onPurchaseHistory,
  onReferralAnalytics,
  onFoodBeverage,
  onViewWishlist,
  isAdmin,
  onAdminPanel,
  onClaimSuccess,
}: DashboardProps) {
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

  const { theme } = useTheme();

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-neutral-50 dark:bg-neutral-950">
        <AppSidebar onNavigate={onViewBrandPartners} />
        
        <div className="flex-1 flex flex-col">
          {/* Navigation */}
          <nav className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
            <div className="max-w-7xl mx-auto px-6 py-4">
              {/* Mobile Layout - Stacked */}
              <div className="flex flex-col gap-4 md:hidden">
                <div className="flex items-center justify-center gap-4">
                  <SidebarTrigger />
                  <button
                    onClick={onViewMarketplace}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <CrescendoLogo />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={onViewMembershipLevels}
                    className="gap-2"
                    size="sm"
                  >
                    <Trophy className="w-4 h-4" />
                    Membership
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onViewRewards}
                    className="gap-2"
                    size="sm"
                  >
                    <Gift className="w-4 h-4" />
                    Rewards
                  </Button>
                  <ThemeToggle />
                </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {!walletConnected ? (
                <Button onClick={onConnectWallet} variant="outline" className="gap-2 flex-1" size="sm">
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </Button>
              ) : (
                <Badge className="gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Wallet Connected
                </Badge>
              )}
              <Button variant="ghost" onClick={onSignOut} size="sm">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

              {/* Desktop Layout - Single Row */}
              <div className="hidden md:flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <button
                    onClick={onViewMarketplace}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <CrescendoLogo />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={onViewMembershipLevels}
                    className="gap-2"
                  >
                    <Trophy className="w-4 h-4" />
                    Membership
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onViewRewards}
                    className="gap-2"
                  >
                    <Gift className="w-4 h-4" />
                    Rewards
                  </Button>
                </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />

              <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700" />

              {!walletConnected ? (
                <Button onClick={onConnectWallet} variant="outline" className="gap-2">
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </Button>
              ) : (
                <Badge className="gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Base Wallet Connected
                </Badge>
              )}

              <Button variant="ghost" onClick={onViewProfile} className="gap-2">
                <User className="w-4 h-4" />
                Profile
              </Button>

              {isAdmin && onAdminPanel && (
                <Button variant="ghost" onClick={onAdminPanel} className="gap-2">
                  <Settings className="w-4 h-4" />
                  Admin Panel
                </Button>
              )}

              <Button variant="ghost" onClick={onSignOut} className="gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-6 py-10 flex-1">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome back</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Manage your status, claims, and rewards</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Membership Progress Card */}
            <Card className={`border-2 ${currentLevelStyle.border} ${currentLevelStyle.bg} dark:bg-opacity-10`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${currentLevelStyle.gradient} rounded-2xl flex items-center justify-center`}>
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-2xl font-bold">{userData.tier} Member</h3>
                        <Badge variant="secondary" className="text-sm px-3">
                          {userData.multiplier} Earnings
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                        {userData.lockedNCTR.toLocaleString()} <NCTRLogo size="xs" /> in 360LOCK
                      </p>
                    </div>
                  </div>
                  <Button onClick={onViewMembershipLevels} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
                    <Crown className="w-4 h-4" />
                    Upgrade
                  </Button>
                </div>

                {/* Progress to Next Level */}
                {nextTier ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                        Progress to {nextTier.name}
                      </span>
                      <span className="font-semibold">
                        {progressPercent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={progressPercent} className="h-4" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-white drop-shadow-md flex items-center gap-1">
                          {userData.lockedNCTR.toLocaleString()} / {userData.nextLevelThreshold.toLocaleString()} <NCTRLogo size="xs" />
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                        <Lock className="w-3 h-3" />
                        <span className="flex items-center gap-1">Lock {nctrNeeded.toLocaleString()} more <NCTRLogo size="xs" /></span>
                      </div>
                      <div className="text-xs font-medium text-primary">
                        Next: {nextTier.multiplier}x earnings
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Badge variant="secondary" className="text-lg px-6 py-2">
                      <Trophy className="w-4 h-4 mr-2" />
                      Max Level Achieved!
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      You've unlocked all membership benefits
                    </p>
                  </div>
                )}

                {/* Status Access Pass Banner */}
                {!userData.hasStatusAccessPass && walletConnected && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 rounded-xl border-2 border-violet-200 dark:border-violet-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                        <div>
                          <p className="font-semibold text-violet-900 dark:text-violet-100">Claim Your Status Access Pass</p>
                          <p className="text-sm text-violet-700 dark:text-violet-300">Unlock token-gated rewards on Base</p>
                        </div>
                      </div>
                      <Button onClick={onClaimNFT} className="bg-violet-600 hover:bg-violet-700 text-white">
                        Claim Now
                      </Button>
                    </div>
                  </div>
                )}

                {/* Membership Benefits */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Multiplier</span>
                    </div>
                    <p className="text-2xl font-bold">{userData.multiplier}</p>
                  </div>

                  <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Claims</span>
                    </div>
                    <p className="text-2xl font-bold">{userData.claimsPerYear}/yr</p>
                  </div>

                  <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Discount</span>
                    </div>
                    <p className="text-2xl font-bold">{userData.discount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Claims Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="text-5xl font-bold mb-2">{userData.claimBalance}</div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Available claims</p>
                </div>
                <div className="space-y-2">
                  <Button onClick={onViewRewards} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                    Browse Rewards
                  </Button>
                  <BuyClaims 
                    currentBalance={userData.claimBalance} 
                    onPurchaseSuccess={onClaimSuccess || (() => {})}
                    trigger={
                      <Button variant="outline" className="w-full gap-2">
                        <Plus className="w-4 h-4" />
                        Buy More Claims
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Referral Card - Prominent Position */}
            <ReferralCard stats={referralStats} referralCode={referralCode} />

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={onViewMembershipLevels} variant="outline" className="w-full justify-start gap-2">
                  <Award className="w-4 h-4" />
                  View Membership Levels
                </Button>

                <Button onClick={onEarnNCTR} variant="outline" className="w-full justify-start gap-2">
                  <Coins className="w-4 h-4" />
                  Earn <NCTRLogo size="sm" />
                </Button>

                <Button onClick={onLockTokens} variant="outline" className="w-full justify-start gap-2">
                  <Lock className="w-4 h-4" />
                  Commit to 360LOCK
                </Button>

                {!userData.hasStatusAccessPass && walletConnected && (
                  <Button onClick={onClaimNFT} variant="outline" className="w-full justify-start gap-2">
                    <Trophy className="w-4 h-4" />
                    Claim Status Access Pass
                  </Button>
                )}

                <Button onClick={onViewRewards} variant="outline" className="w-full justify-start gap-2">
                  <Gift className="w-4 h-4" />
                  View Rewards
                </Button>

                <Button onClick={onViewBrandPartners} variant="outline" className="w-full justify-start gap-2">
                  <Store className="w-4 h-4" />
                  Brand Partners
                </Button>

                {onFoodBeverage && (
                  <Button onClick={onFoodBeverage} variant="outline" className="w-full justify-start gap-2">
                    <UtensilsCrossed className="w-4 h-4" />
                    Food & Beverage
                  </Button>
                )}

                {onViewWishlist && (
                  <Button onClick={onViewWishlist} variant="outline" className="w-full justify-start gap-2">
                    <Heart className="w-4 h-4" />
                    My Wishlist
                  </Button>
                )}

                {onViewMarketplace && (
                  <Button onClick={onViewMarketplace} variant="outline" className="w-full justify-start gap-2">
                    <Store className="w-4 h-4" />
                    Marketplace
                  </Button>
                )}

                {onMySubmissions && (
                  <Button onClick={onMySubmissions} variant="outline" className="w-full justify-start gap-2">
                    <FileCheck className="w-4 h-4" />
                    My Submissions
                  </Button>
                )}

                {onPurchaseHistory && (
                  <Button onClick={onPurchaseHistory} variant="outline" className="w-full justify-start gap-2">
                    <Receipt className="w-4 h-4" />
                    Purchase History
                  </Button>
                )}

                {onReferralAnalytics && (
                  <Button onClick={onReferralAnalytics} variant="outline" className="w-full justify-start gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Referral Analytics
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-1">
                      Claimed 100 <NCTRLogo size="xs" /> Signup Bonus
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">2 days ago</p>
                  </div>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  +100 <NCTRLogo size="xs" />
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="font-medium">Referral Bonus Earned</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">3 days ago</p>
                  </div>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  +500 <NCTRLogo size="xs" />
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-1">
                      Committed 2,500 <NCTRLogo size="xs" /> to 360LOCK
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">1 week ago</p>
                  </div>
                </div>
                <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Silver Status</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
