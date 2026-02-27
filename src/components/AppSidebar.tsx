import { Home, Gift, ShoppingBag, UserPlus, User, HelpCircle, Shield, Heart, Coins, Leaf, Target, Trophy, BookOpen, Zap, Lock } from 'lucide-react';
import nctrIconDark from '@/assets/nctr-grey.png';
import nctrIconLight from '@/assets/nctr-yellow.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useUserOnboarding } from '@/hooks/useUserOnboarding';
import { StatusBadgeSidebar, StatusBadgeCollapsed } from '@/components/status/StatusBadgeWidget';

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  onNavigate?: () => void;
}

interface NavItem {
  title: string;
  url: string;
  icon: any;
  emoji?: string;
  subtext?: string;
  external?: string;
  highlight?: boolean;
}

const coreNavItems: NavItem[] = [
  { title: 'Home', url: '/dashboard', icon: Home },
  { title: 'My Rewards', url: '/rewards', icon: Gift, emoji: '🎁', subtext: 'Redeem with your locked NCTR' },
  { title: 'My Status', url: '/membership', icon: Lock, emoji: '💎', subtext: 'Your status level unlocks your rewards' },
  { title: 'Shop & Earn', url: '#', icon: ShoppingBag, emoji: '🛒', subtext: 'Earn NCTR on every purchase', external: 'https://thegarden.nctr.live/' },
  { title: 'Bounties', url: '/bounties', icon: Zap, emoji: '⚡', subtext: 'Complete bounties, earn NCTR' },
];

const secondaryNavItems: NavItem[] = [
  { title: 'How It Works', url: '/how-it-works', icon: BookOpen },
  { title: 'Get Claims', url: '/buy-claims', icon: Coins, highlight: true },
  { title: 'Leaderboard', url: '/leaderboard', icon: Trophy },
  { title: 'Invite Friends', url: '/invite', icon: UserPlus },
  { title: 'Shop Merch', url: '#', icon: ShoppingBag, external: 'https://nctr-merch.myshopify.com' },
  { title: 'Contribute', url: '/contribute', icon: Heart },
  { title: 'My Account', url: '/profile', icon: User },
  { title: 'Help', url: '/help', icon: HelpCircle },
];

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const { open } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAdminRole();
  const { profile, tier, nextTier, progressToNextTier, total360Locked } = useUnifiedUser();
  const { progressPercent, completedCount, totalItems, loading: completionLoading } = useUserOnboarding();
  const isComplete = completedCount >= totalItems && totalItems > 0;
  const percentage = Math.round(progressPercent);

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (url: string, external?: string) => {
    if (external) {
      window.open(external, '_blank');
    } else {
      navigate(url);
    }
    onNavigate?.();
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.url);
    const button = (
      <SidebarMenuButton
        onClick={() => handleNavigation(item.url, item.external)}
        className={cn(
          "cursor-pointer",
          active 
            ? "bg-accent text-accent-foreground" 
            : "hover:bg-accent hover:text-accent-foreground"
        )}
      >
        {item.emoji && open ? (
          <span className="text-base leading-none w-4 flex items-center justify-center">{item.emoji}</span>
        ) : (
          <item.icon className={cn("h-4 w-4", item.highlight && "text-[#E2FF6D]")} />
        )}
        {open && (
          <div className="flex flex-col min-w-0">
            <span className={cn(
              "text-sm leading-tight truncate",
              item.highlight && "text-[#E2FF6D] font-semibold"
            )}>
              {item.title}
            </span>
            {item.subtext && (
              <span className="text-[10px] text-muted-foreground truncate leading-tight">
                {item.subtext}
              </span>
            )}
          </div>
        )}
      </SidebarMenuButton>
    );

    // Show tooltip with subtext when sidebar is collapsed
    if (!open && item.subtext) {
      return (
        <TooltipProvider key={item.title} delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuItem>{button}</SidebarMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[200px]">
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.subtext}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return <SidebarMenuItem key={item.title}>{button}</SidebarMenuItem>;
  };

  return (
    <Sidebar className={open ? 'w-60' : 'w-14'} collapsible="icon">
      <SidebarContent>
        {/* Brand Mark */}
        <div className={cn("flex items-center gap-2 px-3 py-3", !open && "justify-center")}>
          <img src={nctrIconDark} alt="NCTR" className="block dark:hidden w-6 h-6 flex-shrink-0" />
          <img src={nctrIconLight} alt="NCTR" className="hidden dark:block w-6 h-6 flex-shrink-0" />
          {open && <span className="text-base font-bold tracking-wide text-foreground">Crescendo</span>}
        </div>
        <SidebarSeparator />

        {/* Core Navigation — Earn & Redeem */}
        <SidebarGroup>
          {open && <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Earn & Redeem</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {coreNavItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Navigation */}
        <SidebarSeparator />
        <SidebarGroup>
          {open && <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">More</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map(renderNavItem)}
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

        {/* Crescendo Status Indicator */}
        <SidebarGroup>
          <SidebarGroupContent>
            {open ? <StatusBadgeSidebar /> : <StatusBadgeCollapsed />}
          </SidebarGroupContent>
        </SidebarGroup>

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
                      Complete setup for bonus Claims
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
