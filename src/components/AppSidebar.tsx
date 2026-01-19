import { Store, LayoutDashboard, Gift, Trophy, Crown, User, Heart, FileCheck, Receipt, BarChart3, Settings, UtensilsCrossed, Coins, Shield, ShoppingBag, ExternalLink } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminRole } from '@/hooks/useAdminRole';

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
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  onNavigate?: () => void;
}

const mainNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Rewards', url: '/rewards', icon: Gift },
  { title: 'Membership', url: '/membership', icon: Trophy },
  { title: 'Earn NCTR', url: '/earn', icon: Coins },
];

const browseItems = [
  { title: 'Crescendo Brands', url: '/brands', icon: Store },
  { title: 'Food & Beverage', url: '/food-beverage', icon: UtensilsCrossed },
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Browse */}
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
              {/* The Garden - External Link */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => window.open('https://thegarden.nctr.live/', '_blank')}
                  className="cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 group"
                >
                  <ShoppingBag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  {open && (
                    <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      The Garden
                      <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

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
                    {open && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
