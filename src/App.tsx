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
import { AdminPanel } from "./components/admin/AdminPanel";
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
  const [currentView, setCurrentView] = useState<"landing" | "dashboard" | "earn" | "rewards" | "admin">("landing");
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

  const handleViewStatusLevels = () => {
    toast.info("Status levels page coming soon!");
  };

  const handleViewProfile = () => {
    toast.info("Profile page coming soon!");
  };

  const handleViewBrandPartners = () => {
    toast.info("Brand partners page coming soon!");
  };

  const handleViewMarketplace = () => {
    toast.info("Marketplace coming soon!");
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
          onViewStatusLevels={handleViewStatusLevels}
          onViewProfile={handleViewProfile}
          onViewBrandPartners={handleViewBrandPartners}
          onViewMarketplace={handleViewMarketplace}
          isAdmin={isAdmin}
          onAdminPanel={() => setCurrentView("admin")}
        />
      )}

      {currentView === "earn" && isAuthenticated && (
        <EarnNCTR
          onBack={() => setCurrentView("dashboard")}
          onNavigateToRewards={handleViewRewards}
          onNavigateToStatus={handleViewStatusLevels}
          onNavigateToBrands={handleViewBrandPartners}
          onRefreshProfile={refreshProfile}
        />
      )}

      {currentView === "rewards" && isAuthenticated && profile && (
        <div className="relative">
          <button
            onClick={() => setCurrentView("dashboard")}
            className="fixed top-4 left-4 z-50 px-4 py-2 bg-background/80 backdrop-blur-sm border rounded-lg hover:bg-accent transition-colors"
          >
            ← Back to Dashboard
          </button>
          <RewardsPool 
            claimBalance={profile.claim_balance}
            onClaimSuccess={refreshProfile}
          />
        </div>
      )}

      {currentView === "admin" && isAuthenticated && isAdmin && (
        <AdminPanel onClose={() => setCurrentView("dashboard")} />
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
