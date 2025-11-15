import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import { ThemeProvider } from "./components/ThemeProvider";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function CrescendoApp() {
  const [currentView, setCurrentView] = useState<"landing" | "dashboard" | "rewards">("landing");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleJoin = () => {
    setShowAuthModal(true);
  };

  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  const handleViewRewards = () => {
    setCurrentView("rewards");
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
      {/* Other views will be added iteratively */}
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
