import { LayoutDashboard, Gift, ShoppingBag, Users, Settings, Store, FileCheck, Receipt, Heart, TrendingUp, Building2, RefreshCw, Sparkles, Megaphone, Shield, Activity, Package, MessageSquare } from 'lucide-react';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { useAdminRole } from '@/hooks/useAdminRole';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { AdminPermission } from '@/types/admin';

interface AdminSidebarProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

interface BadgeProps {
  count: number;
  pulse?: boolean;
}

function NotificationBadge({ count, pulse = false }: BadgeProps) {
  if (count === 0) return null;
  
  const displayCount = count > 9 ? '9+' : count.toString();
  const shouldPulse = pulse || count > 5;
  
  return (
    <span
      className={cn(
        "flex items-center justify-center h-5 min-w-5 px-1 text-xs font-medium text-white bg-destructive rounded-full",
        shouldPulse && "animate-pulse"
      )}
    >
      {displayCount}
    </span>
  );
}

interface MenuItem {
  title: string;
  view: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey: 'total' | 'claims' | 'submissions' | null;
  permission?: AdminPermission;
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard', view: 'dashboard', icon: LayoutDashboard, badgeKey: 'total' },
  { title: 'Users', view: 'users', icon: Users, badgeKey: null, permission: 'users_view' },
  { title: 'Submissions', view: 'submissions', icon: FileCheck, badgeKey: 'submissions', permission: 'submissions_view' },
  { title: 'Rewards', view: 'rewards', icon: Gift, badgeKey: null, permission: 'rewards_view' },
  { title: 'Sponsored Rewards', view: 'sponsored-rewards', icon: Sparkles, badgeKey: null, permission: 'rewards_view' },
  { title: 'Campaigns', view: 'campaigns', icon: Megaphone, badgeKey: null, permission: 'sponsors_view' },
  { title: 'Claims', view: 'claims', icon: ShoppingBag, badgeKey: 'claims', permission: 'claims_view' },
  { title: 'Gifts', view: 'gifts', icon: Gift, badgeKey: null, permission: 'claims_view' },
  { title: 'Purchases', view: 'purchases', icon: Receipt, badgeKey: null, permission: 'claims_view' },
  { title: 'Packages', view: 'packages', icon: Package, badgeKey: null, permission: 'rewards_edit' },
  { title: 'Brands', view: 'brands', icon: Store, badgeKey: null, permission: 'brands_view' },
  { title: 'Sponsors', view: 'sponsors', icon: Building2, badgeKey: null, permission: 'sponsors_view' },
  { title: 'Sponsor Applications', view: 'sponsor-applications', icon: FileCheck, badgeKey: null, permission: 'sponsors_view' },
  { title: 'Wishlists', view: 'wishlists', icon: Heart, badgeKey: null, permission: 'users_view' },
  { title: 'Wishlist Analytics', view: 'wishlist-analytics', icon: TrendingUp, badgeKey: null, permission: 'users_view' },
  { title: 'Sync Verification', view: 'sync-verification', icon: RefreshCw, badgeKey: null, permission: 'settings_view' },
];

const adminManagementItems: MenuItem[] = [
  { title: 'Team', view: 'team', icon: Shield, badgeKey: null, permission: 'admins_view' },
  { title: 'Activity Log', view: 'activity', icon: Activity, badgeKey: null, permission: 'admins_view' },
  { title: 'Feedback', view: 'feedback', icon: MessageSquare, badgeKey: null, permission: 'admins_view' },
];

export function AdminSidebar({ onNavigate, currentView }: AdminSidebarProps) {
  const { open } = useSidebar();
  const { pendingClaims, pendingSubmissions, totalPending } = useAdminNotifications();
  const { hasPermission, isSuperAdmin } = useAdminRole();

  const getBadgeCount = (badgeKey: 'total' | 'claims' | 'submissions' | null): number => {
    switch (badgeKey) {
      case 'total':
        return totalPending;
      case 'claims':
        return pendingClaims;
      case 'submissions':
        return pendingSubmissions;
      default:
        return 0;
    }
  };

  const canViewItem = (item: MenuItem): boolean => {
    if (isSuperAdmin) return true;
    if (!item.permission) return true;
    return hasPermission(item.permission);
  };

  const visibleMenuItems = menuItems.filter(canViewItem);
  const visibleAdminItems = adminManagementItems.filter(canViewItem);

  return (
    <Sidebar className={open ? 'w-60' : 'w-14'} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            {open && <h2 className="font-bold text-lg">Admin Panel</h2>}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => {
                const badgeCount = getBadgeCount(item.badgeKey);
                
                return (
                  <SidebarMenuItem key={item.view}>
                    <SidebarMenuButton
                      onClick={() => onNavigate(item.view)}
                      className={`cursor-pointer ${
                        currentView === item.view ? 'bg-accent text-accent-foreground' : ''
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {open && (
                        <div className="flex items-center justify-between flex-1">
                          <span>{item.title}</span>
                          <NotificationBadge count={badgeCount} />
                        </div>
                      )}
                      {!open && badgeCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
                          {badgeCount > 9 ? '!' : badgeCount}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visibleAdminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin Team</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdminItems.map((item) => (
                  <SidebarMenuItem key={item.view}>
                    <SidebarMenuButton
                      onClick={() => onNavigate(item.view)}
                      className={`cursor-pointer ${
                        currentView === item.view ? 'bg-accent text-accent-foreground' : ''
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {open && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
