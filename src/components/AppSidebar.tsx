import { Store, LayoutDashboard, Gift, Trophy, Crown, User, Heart, FileCheck, Receipt, BarChart3, Settings, UtensilsCrossed, Coins, Shield, ShoppingBag, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuthContext } from '@/contexts/AuthContext';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  onNavigate?: () => void;
}

const mainNavItems = [
  { title: 'Rewards', url: '/rewards', icon: Gift },
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Membership', url: '/membership', icon: Trophy },
  // Earn now links to The Garden - handled separately
];

// HIDDEN FOR REWARDS-FOCUSED PHASE - TODO: Restore when re-enabling brand partnerships
const browseItems = [
  // { title: 'Crescendo Brands', url: '/brands', icon: Store },
  // { title: 'Food & Beverage', url: '/food-beverage', icon: UtensilsCrossed },
];

const accountItems = [
  { title: 'Profile', url: '/profile', icon: User },
  { title: 'Wishlist', url: '/wishlist', icon: Heart },
  { title: 'My Submissions', url: '/my-submissions', icon: FileCheck },
  { title: 'Purchase History', url: '/purchase-history', icon: Receipt },
  { title: 'Referral Analytics', url: '/referrals', icon: BarChart3 },
];

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const { open } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const { profile } = useAuthContext();
  const { percentage, isComplete, loading: completionLoading } = useProfileCompletion(profile);

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (url: string) => {
    navigate(url);
    onNavigate?.();
  };

  return (
    <Sidebar className={open ? 'w-60' : 'w-14'} collapsible="icon">
      <SidebarContent>
        {/* Admin Section - Prominent at top */}
        {isAdmin && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="text-amber-600 dark:text-amber-400">
                <Crown className="w-3 h-3 mr-1" />
                {open && 'Admin'}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNavigation('/admin')}
                      className={cn(
                        "cursor-pointer",
                        isActive('/admin') 
                          ? "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-400" 
                          : "hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      )}
                    >
                      <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      {open && (
                        <span className="flex items-center gap-2">
                          Admin Panel
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 text-xs px-1.5">
                            Admin
                          </Badge>
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
          </>
        )}

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.url)}
                    className={cn(
                      "cursor-pointer",
                      isActive(item.url) 
                        ? "bg-accent text-accent-foreground" 
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {open && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* The Garden - Primary Earn Method */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => window.open('https://thegarden.nctr.live/', '_blank')}
                  className="cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 group"
                >
                  <ShoppingBag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  {open && (
                    <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      Earn NCTR
                      <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Browse - HIDDEN FOR REWARDS-FOCUSED PHASE */}
        {/* TODO: Restore when re-enabling brand partnerships */}
        {browseItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Browse</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {browseItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.url)}
                      className={cn(
                        "cursor-pointer",
                        isActive(item.url) 
                          ? "bg-accent text-accent-foreground" 
                          : "hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Account */}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.url)}
                    className={cn(
                      "cursor-pointer",
                      isActive(item.url) 
                        ? "bg-accent text-accent-foreground" 
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {open && (
                      <span className="flex items-center gap-2">
                        {item.title}
                        {/* Show completion indicator on Profile link */}
                        {item.url === '/profile' && !completionLoading && !isComplete && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs px-1.5 py-0 h-5 bg-primary/10 text-primary"
                          >
                            {percentage}%
                          </Badge>
                        )}
                        {item.url === '/profile' && isComplete && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Profile Completion Progress - Only show if not complete */}
        {profile && !isComplete && !completionLoading && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div 
                onClick={() => handleNavigation('/profile')}
                className={cn(
                  "cursor-pointer rounded-lg p-3 mx-2 transition-colors",
                  "bg-primary/5 hover:bg-primary/10 border border-primary/10"
                )}
              >
                {open ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Complete Profile</span>
                      <span className="text-primary font-semibold">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">
                      Finish setting up your profile
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <div className="relative w-8 h-8">
                      <svg className="w-8 h-8 transform -rotate-90">
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-muted/30"
                        />
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={2 * Math.PI * 14}
                          strokeDashoffset={2 * Math.PI * 14 * (1 - percentage / 100)}
                          className="text-primary transition-all duration-300"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold">
                        {percentage}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
