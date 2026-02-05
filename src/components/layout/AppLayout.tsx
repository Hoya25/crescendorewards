import { ReactNode } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { CrescendoLogo } from '@/components/CrescendoLogo';
import { BetaBadge } from '@/components/BetaBadge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { ClaimsBalanceIndicator } from '@/components/claims/ClaimsBalanceIndicator';
import { FavoritesIndicator } from '@/components/FavoritesIndicator';
import { PortfolioIndicator } from '@/components/PortfolioIndicator';
import { InviteHeaderCTA } from '@/components/navigation/InviteHeaderCTA';
import { OnboardingTracker } from '@/components/onboarding/OnboardingTracker';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Crown, Gift, ChevronDown } from 'lucide-react';
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
  const { signOut } = useAuthContext();
  const { profile } = useUnifiedUser();
  const { isAdmin } = useAdminRole();

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
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
              {/* Mobile Layout */}
              <div className="flex flex-col gap-3 md:hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <button 
                      onClick={() => navigate('/dashboard')}
                      className="hover:opacity-80 transition-opacity"
                    >
                      <CrescendoLogo />
                    </button>
                    <BetaBadge />
                  </div>
                  <div className="flex items-center gap-2">
                    <NotificationsDropdown />
                    <ThemeToggle />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClaimsBalanceIndicator compact />
                    <FavoritesIndicator />
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" />
                  </Button>
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
                    <BetaBadge />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <Button
                      onClick={() => navigate('/admin')}
                      className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md"
                    >
                      <Crown className="w-4 h-4" />
                      Admin Panel
                    </Button>
                  )}
                  <InviteHeaderCTA />
                  <Button variant="outline" onClick={() => navigate('/rewards')} className="gap-2">
                    <Gift className="w-4 h-4" />
                    Rewards
                  </Button>
                  <PortfolioIndicator />
                  <ClaimsBalanceIndicator />
                  <FavoritesIndicator />
                  <NotificationsDropdown />
                  <ThemeToggle />
                </div>

                <div className="flex items-center gap-3">
                  <Badge className="gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Connected
                  </Badge>
                  
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

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default AppLayout;
