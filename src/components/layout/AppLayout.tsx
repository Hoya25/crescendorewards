import { ReactNode, useState, useEffect } from 'react';
import { Footer } from '@/components/Footer';
import { LockCalloutBanner } from '@/components/navigation/LockCalloutBanner';
import { Outlet, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { CrescendoLogo } from '@/components/CrescendoLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { OnboardingTracker } from '@/components/onboarding/OnboardingTracker';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { useNCTREarningDetection } from '@/hooks/useNCTREarningDetection';
import { useLockDecision } from '@/contexts/LockDecisionContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Crown, ChevronDown } from 'lucide-react';
import { MobileStatusBadge, MobileStatusContent } from '@/components/status/StatusBadgeWidget';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { toast } from 'sonner';

interface AppLayoutProps {
  children?: ReactNode;
}

/**
 * Main application layout with sidebar and header navigation.
 * All authenticated pages should be wrapped with this layout.
 */
export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const { signOut, user } = useAuthContext();
  const { profile, tier, nextTier, progressToNextTier, total360Locked } = useUnifiedUser();
  const { isAdmin } = useAdminRole();
  const { pendingEarning, clearEarning } = useNCTREarningDetection(user?.id);
  const { showLockDecision, isOpen: isLockOpen } = useLockDecision();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if onboarding should be shown (localStorage flag)
  useEffect(() => {
    if (profile && localStorage.getItem('crescendo_onboarded') !== 'true') {
      setShowOnboarding(true);
    }
  }, [profile]);

  // When NCTR earning is detected, show the lock decision modal instead of the old celebration
  useEffect(() => {
    if (pendingEarning && pendingEarning.nctrEarned > 0 && !isLockOpen) {
      const triggerLockDecision = async () => {
        await showLockDecision({
          baseAmount: pendingEarning.nctrEarned,
          sourceType: 'shopping',
          sourceName: pendingEarning.brandName || 'The Garden',
        });
        clearEarning();
      };
      triggerLockDecision();
    }
  }, [pendingEarning, isLockOpen]);

  const userName = profile?.display_name || profile?.email?.split('@')[0] || 'User';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast.success("Signed out successfully");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-neutral-50 dark:bg-neutral-950">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Navigation Header */}
          <nav className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
            <div className="max-w-7xl mx-auto px-3 md:px-4 py-1 md:py-1.5">
              {/* Mobile Layout */}
              <div className="flex items-center justify-between md:hidden">
                <div className="flex items-center gap-3">
                  <SidebarTrigger />
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <CrescendoLogo />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="focus:outline-none">
                        <MobileStatusBadge />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-auto p-0">
                      <MobileStatusContent />
                    </PopoverContent>
                  </Popover>
                  <NotificationsDropdown />
                  <ThemeToggle />
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="hover:opacity-80 transition-opacity cursor-pointer flex items-center"
                  >
                    <CrescendoLogo />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <NotificationsDropdown />
                  <ThemeToggle />
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-xs font-semibold">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="hidden lg:inline max-w-24 truncate">{userName}</span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => navigate('/profile')}>
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/membership')}>
                        <Crown className="w-4 h-4 mr-2" />
                        My Level
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                          <Crown className="w-4 h-4 mr-2 text-amber-600" />
                          Admin Panel
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </nav>

          {/* Onboarding Tracker - tracks page visits for onboarding progress */}
          <OnboardingTracker />

          {/* Lock Callout Banner */}
          <LockCalloutBanner />

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children || <Outlet />}
          </main>

          {/* Footer */}
          <Footer />
        </div>

        {/* First-time Onboarding Flow */}
        {showOnboarding && (
          <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
        )}
      </div>
    </SidebarProvider>
  );
}

export default AppLayout;
