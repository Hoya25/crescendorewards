import { LayoutDashboard, Gift, ShoppingBag, Users, Settings, Store, FileCheck, Receipt, Heart, TrendingUp, Building2 } from 'lucide-react';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
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

const menuItems = [
  { title: 'Dashboard', view: 'dashboard', icon: LayoutDashboard, badgeKey: 'total' as const },
  { title: 'Users', view: 'users', icon: Users, badgeKey: null },
  { title: 'Submissions', view: 'submissions', icon: FileCheck, badgeKey: 'submissions' as const },
  { title: 'Rewards', view: 'rewards', icon: Gift, badgeKey: null },
  { title: 'Claims', view: 'claims', icon: ShoppingBag, badgeKey: 'claims' as const },
  { title: 'Purchases', view: 'purchases', icon: Receipt, badgeKey: null },
  { title: 'Brands', view: 'brands', icon: Store, badgeKey: null },
  { title: 'Sponsors', view: 'sponsors', icon: Building2, badgeKey: null },
  { title: 'Wishlists', view: 'wishlists', icon: Heart, badgeKey: null },
  { title: 'Wishlist Analytics', view: 'wishlist-analytics', icon: TrendingUp, badgeKey: null },
];

export function AdminSidebar({ onNavigate, currentView }: AdminSidebarProps) {
  const { open } = useSidebar();
  const { pendingClaims, pendingSubmissions, totalPending } = useAdminNotifications();

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
              {menuItems.map((item) => {
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
      </SidebarContent>
    </Sidebar>
  );
}
