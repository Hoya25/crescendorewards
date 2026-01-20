import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RouteLoading, PageLoading } from "./components/RouteLoading";
import { FeedbackButton } from "./components/FeedbackButton";

// Eagerly loaded components (critical path)
import { LandingPage } from "./components/LandingPage";
import { AuthModal } from "./components/AuthModal";

// Lazy loaded components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const EarnNCTR = lazy(() => import('./components/EarnNCTR').then(m => ({ default: m.EarnNCTR })));
const RewardsPool = lazy(() => import('./components/RewardsPool').then(m => ({ default: m.RewardsPool })));
const WishlistPage = lazy(() => import('./components/WishlistPage').then(m => ({ default: m.WishlistPage })));
const ProfilePage = lazy(() => import('./components/ProfilePage').then(m => ({ default: m.ProfilePage })));
const MembershipLevelPage = lazy(() => import('./components/MembershipLevelPage').then(m => ({ default: m.MembershipLevelPage })));
const MembershipHistoryPage = lazy(() => import('./components/MembershipHistoryPage').then(m => ({ default: m.MembershipHistoryPage })));
const MembershipStatisticsPage = lazy(() => import('./components/MembershipStatisticsPage').then(m => ({ default: m.MembershipStatisticsPage })));
const ReferralAnalyticsDashboard = lazy(() => import('./components/ReferralAnalyticsDashboard').then(m => ({ default: m.ReferralAnalyticsDashboard })));
const RewardDetailPage = lazy(() => import('./components/RewardDetailPage').then(m => ({ default: m.RewardDetailPage })));
const SubmitRewardsPage = lazy(() => import('./components/SubmitRewardsPage').then(m => ({ default: m.SubmitRewardsPage })));
const MySubmissionsPage = lazy(() => import('./components/MySubmissionsPage').then(m => ({ default: m.MySubmissionsPage })));
const PurchaseHistoryPage = lazy(() => import('./components/PurchaseHistoryPage').then(m => ({ default: m.PurchaseHistoryPage })));
const FoodBeveragePage = lazy(() => import('./components/FoodBeveragePage').then(m => ({ default: m.FoodBeveragePage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin panel - separate chunk for code splitting
const AdminPanel = lazy(() => import('./components/admin/AdminPanel').then(m => ({ default: m.AdminPanel })));

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
    return <PageLoading />;
  }

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden">
      <ErrorBoundary>
        <Suspense fallback={<RouteLoading />}>
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
            <Route 
              path="/rewards" 
              element={
                <ErrorBoundary>
                  <RewardsPool claimBalance={profile?.claim_balance || 0} onClaimSuccess={refreshProfile} />
                </ErrorBoundary>
              } 
            />
            <Route path="/rewards/:id" element={<RewardDetailPage onClaimSuccess={refreshProfile} />} />
            <Route path="/food-beverage" element={<FoodBeveragePage claimBalance={profile?.claim_balance || 0} />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Dashboard />
                  </ErrorBoundary>
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
              element={<Navigate to="/rewards" replace />} 
            />
            <Route 
              path="/brands/:id" 
              element={<Navigate to="/rewards" replace />} 
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

            {/* Admin Routes - Separate code chunk */}
            <Route 
              path="/admin/*" 
              element={
                <AdminRoute>
                  <ErrorBoundary>
                    <Suspense fallback={<RouteLoading message="Loading admin panel..." />}>
                      <AdminPanel />
                    </Suspense>
                  </ErrorBoundary>
                </AdminRoute>
              } 
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>

      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          onToggleMode={handleToggleMode}
        />
      )}

      {/* Global feedback button */}
      <FeedbackButton />
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
