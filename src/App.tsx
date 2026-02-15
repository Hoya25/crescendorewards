import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { UnifiedUserProvider, useUnifiedUser } from "./contexts/UnifiedUserContext";
import { ActivityTrackerProvider } from "./contexts/ActivityTrackerContext";
import { DemoModeProvider } from "./contexts/DemoModeContext";
import { LockDecisionProvider } from "./contexts/LockDecisionContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RouteLoading, PageLoading } from "./components/RouteLoading";
import { DevToolsPanel } from "./components/DevToolsPanel";
import { MobileBottomNav } from "./components/navigation/MobileBottomNav";
import { BetaBanner } from "./components/BetaBanner";
import { DemoModeToggle } from "./components/groundball/DemoModeToggle";
import { UserbackProvider } from "./components/UserbackProvider";
import { useClaimDeliveryNotifications } from "./hooks/useClaimDeliveryNotifications";
import { AppLayout } from "./components/layout/AppLayout";
import { NavigationSafetyNet } from "./components/layout/NavigationSafetyNet";

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
const InviteLandingPage = lazy(() => import('./pages/InviteLandingPage'));
const JoinRedirectPage = lazy(() => import('./pages/JoinRedirectPage'));
const RefCodeRedirectPage = lazy(() => import('./pages/RefCodeRedirectPage'));
const BenefitsPage = lazy(() => import('./components/benefits/BenefitsPage').then(m => ({ default: m.BenefitsPage })));
const GroundballOverviewPage = lazy(() => import('./pages/GroundballOverviewPage'));
const GroundballRewardsPage = lazy(() => import('./pages/GroundballRewardsPage'));
const MyGroundballRewardsPage = lazy(() => import('./pages/MyGroundballRewardsPage'));
const GearVaultPage = lazy(() => import('./pages/GearVaultPage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const SubmitContentPage = lazy(() => import('./pages/SubmitContentPage'));
const MyContentPage = lazy(() => import('./pages/MyContentPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const BountyBoardPage = lazy(() => import('./pages/BountyBoardPage'));
const ContributePage = lazy(() => import('./pages/ContributePage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));

// Admin panel - separate chunk for code splitting
const AdminPanel = lazy(() => import('./components/admin/AdminPanel').then(m => ({ default: m.AdminPanel })));

/**
 * Layout wrapper for authenticated routes with sidebar and header navigation.
 * This ensures all authenticated pages have consistent navigation.
 */
function AuthenticatedLayout() {
  const { profile, refreshUnifiedProfile } = useUnifiedUser();
  const claimBalance = profile?.crescendo_data?.claims_balance || 0;

  return (
    <AppLayout>
      <Suspense fallback={<RouteLoading />}>
        <Outlet context={{ claimBalance, onClaimSuccess: refreshUnifiedProfile }} />
      </Suspense>
    </AppLayout>
  );
}

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

  // NCTR earning detection now handled by AppLayout + LockDecisionContext

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  const handleToggleMode = () => {
    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
  };

  if (loading) {
    return <PageLoading />;
  }

  const claimBalance = profile?.crescendo_data?.claims_balance || 0;

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden">
      {/* Beta Banner - Top of page */}
      <BetaBanner />
      
      {/* Navigation Safety Net - Fallback if nav isn't visible */}
      {isAuthenticated && <NavigationSafetyNet />}
      
      <ErrorBoundary>
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            {/* ========================================= */}
            {/* PUBLIC ROUTES (no sidebar/header needed) */}
            {/* ========================================= */}
            <Route 
              path="/" 
              element={
                isAuthenticated ? (
                  <Navigate to="/bounties" replace />
                ) : (
                  <LandingPage />
                )
              } 
            />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/faq" element={<HelpPage />} />
            <Route path="/claim" element={<ClaimGiftPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            
            {/* Public referral landing pages */}
            <Route path="/join/:slug" element={<InviteLandingPage />} />
            <Route path="/join" element={<InviteLandingPage />} />
            <Route path="/ref/:code" element={<RefCodeRedirectPage />} />

            {/* ========================================= */}
            {/* SEMI-PUBLIC ROUTES (viewable by anyone but with layout) */}
            {/* ========================================= */}
            <Route 
              path="/rewards" 
              element={
                isAuthenticated ? (
                  <AppLayout>
                    <ErrorBoundary>
                      <RewardsPool claimBalance={claimBalance} onClaimSuccess={refreshUnifiedProfile} />
                    </ErrorBoundary>
                  </AppLayout>
                ) : (
                  <ErrorBoundary>
                    <RewardsPool claimBalance={0} onClaimSuccess={() => {}} />
                  </ErrorBoundary>
                )
              } 
            />
            <Route 
              path="/rewards/:id" 
              element={
                isAuthenticated ? (
                  <AppLayout>
                    <RewardDetailPage onClaimSuccess={refreshUnifiedProfile} />
                  </AppLayout>
                ) : (
                  <RewardDetailPage onClaimSuccess={() => {}} />
                )
              } 
            />
            <Route 
              path="/food-beverage" 
              element={
                isAuthenticated ? (
                  <AppLayout>
                    <FoodBeveragePage claimBalance={claimBalance} />
                  </AppLayout>
                ) : (
                  <FoodBeveragePage claimBalance={0} />
                )
              } 
            />
            <Route 
              path="/sponsors" 
              element={
                isAuthenticated ? (
                  <AppLayout><SponsorsPage /></AppLayout>
                ) : (
                  <SponsorsPage />
                )
              } 
            />
            <Route 
              path="/become-sponsor" 
              element={
                isAuthenticated ? (
                  <AppLayout><BecomeASponsorPage /></AppLayout>
                ) : (
                  <BecomeASponsorPage />
                )
              } 
            />
            <Route 
              path="/sponsors/:slug" 
              element={
                isAuthenticated ? (
                  <AppLayout><SponsorProfilePage /></AppLayout>
                ) : (
                  <SponsorProfilePage />
                )
              } 
            />
            
            {/* DISCOVER - community content feed */}
            <Route 
              path="/discover" 
              element={
                isAuthenticated ? (
                  <AppLayout><DiscoverPage /></AppLayout>
                ) : (
                  <DiscoverPage />
                )
              } 
            />

            {/* GROUNDBALL Impact Engine - semi-public */}
            <Route 
              path="/groundball" 
              element={
                isAuthenticated ? (
                  <AppLayout><GroundballOverviewPage /></AppLayout>
                ) : (
                  <GroundballOverviewPage />
                )
              } 
            />
            <Route 
              path="/groundball/rewards" 
              element={
                isAuthenticated ? (
                  <AppLayout><GroundballRewardsPage /></AppLayout>
                ) : (
                  <GroundballRewardsPage />
                )
              } 
            />
            <Route 
              path="/groundball/gear-vault" 
              element={
                isAuthenticated ? (
                  <AppLayout><GearVaultPage /></AppLayout>
                ) : (
                  <GearVaultPage />
                )
              } 
            />

            {/* BOUNTY BOARD - semi-public */}
            <Route 
              path="/bounties" 
              element={
                isAuthenticated ? (
                  <AppLayout><BountyBoardPage /></AppLayout>
                ) : (
                  <BountyBoardPage />
                )
              } 
            />

            {/* REFERRAL LEADERBOARD - semi-public */}
            <Route 
              path="/leaderboard" 
              element={
                isAuthenticated ? (
                  <AppLayout><LeaderboardPage /></AppLayout>
                ) : (
                  <LeaderboardPage />
                )
              } 
            />

            {/* ========================================= */}
            {/* AUTHENTICATED ROUTES (require login + have layout) */}
            {/* ========================================= */}
            <Route 
              path="/groundball/my-rewards"
              element={
                <ProtectedRoute>
                  <AppLayout><MyGroundballRewardsPage /></AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Sponsor Portal Routes */}
            <Route 
              path="/sponsor/dashboard" 
              element={
                <ProtectedRoute>
                  <AppLayout><SponsorDashboard /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/sponsor/profile" 
              element={
                <ProtectedRoute>
                  <AppLayout><SponsorProfileEditor /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/sponsor/rewards/new" 
              element={
                <ProtectedRoute>
                  <AppLayout><SponsorSubmitReward /></AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Main authenticated routes */}
            <Route
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ErrorBoundary>
                      <Dashboard />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/earn" 
              element={
                <ProtectedRoute>
                  <AppLayout><EarnNCTR /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <AppLayout><ProfilePage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/delivery" 
              element={
                <ProtectedRoute>
                  <AppLayout><DeliveryProfilePage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/membership" 
              element={
                <ProtectedRoute>
                  <AppLayout><MembershipLevelPage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/benefits" 
              element={
                <ProtectedRoute>
                  <AppLayout><BenefitsPage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/membership/history" 
              element={
                <ProtectedRoute>
                  <AppLayout><MembershipHistoryPage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/membership/statistics" 
              element={
                <ProtectedRoute>
                  <AppLayout><MembershipStatisticsPage /></AppLayout>
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
                  <AppLayout><SubmitRewardsPage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-submissions" 
              element={
                <ProtectedRoute>
                  <AppLayout><MySubmissionsPage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/purchase-history" 
              element={
                <ProtectedRoute>
                  <AppLayout><PurchaseHistoryPage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/buy-claims" 
              element={
                <ProtectedRoute>
                  <AppLayout><BuyClaimsPage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/gift-claims" 
              element={
                <ProtectedRoute>
                  <AppLayout><GiftClaimsPage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/claims" 
              element={
                <ProtectedRoute>
                  <AppLayout><ClaimsPage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/invite" 
              element={
                <ProtectedRoute>
                  <AppLayout><InvitePage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referrals" 
              element={
                <ProtectedRoute>
                  <AppLayout><ReferralAnalyticsDashboard /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/wishlist" 
              element={
                <ProtectedRoute>
                  <AppLayout><WishlistPage claimBalance={claimBalance} /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/favorites" 
              element={
                <ProtectedRoute>
                  <AppLayout><FavoritesPage claimBalance={claimBalance} /></AppLayout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/submit-content" 
              element={
                <ProtectedRoute>
                  <AppLayout><SubmitContentPage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-content" 
              element={
                <ProtectedRoute>
                  <AppLayout><MyContentPage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <AppLayout><NotificationsPage /></AppLayout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/contribute" 
              element={
                <ProtectedRoute>
                  <AppLayout><ContributePage /></AppLayout>
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

      {/* Lock decision is now handled by LockDecisionContext + AppLayout */}

      {/* Mobile Bottom Navigation - only for authenticated users */}
      {isAuthenticated && <MobileBottomNav />}
      {/* Developer tools panel - only in development */}
      {import.meta.env.DEV && <DevToolsPanel />}
      {/* Demo mode toggle - visible in dev/preview */}
      <DemoModeToggle />
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
              <LockDecisionProvider>
              <ActivityTrackerProvider>
                <DemoModeProvider>
                  <UserbackProvider />
                  <AppRoutes />
                </DemoModeProvider>
              </ActivityTrackerProvider>
              </LockDecisionProvider>
            </UnifiedUserProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
