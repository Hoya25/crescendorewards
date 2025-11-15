import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import { Dashboard } from "./components/Dashboard";
import { ThemeProvider } from "./components/ThemeProvider";
import NotFound from "./pages/NotFound";
import { toast } from "sonner";

const queryClient = new QueryClient();

function CrescendoApp() {
  const [currentView, setCurrentView] = useState<"landing" | "dashboard" | "rewards">("landing");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);

  const handleJoin = () => {
    // For now, directly authenticate (we'll add proper auth in next phase)
    setIsAuthenticated(true);
    setCurrentView("dashboard");
    toast.success("Welcome to Crescendo!");
  };

  const handleSignIn = () => {
    // For now, directly authenticate (we'll add proper auth in next phase)
    setIsAuthenticated(true);
    setCurrentView("dashboard");
    toast.success("Welcome back!");
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setWalletConnected(false);
    setCurrentView("landing");
    toast.success("Signed out successfully");
  };

  const handleConnectWallet = () => {
    setWalletConnected(true);
    toast.success("Wallet connected successfully");
  };

  const handleViewRewards = () => {
    toast.info("Rewards Pool coming in Phase 3!");
  };

  const handleEarnNCTR = () => {
    toast.info("Earn NCTR page coming soon!");
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

  return (
    <div>
      {currentView === "landing" && (
        <LandingPage
          onJoin={handleJoin}
          onSignIn={handleSignIn}
          onViewRewards={handleViewRewards}
        />
      )}
      {currentView === "dashboard" && isAuthenticated && (
        <Dashboard
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
