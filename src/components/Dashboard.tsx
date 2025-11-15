import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Sparkles, Lock, Gift, Trophy, TrendingUp, ChevronRight, Award, Plus, Calendar, UserPlus, Moon, Sun, Store, Wallet, User, Settings, ChevronDown, LogOut, Coins, CheckCircle2, Zap } from "lucide-react";
import { NCTRLogo } from "./NCTRLogo";
import { CrescendoLogo } from "./CrescendoLogo";
import { ThemeToggle } from "./ThemeToggle";
import { ReferralCard } from "./ReferralCard";
import { useTheme } from "./ThemeProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

interface DashboardProps {
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
  onViewStatusLevels: () => void;
  onViewProfile: () => void;
  onViewBrandPartners: () => void;
  onViewMarketplace?: () => void;
}

export function Dashboard({
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
  onViewStatusLevels,
  onViewProfile,
  onViewBrandPartners,
  onViewMarketplace,
}: DashboardProps) {
  // Mock user data
  const userData = {
    level: 2,
    tier: 'Silver',
    lockedNCTR: 2500,
    nextLevelThreshold: 5000,
    multiplier: '1.25x',
    claimBalance: 3,
    claimsPerYear: 4,
    discount: '10%',
    hasStatusAccessPass: false,
  };

  // Mock referral data
  const referralStats = {
    totalReferrals: 3,
    totalEarned: 1600,
    signupBonus: 100,
    hasClaimedSignupBonus: true,
  };

  const referralCode = 'CRES-A7X9K2';

  const progressToNextLevel = (userData.lockedNCTR / userData.nextLevelThreshold) * 100;

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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Navigation */}
      <nav className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Mobile Layout - Stacked */}
          <div className="flex flex-col gap-4 md:hidden">
            <button
              onClick={onViewMarketplace}
              className="hover:opacity-80 transition-opacity cursor-pointer self-center"
            >
              <CrescendoLogo />
            </button>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={onViewBrandPartners}
                className="gap-2"
                size="sm"
              >
                <Store className="w-4 h-4" />
                Brands
              </Button>
              <Button
                variant="outline"
                onClick={onViewStatusLevels}
                className="gap-2"
                size="sm"
              >
                <Trophy className="w-4 h-4" />
                Status
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
            <button
              onClick={onViewMarketplace}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <CrescendoLogo />
            </button>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={onViewBrandPartners}
                className="gap-2"
              >
                <Store className="w-4 h-4" />
                Brands
              </Button>
              <Button
                variant="outline"
                onClick={onViewStatusLevels}
                className="gap-2"
              >
                <Trophy className="w-4 h-4" />
                Status
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

              {(onAdminRewards || onAdminBrands || onAdminExternalEarn) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <Settings className="w-4 h-4" />
                      Admin
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {onAdminRewards && (
                      <DropdownMenuItem onClick={(e) => {
                        e.preventDefault();
                        onAdminRewards();
                      }}>
                        <Gift className="w-4 h-4 mr-2" />
                        Manage Rewards
                      </DropdownMenuItem>
                    )}
                    {onAdminBrands && (
                      <DropdownMenuItem onClick={(e) => {
                        e.preventDefault();
                        onAdminBrands();
                      }}>
                        <Store className="w-4 h-4 mr-2" />
                        Manage Brands
                      </DropdownMenuItem>
                    )}
                    {onAdminExternalEarn && (
                      <DropdownMenuItem onClick={(e) => {
                        e.preventDefault();
                        onAdminExternalEarn();
                      }}>
                        <Coins className="w-4 h-4 mr-2" />
                        Manage External Earn
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
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
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome back</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Manage your status, claims, and rewards</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <Card className={`border-2 ${currentLevelStyle.border} ${currentLevelStyle.bg} dark:bg-opacity-10`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${currentLevelStyle.gradient} rounded-2xl flex items-center justify-center`}>
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-2xl font-bold">{userData.tier} Status</h3>
                        <Badge variant="secondary">Level {userData.level}</Badge>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {userData.lockedNCTR.toLocaleString()} NCTR Committed
                      </p>
                    </div>
                  </div>
                  <Button onClick={onLevelUp} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
                    <Zap className="w-4 h-4" />
                    Level Up
                  </Button>
                </div>

                {/* Progress to Next Level */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Progress to Gold</span>
                    <span className="font-medium">
                      {userData.lockedNCTR.toLocaleString()} / {userData.nextLevelThreshold.toLocaleString()} NCTR
                    </span>
                  </div>
                  <Progress value={progressToNextLevel} className="h-3" />
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Commit {(userData.nextLevelThreshold - userData.lockedNCTR).toLocaleString()} more NCTR to reach Gold status
                  </p>
                </div>

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

                {/* Status Benefits */}
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
                <Button onClick={onViewRewards} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                  Browse Rewards
                </Button>
              </CardContent>
            </Card>

            {/* Referral Card - Prominent Position */}
            <ReferralCard stats={referralStats} referralCode={referralCode} />

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={onViewStatusLevels} variant="outline" className="w-full justify-start gap-2">
                  <Award className="w-4 h-4" />
                  View All Status Levels
                </Button>

                <Button onClick={onEarnNCTR} variant="outline" className="w-full justify-start gap-2">
                  <Coins className="w-4 h-4" />
                  Earn NCTR
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

                {onViewMarketplace && (
                  <Button onClick={onViewMarketplace} variant="outline" className="w-full justify-start gap-2">
                    <Store className="w-4 h-4" />
                    Marketplace
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
                    <p className="font-medium">Claimed 100 NCTR Signup Bonus</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">2 days ago</p>
                  </div>
                </div>
                <Badge variant="secondary">+100 NCTR</Badge>
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
                <Badge variant="secondary">+500 NCTR</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">Committed 2,500 NCTR to 360LOCK</p>
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
  );
}
