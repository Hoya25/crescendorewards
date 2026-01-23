import { Suspense, lazy, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { UnifiedUserProvider, useUnifiedUser } from "./contexts/UnifiedUserContext";
import { ActivityTrackerProvider } from "./contexts/ActivityTrackerContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RouteLoading, PageLoading } from "./components/RouteLoading";
import { DevToolsPanel } from "./components/DevToolsPanel";
import { MobileBottomNav } from "./components/navigation/MobileBottomNav";
import { BetaBanner } from "./components/BetaBanner";
import { useClaimDeliveryNotifications } from "./hooks/useClaimDeliveryNotifications";

// Eagerly loaded components (critical path)
import { LandingPage } from "./components/LandingPage";
import { AuthModal } from "./components/AuthModal";
import { WalletProfileCompletionModal } from "./components/WalletProfileCompletionModal";

// Lazy loaded components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const EarnNCTR = lazy(() => import('./components/EarnNCTR').then(m => ({ default: m.EarnNCTR })));
const RewardsPool = lazy(() => import('./components/RewardsPool').then(m => ({ default: m.RewardsPool })));
const SponsorsPage = lazy(() => import('./components/SponsorsPage').then(m => ({ default: m.SponsorsPage })));
const BecomeASponsorPage = lazy(() => import('./components/BecomeASponsorPage').then(m => ({ default: m.BecomeASponsorPage })));
const SponsorProfilePage = lazy(() => import('./components/SponsorProfilePage').then(m => ({ default: m.SponsorProfilePage })));
const SponsorDashboard = lazy(() => import('./components/sponsor/SponsorDashboard').then(m => ({ default: m.SponsorDashboard })));
const SponsorProfileEditor = lazy(() => import('./components/sponsor/SponsorProfileEditor'));
const SponsorSubmitReward = lazy(() => import('./components/sponsor/SponsorSubmitReward'));
const WishlistPage = lazy(() => import('./components/WishlistPage').then(m => ({ default: m.WishlistPage })));
const FavoritesPage = lazy(() => import('./components/FavoritesPage').then(m => ({ default: m.FavoritesPage })));
const ProfilePage = lazy(() => import('./components/ProfilePage').then(m => ({ default: m.ProfilePage })));
const DeliveryProfilePage = lazy(() => import('./pages/DeliveryProfilePage'));
const MembershipLevelPage = lazy(() => import('./components/MembershipLevelPage').then(m => ({ default: m.MembershipLevelPage })));
const MembershipHistoryPage = lazy(() => import('./components/MembershipHistoryPage').then(m => ({ default: m.MembershipHistoryPage })));
const MembershipStatisticsPage = lazy(() => import('./components/MembershipStatisticsPage').then(m => ({ default: m.MembershipStatisticsPage })));
const ReferralAnalyticsDashboard = lazy(() => import('./components/ReferralAnalyticsDashboard').then(m => ({ default: m.ReferralAnalyticsDashboard })));
const InvitePage = lazy(() => import('./pages/InvitePage'));
const RewardDetailPage = lazy(() => import('./components/RewardDetailPage').then(m => ({ default: m.RewardDetailPage })));
const SubmitRewardsPage = lazy(() => import('./components/SubmitRewardsPage').then(m => ({ default: m.SubmitRewardsPage })));
const MySubmissionsPage = lazy(() => import('./components/MySubmissionsPage').then(m => ({ default: m.MySubmissionsPage })));
const PurchaseHistoryPage = lazy(() => import('./components/PurchaseHistoryPage').then(m => ({ default: m.PurchaseHistoryPage })));
const FoodBeveragePage = lazy(() => import('./components/FoodBeveragePage').then(m => ({ default: m.FoodBeveragePage })));
const BuyClaimsPage = lazy(() => import('./pages/BuyClaimsPage').then(m => ({ default: m.BuyClaimsPage })));
const GiftClaimsPage = lazy(() => import('./components/GiftClaimsPage'));
const ClaimGiftPage = lazy(() => import('./components/ClaimGiftPage'));
const ClaimsPage = lazy(() => import('./components/ClaimsPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const NotFound = lazy(() => import('./pages/NotFound'));
const JoinRedirectPage = lazy(() => import('./pages/JoinRedirectPage'));

// Admin panel - separate chunk for code splitting
const AdminPanel = lazy(() => import('./components/admin/AdminPanel').then(m => ({ default: m.AdminPanel })));

function AppRoutes() {
  const { 
    isAuthenticated, 
    loading,
    showAuthModal,
    setShowAuthModal,
    authMode,
    setAuthMode,
    showProfileCompletion,
    setShowProfileCompletion,
    walletAddress,
    user,
  } = useAuthContext();
  const { profile, refreshUnifiedProfile } = useUnifiedUser();

  // Enable real-time toast notifications for claim delivery status updates
  useClaimDeliveryNotifications();

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
      {/* Beta Banner - Top of page */}
      <BetaBanner />
      
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
                  <RewardsPool claimBalance={profile?.crescendo_data?.claims_balance || 0} onClaimSuccess={refreshUnifiedProfile} />
                </ErrorBoundary>
              } 
            />
            <Route path="/rewards/:id" element={<RewardDetailPage onClaimSuccess={refreshUnifiedProfile} />} />
            <Route path="/food-beverage" element={<FoodBeveragePage claimBalance={profile?.crescendo_data?.claims_balance || 0} />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/faq" element={<HelpPage />} />
            <Route path="/claim" element={<ClaimGiftPage />} />
            <Route path="/sponsors" element={<SponsorsPage />} />
            <Route path="/become-sponsor" element={<BecomeASponsorPage />} />
            <Route path="/sponsors/:slug" element={<SponsorProfilePage />} />
            
            {/* Personalized referral link redirect */}
            <Route path="/join/:slug" element={<JoinRedirectPage />} />

            {/* Sponsor Portal Routes */}
            <Route 
              path="/sponsor/dashboard" 
              element={
                <ProtectedRoute>
                  <SponsorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/sponsor/profile" 
              element={
                <ProtectedRoute>
                  <SponsorProfileEditor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/sponsor/rewards/new" 
              element={
                <ProtectedRoute>
                  <SponsorSubmitReward />
                </ProtectedRoute>
              } 
            />
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
              path="/profile/delivery" 
              element={
                <ProtectedRoute>
                  <DeliveryProfilePage />
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
              path="/status" 
              element={<Navigate to="/membership" replace />} 
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
              path="/buy-claims" 
              element={
                <ProtectedRoute>
                  <BuyClaimsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/gift-claims" 
              element={
                <ProtectedRoute>
                  <GiftClaimsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/claims" 
              element={
                <ProtectedRoute>
                  <ClaimsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/invite" 
              element={
                <ProtectedRoute>
                  <InvitePage />
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
                  <WishlistPage claimBalance={profile?.crescendo_data?.claims_balance || 0} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/favorites" 
              element={
                <ProtectedRoute>
                  <FavoritesPage claimBalance={profile?.crescendo_data?.claims_balance || 0} />
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

      {/* Wallet Profile Completion Modal - for wallet users missing name/email */}
      {showProfileCompletion && user && walletAddress && (
        <WalletProfileCompletionModal
          open={showProfileCompletion}
          onClose={() => setShowProfileCompletion(false)}
          onComplete={() => {
            setShowProfileCompletion(false);
            refreshUnifiedProfile();
          }}
          userId={user.id}
          walletAddress={walletAddress}
        />
      )}

      {/* Mobile Bottom Navigation - only for authenticated users */}
      {isAuthenticated && <MobileBottomNav />}
      {/* Developer tools panel - only in development */}
      {import.meta.env.DEV && <DevToolsPanel />}
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
            <UnifiedUserProvider>
              <ActivityTrackerProvider>
                <AppRoutes />
              </ActivityTrackerProvider>
            </UnifiedUserProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
