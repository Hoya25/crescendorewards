import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Lock, Coins, RefreshCw, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroundballStatusBadgeProps {
  memberId?: string;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  showSelections?: boolean;
}

interface GroundballStatus {
  id: string;
  member_id: string;
  groundball_locked: number;
  status_tier: 'none' | 'bronze' | 'silver' | 'gold';
  selections_used: number;
  selections_max: number;
  bonus_selections: number;
  free_swaps_remaining: number;
}

const TIER_THRESHOLDS = {
  bronze: 100,
  silver: 250,
  gold: 500,
};

// Tier-specific colors using the requested hex values
const TIER_COLORS = {
  none: {
    primary: '#6B7280', // gray-500
    text: 'text-slate-400',
    bg: 'bg-slate-500/20',
    border: 'border-slate-500/30',
    gradient: 'from-slate-500/20 to-slate-600/10',
    progressBg: 'bg-slate-600',
    progressFill: 'bg-slate-400',
  },
  bronze: {
    primary: '#CD7F32', // bronze/copper
    text: 'text-[#CD7F32]',
    bg: 'bg-[#CD7F32]/20',
    border: 'border-[#CD7F32]/40',
    gradient: 'from-[#CD7F32]/20 to-amber-700/10',
    progressBg: 'bg-[#CD7F32]/30',
    progressFill: 'bg-[#CD7F32]',
  },
  silver: {
    primary: '#C0C0C0', // silver
    text: 'text-[#C0C0C0]',
    bg: 'bg-[#C0C0C0]/20',
    border: 'border-[#C0C0C0]/40',
    gradient: 'from-[#C0C0C0]/20 to-slate-400/10',
    progressBg: 'bg-[#C0C0C0]/30',
    progressFill: 'bg-[#C0C0C0]',
  },
  gold: {
    primary: '#FFD700', // gold
    text: 'text-[#FFD700]',
    bg: 'bg-[#FFD700]/20',
    border: 'border-[#FFD700]/50',
    gradient: 'from-[#FFD700]/20 to-amber-500/10',
    progressBg: 'bg-[#FFD700]/30',
    progressFill: 'bg-[#FFD700]',
    glow: 'shadow-lg shadow-[#FFD700]/20',
  },
};

const TIER_CONFIG = {
  none: {
    label: 'Member',
    emoji: '⚪',
    icon: '○',
  },
  bronze: {
    label: 'Bronze Status',
    emoji: '🥉',
    icon: '🥉',
  },
  silver: {
    label: 'Silver Status',
    emoji: '🥈',
    icon: '🥈',
  },
  gold: {
    label: 'Gold Status',
    emoji: '🥇',
    icon: '🥇',
  },
};

function getNextTier(currentTier: string): { tier: string; threshold: number } | null {
  if (currentTier === 'none') return { tier: 'bronze', threshold: TIER_THRESHOLDS.bronze };
  if (currentTier === 'bronze') return { tier: 'silver', threshold: TIER_THRESHOLDS.silver };
  if (currentTier === 'silver') return { tier: 'gold', threshold: TIER_THRESHOLDS.gold };
  return null; // Gold is max
}

function getCurrentThreshold(tier: string): number {
  if (tier === 'bronze') return TIER_THRESHOLDS.bronze;
  if (tier === 'silver') return TIER_THRESHOLDS.silver;
  if (tier === 'gold') return TIER_THRESHOLDS.gold;
  return 0;
}

function calculateProgress(locked: number, currentTier: string): { percent: number; remaining: number; nextTier: string | null; nextThreshold: number } {
  const next = getNextTier(currentTier);
  if (!next) return { percent: 100, remaining: 0, nextTier: null, nextThreshold: TIER_THRESHOLDS.gold };
  
  const currentThreshold = getCurrentThreshold(currentTier);
  const range = next.threshold - currentThreshold;
  const progress = locked - currentThreshold;
  const percent = Math.min(100, Math.max(0, (progress / range) * 100));
  const remaining = Math.max(0, next.threshold - locked);
  
  return { percent, remaining, nextTier: next.tier, nextThreshold: next.threshold };
}

export function GroundballStatusBadge({
  memberId,
  size = 'md',
  showProgress = true,
  showSelections = true,
}: GroundballStatusBadgeProps) {
  const { profile } = useUnifiedUser();
  const effectiveMemberId = memberId || profile?.auth_user_id;
  
  // Demo mode integration
  let demoContext: ReturnType<typeof useDemoMode> | null = null;
  try {
    demoContext = useDemoMode();
  } catch {
    // Not in DemoModeProvider
  }
  const isDemoMode = demoContext?.isDemoMode || false;
  const demoMode = demoContext?.demoMode;

  const { data: status, isLoading } = useQuery({
    queryKey: ['groundball-status', effectiveMemberId],
    queryFn: async () => {
      if (!effectiveMemberId) return null;
      
      const { data, error } = await supabase
        .from('member_groundball_status')
        .select('*')
        .eq('member_id', effectiveMemberId)
        .maybeSingle();
      
      if (error) throw error;
      return data as GroundballStatus | null;
    },
    enabled: !!effectiveMemberId && !isDemoMode,
  });

  // Use demo values when enabled
  const tier = isDemoMode && demoMode ? demoMode.statusTier : (status?.status_tier || 'none');
  const locked = isDemoMode && demoMode ? demoMode.groundballLocked : (status?.groundball_locked || 0);
  const selectionsUsed = isDemoMode && demoMode ? demoMode.selectionsUsed : (status?.selections_used || 0);
  const selectionsMax = isDemoMode && demoMode 
    ? demoMode.selectionsMax + demoMode.bonusSelections 
    : (status?.selections_max || 0) + (status?.bonus_selections || 0);
  const freeSwaps = isDemoMode && demoMode ? demoMode.freeSwapsRemaining : (status?.free_swaps_remaining || 0);
  const claimsBalance = isDemoMode && demoMode ? demoMode.claimsBalance : (profile?.crescendo_data?.claims_balance || 0);
  
  const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.none;
  const colors = TIER_COLORS[tier as keyof typeof TIER_COLORS] || TIER_COLORS.none;
  const progress = calculateProgress(locked, tier);

  // Calculate overall progress percentage across all tiers for the milestone bar
  const overallProgress = Math.min(100, (locked / TIER_THRESHOLDS.gold) * 100);

  // Small version
  if (size === 'sm') {
    if (isLoading && !isDemoMode) {
      return <Skeleton className="h-6 w-24 rounded-full" />;
    }
    
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
          'bg-gradient-to-r border',
          colors.gradient,
          colors.border,
          colors.text
        )}
      >
        <span>{config.emoji}</span>
        <span className="capitalize">{tier === 'none' ? 'Member' : tier}</span>
        {showSelections && selectionsMax > 0 && (
          <>
            <span className="text-slate-500">•</span>
            <span>{selectionsUsed}/{selectionsMax}</span>
          </>
        )}
      </div>
    );
  }

  // Medium version - Enhanced Status Card
  if (size === 'md') {
    if (isLoading && !isDemoMode) {
      return <Skeleton className="h-48 w-full rounded-xl" />;
    }
    
    return (
      <div
        className={cn(
          'rounded-xl border overflow-hidden bg-gradient-to-br',
          colors.gradient,
          colors.border,
          tier === 'gold' && 'shadow-lg shadow-[#FFD700]/20'
        )}
      >
        {/* Header Row */}
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-2xl",
                colors.bg,
                "border-2",
                colors.border
              )}>
                {config.icon}
              </div>
              <div>
                <div className={cn('font-bold text-lg', colors.text)}>
                  {tier === 'none' ? 'Member' : `${tier.charAt(0).toUpperCase() + tier.slice(1)} Status`}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{locked.toLocaleString()} $GBS Locked</span>
                </div>
              </div>
            </div>
            
            {/* Claims Balance */}
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Coins className="w-4 h-4" />
                <span className="font-semibold">{claimsBalance}</span>
              </div>
              <div className="text-xs text-slate-500">Claims</div>
            </div>
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="px-4 pb-3 grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-slate-800/50">
            <div className="text-lg font-semibold text-white">{selectionsUsed}/{selectionsMax}</div>
            <div className="text-xs text-slate-400">Slots Used</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-800/50">
            <div className="text-lg font-semibold text-white flex items-center justify-center gap-1">
              <RefreshCw className="w-4 h-4 text-sky-400" />
              {freeSwaps}
            </div>
            <div className="text-xs text-slate-400">Free Swaps</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-800/50">
            <div className="text-lg font-semibold text-emerald-400">{locked}</div>
            <div className="text-xs text-slate-400">$GBS Locked</div>
          </div>
        </div>
        
        {/* Progress Bar with Milestones */}
        {showProgress && (
          <div className="px-4 pb-4">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="text-slate-400">
                {progress.nextTier 
                  ? `Progress to ${progress.nextTier.charAt(0).toUpperCase() + progress.nextTier.slice(1)}: ${locked}/${progress.nextThreshold} $GBS`
                  : '✨ Maximum Status Achieved'
                }
              </span>
              {progress.nextTier && (
                <span className={colors.text}>{progress.remaining} to go</span>
              )}
            </div>
            
            {/* Multi-tier Progress Bar */}
            <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
              {/* Progress Fill */}
              <div 
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{ 
                  width: `${overallProgress}%`,
                  background: `linear-gradient(90deg, #6B7280 0%, #CD7F32 20%, #C0C0C0 50%, #FFD700 100%)`,
                }}
              />
              
              {/* Milestone Markers */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-[#CD7F32]"
                style={{ left: `${(TIER_THRESHOLDS.bronze / TIER_THRESHOLDS.gold) * 100}%` }}
              />
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-[#C0C0C0]"
                style={{ left: `${(TIER_THRESHOLDS.silver / TIER_THRESHOLDS.gold) * 100}%` }}
              />
            </div>
            
            {/* Milestone Labels */}
            <div className="relative h-5 mt-1">
              <div 
                className="absolute text-[10px] text-[#CD7F32] transform -translate-x-1/2"
                style={{ left: `${(TIER_THRESHOLDS.bronze / TIER_THRESHOLDS.gold) * 100}%` }}
              >
                🥉 100
              </div>
              <div 
                className="absolute text-[10px] text-[#C0C0C0] transform -translate-x-1/2"
                style={{ left: `${(TIER_THRESHOLDS.silver / TIER_THRESHOLDS.gold) * 100}%` }}
              >
                🥈 250
              </div>
              <div 
                className="absolute text-[10px] text-[#FFD700] right-0"
              >
                🥇 500
              </div>
            </div>
          </div>
        )}
        
        {/* Next Tier Info & CTA */}
        <div className="px-4 pb-4">
          {progress.nextTier ? (
            <div className="flex items-center gap-3">
              <Button
                asChild
                className={cn(
                  "flex-1 font-medium",
                  tier === 'none' && "bg-[#CD7F32] hover:bg-[#CD7F32]/80",
                  tier === 'bronze' && "bg-[#C0C0C0] hover:bg-[#C0C0C0]/80 text-slate-900",
                  tier === 'silver' && "bg-[#FFD700] hover:bg-[#FFD700]/80 text-slate-900"
                )}
                size="sm"
              >
                <Link to="/groundball/gear-vault">
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Lock More $GBS
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="text-center py-1">
              <div className="text-[#FFD700] font-medium text-sm">
                🏆 You've reached Gold Status!
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Large version (profile page)
  if (isLoading && !isDemoMode) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="p-5 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border overflow-hidden bg-slate-900/50',
        colors.border,
        tier === 'gold' && 'shadow-lg shadow-[#FFD700]/20'
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <span>🥍</span>
            <span>GROUNDBALL</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400 text-sm">
            <Coins className="w-3.5 h-3.5" />
            <span className="font-medium">{claimsBalance} Claims</span>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5 space-y-5">
        {/* Status Display */}
        <div className="text-center">
          <div className={cn(
            "w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-3",
            colors.bg,
            "border-2",
            colors.border
          )}>
            {config.icon}
          </div>
          <div className={cn('text-xl font-bold uppercase tracking-wide', colors.text)}>
            {tier === 'none' ? 'Member' : `${tier.charAt(0).toUpperCase() + tier.slice(1)} Status`}
          </div>
          <div className="flex items-center justify-center gap-1.5 text-slate-400 mt-1">
            <Lock className="w-4 h-4" />
            <span>{locked.toLocaleString()} $GBS Locked</span>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="text-xl font-bold text-white">{selectionsUsed}/{selectionsMax}</div>
            <div className="text-xs text-slate-400">Slots Used</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="text-xl font-bold text-sky-400">{freeSwaps}</div>
            <div className="text-xs text-slate-400">Free Swaps</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="text-xl font-bold text-amber-400">{claimsBalance}</div>
            <div className="text-xs text-slate-400">Claims</div>
          </div>
        </div>
        
        {/* Progress to Next Tier */}
        {showProgress && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">
                {progress.nextTier 
                  ? `Progress to ${progress.nextTier.charAt(0).toUpperCase() + progress.nextTier.slice(1)}`
                  : 'Maximum Status'
                }
              </span>
              {progress.nextTier && (
                <span className={colors.text}>{locked}/{progress.nextThreshold} $GBS</span>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{ 
                  width: `${overallProgress}%`,
                  background: `linear-gradient(90deg, #6B7280 0%, #CD7F32 20%, #C0C0C0 50%, #FFD700 100%)`,
                }}
              />
              
              {/* Milestone Markers */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-[#CD7F32]/80 rounded"
                style={{ left: `${(TIER_THRESHOLDS.bronze / TIER_THRESHOLDS.gold) * 100}%` }}
              />
              <div 
                className="absolute top-0 bottom-0 w-1 bg-[#C0C0C0]/80 rounded"
                style={{ left: `${(TIER_THRESHOLDS.silver / TIER_THRESHOLDS.gold) * 100}%` }}
              />
            </div>
            
            {/* Milestone Labels */}
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">0</span>
              <span className="text-[#CD7F32]">🥉 100</span>
              <span className="text-[#C0C0C0]">🥈 250</span>
              <span className="text-[#FFD700]">🥇 500</span>
            </div>
            
            {progress.nextTier && (
              <div className="text-center text-sm text-slate-400">
                Lock <span className={colors.text}>{progress.remaining} more $GBS</span> to unlock {progress.nextTier.charAt(0).toUpperCase() + progress.nextTier.slice(1)}
              </div>
            )}
            
            {!progress.nextTier && tier === 'gold' && (
              <div className="text-center py-2">
                <div className="text-[#FFD700] font-medium">🏆 Maximum Status Achieved</div>
              </div>
            )}
          </div>
        )}
        
        {/* Divider */}
        {showSelections && (
          <div className="border-t border-slate-700" />
        )}
        
        {/* Selections */}
        {showSelections && (
          <div className="space-y-3">
            <div className="text-sm text-slate-400">Your Selections</div>
            <div className="flex items-center gap-2">
              {/* Selection dots */}
              <div className="flex gap-1">
                {Array.from({ length: selectionsMax || 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-3 h-3 rounded-full transition-colors',
                      i < selectionsUsed
                        ? 'bg-emerald-500'
                        : 'bg-slate-600 border border-slate-500'
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-slate-400">
                {selectionsUsed} of {selectionsMax || 0} active
              </span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="flex-1 border-slate-600 hover:bg-slate-800"
              >
                <Link to="/groundball/my-rewards">View My Rewards</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <Link to="/groundball/rewards">Browse & Select</Link>
              </Button>
            </div>
            
            {/* Lock More CTA */}
            {progress.nextTier && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className={cn(
                  "w-full mt-2",
                  colors.border,
                  colors.text,
                  "hover:bg-slate-800"
                )}
              >
                <Link to="/groundball/gear-vault">
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Lock More $GBS to Reach {progress.nextTier.charAt(0).toUpperCase() + progress.nextTier.slice(1)}
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GroundballStatusBadge;
