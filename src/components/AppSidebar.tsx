import { Home, Compass, Gift, ShoppingBag, UserPlus, User, ChevronRight, HelpCircle, Crown, Shield, Upload, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  onNavigate?: () => void;
}

const mainNavItems = [
  { title: 'Home', url: '/dashboard', icon: Home },
  { title: 'Discover', url: '/discover', icon: Compass },
  { title: 'Rewards', url: '/rewards', icon: Gift },
  { title: 'Shop Merch', url: '#', icon: ShoppingBag, external: 'https://nctr-merch.myshopify.com' },
  { title: 'The Garden', url: '#', icon: Crown, external: 'https://thegarden.nctr.live/' },
  { title: 'Share Content', url: '/submit-content', icon: Upload },
  { title: 'Contribute', url: '/contribute', icon: Heart },
  { title: 'Invite Friends', url: '/invite', icon: UserPlus },
  { title: 'My Account', url: '/profile', icon: User },
  { title: 'Help', url: '/help', icon: HelpCircle },
];

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const { open } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAdminRole();
  const { profile, tier, nextTier, progressToNextTier, total360Locked } = useUnifiedUser();
  const { percentage, isComplete, loading: completionLoading } = useProfileCompletion(profile as any);

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (url: string, external?: string) => {
    if (external) {
      window.open(external, '_blank');
    } else {
      navigate(url);
    }
    onNavigate?.();
  };

  return (
    <Sidebar className={open ? 'w-60' : 'w-14'} collapsible="icon">
      <SidebarContent>
        {/* Main Navigation — starts immediately */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.url, (item as any).external)}
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

        {/* Admin — only for admins, compact */}
        {isAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
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
                          Admin
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
          </>
        )}

        {/* Profile completion — only if not complete */}
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
                      Earn points by finishing setup
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <div className="relative w-8 h-8">
                      <svg className="w-8 h-8 transform -rotate-90">
                        <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/30" />
                        <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2"
                          strokeDasharray={2 * Math.PI * 14}
                          strokeDashoffset={2 * Math.PI * 14 * (1 - percentage / 100)}
                          className="text-primary transition-all duration-300" strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold">{percentage}</span>
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
