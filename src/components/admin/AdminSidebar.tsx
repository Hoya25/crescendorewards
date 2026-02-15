import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Gift, ShoppingBag, Users, Settings, Store, FileCheck, Receipt, 
  Heart, TrendingUp, Building2, Megaphone, Shield, Activity, Package, MessageSquare, Star, 
  Coins, Bell, ChevronDown, ChevronRight, Trophy, Handshake, Twitter, UserCircle, Library, Target
} from 'lucide-react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  badgeKey?: 'total' | 'claims' | 'submissions' | null;
  permission?: AdminPermission;
}

interface MenuGroup {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: MenuItem[];
  defaultOpen?: boolean;
}

// Organized menu groups
const MENU_GROUPS: MenuGroup[] = [
  {
    title: 'Content',
    icon: Library,
    defaultOpen: true,
    items: [
      { title: 'Content Library', view: 'content-library', icon: Library, permission: 'rewards_view' },
      { title: 'Rewards', view: 'rewards', icon: Gift, permission: 'rewards_view' },
      { title: 'Reward Sponsors', view: 'sponsors', icon: Building2, permission: 'sponsors_view' },
      { title: 'Contributors', view: 'contributors', icon: UserCircle, permission: 'submissions_view' },
      { title: 'Contributed Rewards', view: 'contributed-rewards', icon: Gift, permission: 'submissions_view' },
      { title: 'Campaigns', view: 'campaigns', icon: Megaphone, permission: 'sponsors_view' },
      { title: 'Earning Opps', view: 'earning', icon: Coins, permission: 'rewards_edit' },
      { title: 'Bounties', view: 'bounties', icon: Target, permission: 'rewards_edit' },
      { title: 'Founding 111', view: 'founding-111', icon: Star, permission: 'admins_view' },
    ],
  },
  {
    title: 'Orders & Claims',
    icon: ShoppingBag,
    defaultOpen: true,
    items: [
      { title: 'Claims', view: 'claims', icon: ShoppingBag, badgeKey: 'claims', permission: 'claims_view' },
      { title: 'Purchases', view: 'purchases', icon: Receipt, permission: 'claims_view' },
      { title: 'Gifts', view: 'gifts', icon: Gift, permission: 'claims_view' },
    ],
  },
  {
    title: 'Users',
    icon: Users,
    defaultOpen: false,
    items: [
      { title: 'Users', view: 'users', icon: Users, permission: 'users_view' },
      { title: 'Notifications', view: 'user-notifications', icon: Bell, permission: 'users_view' },
      { title: 'Submissions', view: 'submissions', icon: FileCheck, badgeKey: 'submissions', permission: 'submissions_view' },
      { title: 'Sponsor Apps', view: 'sponsor-applications', icon: FileCheck, permission: 'sponsors_view' },
      { title: 'Feedback', view: 'feedback', icon: MessageSquare, permission: 'admins_view' },
    ],
  },
  {
    title: 'Analytics',
    icon: TrendingUp,
    defaultOpen: false,
    items: [
      { title: 'Dashboard', view: 'dashboard', icon: LayoutDashboard, badgeKey: 'total' },
      { title: 'Wishlists', view: 'wishlists', icon: Heart, permission: 'users_view' },
      { title: 'Wishlist Analytics', view: 'wishlist-analytics', icon: TrendingUp, permission: 'users_view' },
      { title: 'Activity Log', view: 'activity', icon: Activity, permission: 'admins_view' },
    ],
  },
  {
    title: 'Settings',
    icon: Settings,
    defaultOpen: false,
    items: [
      { title: 'Status Tiers', view: 'status-tiers', icon: Trophy, permission: 'settings_edit' },
      { title: 'Alliance Partners', view: 'alliance-partners', icon: Handshake, permission: 'settings_edit' },
      { title: 'Social Posts', view: 'social-posts', icon: Twitter, permission: 'settings_edit' },
      { title: 'Featured Creators', view: 'featured-creators', icon: UserCircle, permission: 'settings_edit' },
      { title: 'Packages', view: 'packages', icon: Package, permission: 'rewards_edit' },
      { title: 'Shop Settings', view: 'shop-settings', icon: ShoppingBag, permission: 'settings_edit' },
      { title: 'Team', view: 'team', icon: Shield, permission: 'admins_view' },
      { title: 'Settings', view: 'settings', icon: Settings, permission: 'settings_edit' },
    ],
  },
];

const STORAGE_KEY = 'admin-sidebar-expanded-groups';

export function AdminSidebar({ onNavigate, currentView }: AdminSidebarProps) {
  const { open } = useSidebar();
  const { pendingClaims, pendingSubmissions, totalPending } = useAdminNotifications();
  const { hasPermission, isSuperAdmin } = useAdminRole();

  // Load expanded state from localStorage
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default expanded state
    return MENU_GROUPS.reduce((acc, group) => {
      acc[group.title] = group.defaultOpen ?? false;
      return acc;
    }, {} as Record<string, boolean>);
  });

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expandedGroups));
  }, [expandedGroups]);

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const getBadgeCount = (badgeKey?: 'total' | 'claims' | 'submissions' | null): number => {
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

  // Check if a group contains the current view
  const groupContainsCurrentView = (group: MenuGroup): boolean => {
    return group.items.some(item => item.view === currentView);
  };

  // Get total badge count for a group
  const getGroupBadgeCount = (group: MenuGroup): number => {
    return group.items.reduce((total, item) => total + getBadgeCount(item.badgeKey), 0);
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

        <div className="py-2">
          {MENU_GROUPS.map((group) => {
            const visibleItems = group.items.filter(canViewItem);
            if (visibleItems.length === 0) return null;

            const isExpanded = expandedGroups[group.title] ?? group.defaultOpen;
            const containsActive = groupContainsCurrentView(group);
            const groupBadgeCount = getGroupBadgeCount(group);

            // When sidebar is collapsed, show just icons
            if (!open) {
              return (
                <SidebarGroup key={group.title} className="px-2">
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {visibleItems.slice(0, 2).map((item) => {
                        const badgeCount = getBadgeCount(item.badgeKey);
                        return (
                          <SidebarMenuItem key={item.view}>
                            <SidebarMenuButton
                              onClick={() => onNavigate(item.view)}
                              className={cn(
                                "cursor-pointer relative",
                                currentView === item.view && "bg-accent text-accent-foreground"
                              )}
                            >
                              <item.icon className="h-4 w-4 shrink-0" />
                              {badgeCount > 0 && (
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
              );
            }

            return (
              <Collapsible 
                key={group.title} 
                open={isExpanded} 
                onOpenChange={() => toggleGroup(group.title)}
              >
                <SidebarGroup className="py-0">
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel 
                      className={cn(
                        "cursor-pointer flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider",
                        "hover:bg-accent/50 transition-colors",
                        containsActive && "text-primary"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <group.icon className="h-3.5 w-3.5" />
                        <span>{group.title}</span>
                        {groupBadgeCount > 0 && (
                          <NotificationBadge count={groupBadgeCount} />
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {visibleItems.map((item) => {
                          const badgeCount = getBadgeCount(item.badgeKey);
                          
                          return (
                            <SidebarMenuItem key={item.view}>
                              <SidebarMenuButton
                                onClick={() => onNavigate(item.view)}
                                className={cn(
                                  "cursor-pointer pl-8",
                                  currentView === item.view && "bg-accent text-accent-foreground"
                                )}
                              >
                                <item.icon className="h-4 w-4 shrink-0" />
                                <div className="flex items-center justify-between flex-1">
                                  <span>{item.title}</span>
                                  <NotificationBadge count={badgeCount} />
                                </div>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            );
          })}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
