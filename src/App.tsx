import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import { Dashboard } from "./components/Dashboard";
import { EarnNCTR } from "./components/EarnNCTR";
import { RewardsPool } from "./components/RewardsPool";
import { ProfilePage } from "./components/ProfilePage";
import { AdminPanel } from "./components/admin/AdminPanel";
import { MembershipLevelPage } from "./components/MembershipLevelPage";
import { MembershipHistoryPage } from "./components/MembershipHistoryPage";
import { MembershipStatisticsPage } from "./components/MembershipStatisticsPage";
import { RewardDetailPage } from "./components/RewardDetailPage";
import { BrandPartnersPage } from "./components/BrandPartnersPage";
import { BrandDetailPage } from "./components/BrandDetailPage";
import { SubmitRewardsPage } from "./components/SubmitRewardsPage";
import { MySubmissionsPage } from "./components/MySubmissionsPage";
import { PurchaseHistoryPage } from "./components/PurchaseHistoryPage";
import { AuthModal } from "./components/AuthModal";
import { ThemeProvider } from "./components/ThemeProvider";
import { useAuth } from "./hooks/useAuth";
import { useAdminRole } from "./hooks/useAdminRole";
import NotFound from "./pages/NotFound";
import { toast } from "sonner";

const queryClient = new QueryClient();

function CrescendoApp() {
  const { user, profile, loading, isAuthenticated, signOut, refreshProfile } = useAuth();
  const { isAdmin } = useAdminRole();
  const [currentView, setCurrentView] = useState<"landing" | "dashboard" | "earn" | "rewards" | "reward-detail" | "profile" | "admin" | "membership" | "membership-history" | "membership-statistics" | "brands" | "brand-detail" | "submit-rewards" | "my-submissions" | "purchase-history">("landing");
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [walletConnected, setWalletConnected] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && profile) {
      setCurrentView("dashboard");
    } else if (!isAuthenticated) {
      setCurrentView("landing");
    }
  }, [isAuthenticated, profile]);

  const handleJoin = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleSignIn = () => {
    setAuthMode('signin');
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setCurrentView("dashboard");
  };

  const handleSignOut = async () => {
    await signOut();
    setWalletConnected(false);
    setCurrentView("landing");
    toast.success("Signed out successfully");
  };

  const handleConnectWallet = () => {
    setWalletConnected(true);
    toast.success("Wallet connected successfully");
  };

  const handleViewRewards = () => {
    setCurrentView("rewards");
  };

  const handleEarnNCTR = () => {
    setCurrentView("earn");
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

  const handleViewMembershipLevels = () => {
    setCurrentView("membership");
  };

  const handleViewProfile = () => {
    setCurrentView("profile");
  };

  const handleViewBrandPartners = () => {
    setCurrentView("brands");
  };

  const handleViewBrandDetail = (brandId: string) => {
    setSelectedBrandId(brandId);
    setCurrentView("brand-detail");
  };

  const handleViewMarketplace = () => {
    setCurrentView("rewards");
  };

  const handleViewRewardDetail = (rewardId: string) => {
    setSelectedRewardId(rewardId);
    setCurrentView("reward-detail");
  };

  const handleSubmitRewards = () => {
    setCurrentView("submit-rewards");
  };

  const handleMySubmissions = () => {
    setCurrentView("my-submissions");
  };

  const handlePurchaseHistory = () => {
    setCurrentView("purchase-history");
  };

  const handleToggleAuthMode = () => {
    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {currentView === "landing" && !isAuthenticated && (
        <LandingPage
          onJoin={handleJoin}
          onSignIn={handleSignIn}
          onViewRewards={handleViewRewards}
        />
      )}
      
      {currentView === "dashboard" && isAuthenticated && profile && (
        <Dashboard
          profile={profile}
          walletConnected={walletConnected}
          onConnectWallet={handleConnectWallet}
          onLockTokens={handleLockTokens}
          onClaimNFT={handleClaimNFT}
          onViewRewards={handleViewRewards}
          onEarnNCTR={handleEarnNCTR}
          onSignOut={handleSignOut}
          onLevelUp={handleLevelUp}
          onViewMembershipLevels={handleViewMembershipLevels}
          onViewProfile={handleViewProfile}
          onViewBrandPartners={handleViewBrandPartners}
          onViewMarketplace={handleViewMarketplace}
          onMySubmissions={handleMySubmissions}
          onPurchaseHistory={handlePurchaseHistory}
          isAdmin={isAdmin}
          onAdminPanel={() => setCurrentView("admin")}
        />
      )}

      {currentView === "earn" && isAuthenticated && (
        <EarnNCTR
          onBack={() => setCurrentView("dashboard")}
          onNavigateToRewards={handleViewRewards}
          onNavigateToStatus={handleViewMembershipLevels}
          onNavigateToBrands={handleViewBrandPartners}
          onRefreshProfile={refreshProfile}
        />
      )}

      {currentView === "rewards" && (
        <RewardsPool 
          claimBalance={profile?.claim_balance || 0}
          onClaimSuccess={refreshProfile}
          onSubmitReward={handleSubmitRewards}
          onBack={() => setCurrentView(isAuthenticated ? "dashboard" : "landing")}
          onNavigateToBrands={handleViewBrandPartners}
          onViewRewardDetail={handleViewRewardDetail}
        />
      )}

      {currentView === "reward-detail" && selectedRewardId && (
        <RewardDetailPage
          rewardId={selectedRewardId}
          onBack={() => setCurrentView("rewards")}
          onClaimSuccess={refreshProfile}
        />
      )}

      {currentView === "profile" && isAuthenticated && profile && (
        <ProfilePage
          profile={profile}
          onBack={() => setCurrentView("dashboard")}
          onSignOut={handleSignOut}
          onRefresh={refreshProfile}
        />
      )}

      {currentView === "admin" && isAuthenticated && isAdmin && (
        <AdminPanel onClose={() => setCurrentView("dashboard")} />
      )}

      {currentView === "membership" && isAuthenticated && (
        <MembershipLevelPage 
          onBack={() => setCurrentView("dashboard")}
          onViewHistory={() => setCurrentView("membership-history")}
          onViewStatistics={() => setCurrentView("membership-statistics")}
        />
      )}

      {currentView === "membership-history" && isAuthenticated && (
        <MembershipHistoryPage onBack={() => setCurrentView("membership")} />
      )}

      {currentView === "membership-statistics" && isAuthenticated && (
        <MembershipStatisticsPage onBack={() => setCurrentView("membership")} />
      )}

      {currentView === "brands" && isAuthenticated && (
        <BrandPartnersPage 
          onBack={() => setCurrentView("dashboard")}
          onNavigateToStatus={() => setCurrentView("membership")}
          onNavigateToRewards={() => setCurrentView("rewards")}
          onNavigateToBrandDetail={handleViewBrandDetail}
        />
      )}

      {currentView === "brand-detail" && isAuthenticated && selectedBrandId && (
        <BrandDetailPage 
          brandId={selectedBrandId}
          onBack={() => setCurrentView("brands")}
        />
      )}

      {currentView === "submit-rewards" && isAuthenticated && (
        <SubmitRewardsPage
          onBack={() => setCurrentView("rewards")}
        />
      )}

      {currentView === "my-submissions" && isAuthenticated && (
        <MySubmissionsPage
          onBack={() => setCurrentView("dashboard")}
        />
      )}

      {currentView === "purchase-history" && isAuthenticated && (
        <PurchaseHistoryPage
          onBack={() => setCurrentView("dashboard")}
        />
      )}

      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          onToggleMode={handleToggleAuthMode}
        />
      )}
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CrescendoApp />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
