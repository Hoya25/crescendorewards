import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import { Dashboard } from "./components/Dashboard";
import { EarnNCTR } from "./components/EarnNCTR";
import { RewardsPool } from "./components/RewardsPool";
import { WishlistPage } from "./components/WishlistPage";
import { ProfilePage } from "./components/ProfilePage";
import { AdminPanel } from "./components/admin/AdminPanel";
import { MembershipLevelPage } from "./components/MembershipLevelPage";
import { MembershipHistoryPage } from "./components/MembershipHistoryPage";
import { MembershipStatisticsPage } from "./components/MembershipStatisticsPage";
import { ReferralAnalyticsDashboard } from "./components/ReferralAnalyticsDashboard";
import { RewardDetailPage } from "./components/RewardDetailPage";
import { BrandPartnersPage } from "./components/BrandPartnersPage";
import { BrandDetailPage } from "./components/BrandDetailPage";
import { SubmitRewardsPage } from "./components/SubmitRewardsPage";
import { MySubmissionsPage } from "./components/MySubmissionsPage";
import { PurchaseHistoryPage } from "./components/PurchaseHistoryPage";
import { FoodBeveragePage } from "./components/FoodBeveragePage";
import { AuthModal } from "./components/AuthModal";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { 
    isAuthenticated, 
    profile, 
    loading,
    showAuthModal,
    setShowAuthModal,
    authMode,
    setAuthMode,
    refreshProfile,
  } = useAuthContext();

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  const handleToggleMode = () => {
    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
  };

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
    <div className="w-full max-w-[100vw] overflow-x-hidden">
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LandingPage />
            )
          } 
        />
        <Route path="/rewards" element={<RewardsPool claimBalance={profile?.claim_balance || 0} onClaimSuccess={refreshProfile} />} />
        <Route path="/rewards/:id" element={<RewardDetailPage onClaimSuccess={refreshProfile} />} />
        <Route path="/food-beverage" element={<FoodBeveragePage claimBalance={profile?.claim_balance || 0} />} />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/earn" 
          element={
            <ProtectedRoute>
              <EarnNCTR />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/membership" 
          element={
            <ProtectedRoute>
              <MembershipLevelPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/membership/history" 
          element={
            <ProtectedRoute>
              <MembershipHistoryPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/membership/statistics" 
          element={
            <ProtectedRoute>
              <MembershipStatisticsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/brands" 
          element={
            <ProtectedRoute>
              <BrandPartnersPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/brands/:id" 
          element={
            <ProtectedRoute>
              <BrandDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/submit-reward" 
          element={
            <ProtectedRoute>
              <SubmitRewardsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-submissions" 
          element={
            <ProtectedRoute>
              <MySubmissionsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/purchase-history" 
          element={
            <ProtectedRoute>
              <PurchaseHistoryPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/referrals" 
          element={
            <ProtectedRoute>
              <ReferralAnalyticsDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/wishlist" 
          element={
            <ProtectedRoute>
              <WishlistPage claimBalance={profile?.claim_balance || 0} />
            </ProtectedRoute>
          } 
        />

        {/* Admin Routes */}
        <Route 
          path="/admin/*" 
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          } 
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          onToggleMode={handleToggleMode}
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
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
