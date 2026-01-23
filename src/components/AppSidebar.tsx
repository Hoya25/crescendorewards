import { Store, LayoutDashboard, Gift, Trophy, Crown, User, Heart, FileCheck, Receipt, BarChart3, Settings, UtensilsCrossed, Coins, Shield, ShoppingBag, ExternalLink, CheckCircle2, ChevronRight, TrendingUp, Ticket, Building2, Sparkles, PieChart, Send, UserPlus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { StatusBadge, TierProgress } from '@/components/StatusBadge';

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
  { title: 'Rewards', url: '/rewards', icon: Gift },
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'My Claims', url: '/claims', icon: Ticket, highlight: true },
  { title: 'Get Free Claims', url: '/earn', icon: TrendingUp },
  { title: 'Membership', url: '/membership', icon: Trophy },
  { title: 'Sponsors', url: '/sponsors', icon: Building2 },
  { title: 'Get Claims', url: '/buy-claims', icon: Coins },
  { title: 'Gift Claims', url: '/gift-claims', icon: Gift },
];

// HIDDEN FOR REWARDS-FOCUSED PHASE - TODO: Restore when re-enabling brand partnerships
const browseItems = [
  // { title: 'Crescendo Brands', url: '/brands', icon: Store },
  // { title: 'Food & Beverage', url: '/food-beverage', icon: UtensilsCrossed },
];

const accountItems = [
  { title: 'Profile', url: '/profile', icon: User },
  { title: 'Your NCTR', url: '/profile#portfolio', icon: PieChart },
  { title: 'Invite Friends', url: '/invite', icon: UserPlus, highlight: true },
  { title: 'Wishlist', url: '/wishlist', icon: Heart },
  { title: 'Submit Reward', url: '/submit-reward', icon: Send },
  { title: 'My Submissions', url: '/my-submissions', icon: FileCheck },
  { title: 'Purchase History', url: '/purchase-history', icon: Receipt },
  { title: 'Referral Analytics', url: '/referrals', icon: BarChart3 },
  { title: 'Become a Sponsor', url: '/become-sponsor', icon: Sparkles },
];

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const { open } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const { profile, tier, nextTier, progressToNextTier, total360Locked } = useUnifiedUser();
  const { percentage, isComplete, loading: completionLoading } = useProfileCompletion(profile as any);

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

        {/* Status Display Section */}
        {profile && (
          <SidebarGroup>
            <SidebarGroupContent>
              <Popover>
                <PopoverTrigger asChild>
                  <div 
                    className={cn(
                      "cursor-pointer rounded-lg p-3 mx-2 transition-colors border",
                      "hover:bg-accent/50"
                    )}
                    style={{
                      borderColor: tier?.badge_color ? `${tier.badge_color}30` : 'hsl(var(--border))',
                      backgroundColor: tier?.badge_color ? `${tier.badge_color}08` : undefined
                    }}
                  >
                    {open ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{tier?.badge_emoji || '💧'}</span>
                            <span className="font-semibold text-sm" style={{ color: tier?.badge_color }}>
                              {tier?.display_name || 'Droplet'}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                        {nextTier && (
                          <div className="space-y-1">
                            <Progress value={progressToNextTier} className="h-1" />
                            <p className="text-[10px] text-muted-foreground">
                              {Math.round(progressToNextTier)}% to {nextTier.display_name}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-lg">{tier?.badge_emoji || '💧'}</span>
                      </div>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent side="right" align="start" className="w-72 p-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{tier?.badge_emoji || '💧'}</span>
                      <div>
                        <p className="font-bold text-lg" style={{ color: tier?.badge_color }}>
                          {tier?.display_name || 'Droplet'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {total360Locked.toLocaleString()} NCTR in 360LOCK
                        </p>
                      </div>
                    </div>

                    {tier?.benefits && tier.benefits.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Your Benefits
                        </p>
                        <ul className="space-y-1.5">
                          {tier.benefits.slice(0, 4).map((benefit, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs">
                              <TrendingUp 
                                className="w-3 h-3 mt-0.5 shrink-0" 
                                style={{ color: tier.badge_color }}
                              />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {nextTier && (
                      <div 
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: `${nextTier.badge_color}10` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium">Next: {nextTier.badge_emoji} {nextTier.display_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(nextTier.min_nctr_360_locked - total360Locked).toLocaleString()} NCTR needed
                          </span>
                        </div>
                        <Progress value={progressToNextTier} className="h-1.5" />
                      </div>
                    )}

                    <button
                      onClick={() => handleNavigation('/membership')}
                      className="w-full text-center text-sm font-medium py-2 rounded-lg transition-colors"
                      style={{ 
                        backgroundColor: tier?.badge_color || 'hsl(var(--primary))',
                        color: 'white'
                      }}
                    >
                      View Status Details
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </SidebarGroupContent>
          </SidebarGroup>
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
                        : "hover:bg-accent hover:text-accent-foreground",
                      item.highlight && !isActive(item.url) && "hover:bg-violet-50 dark:hover:bg-violet-900/20"
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4",
                      item.highlight && "text-violet-600 dark:text-violet-400"
                    )} />
                    {open && (
                      <span className={cn(
                        item.highlight && "text-violet-700 dark:text-violet-400 font-medium"
                      )}>
                        {item.title}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
                        : "hover:bg-accent hover:text-accent-foreground",
                      (item as any).highlight && !isActive(item.url) && "bg-primary/5 hover:bg-primary/10 border border-primary/20"
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4",
                      (item as any).highlight && "text-primary"
                    )} />
                    {open && (
                      <span className={cn(
                        "flex items-center gap-2",
                        (item as any).highlight && "text-primary font-medium"
                      )}>
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
