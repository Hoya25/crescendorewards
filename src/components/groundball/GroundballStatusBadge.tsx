import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
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

const TIER_CONFIG = {
  none: {
    label: 'Member',
    emoji: '⚪',
    icon: '○',
    gradient: 'from-slate-400/20 to-slate-500/10',
    border: 'border-dashed border-slate-500/30',
    text: 'text-slate-400',
    bgGlow: '',
  },
  bronze: {
    label: 'Bronze Status',
    emoji: '🥉',
    icon: '🥉',
    gradient: 'from-orange-500/20 to-amber-600/10',
    border: 'border-orange-500/40',
    text: 'text-orange-400',
    bgGlow: '',
  },
  silver: {
    label: 'Silver Status',
    emoji: '🥈',
    icon: '🥈',
    gradient: 'from-slate-300/20 to-slate-400/10',
    border: 'border-slate-400/40',
    text: 'text-slate-300',
    bgGlow: '',
  },
  gold: {
    label: 'Gold Status',
    emoji: '🥇',
    icon: '🥇',
    gradient: 'from-amber-400/20 to-yellow-500/10',
    border: 'border-amber-400/50',
    text: 'text-amber-400',
    bgGlow: 'shadow-lg shadow-amber-500/20',
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

function calculateProgress(locked: number, currentTier: string): { percent: number; remaining: number; nextTier: string | null } {
  const next = getNextTier(currentTier);
  if (!next) return { percent: 100, remaining: 0, nextTier: null };
  
  const currentThreshold = getCurrentThreshold(currentTier);
  const range = next.threshold - currentThreshold;
  const progress = locked - currentThreshold;
  const percent = Math.min(100, Math.max(0, (progress / range) * 100));
  const remaining = Math.max(0, next.threshold - locked);
  
  return { percent, remaining, nextTier: next.tier };
}

export function GroundballStatusBadge({
  memberId,
  size = 'md',
  showProgress = true,
  showSelections = true,
}: GroundballStatusBadgeProps) {
  const { profile } = useUnifiedUser();
  const effectiveMemberId = memberId || profile?.auth_user_id;

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
    enabled: !!effectiveMemberId,
  });

  // Default values if no status record exists
  const tier = status?.status_tier || 'none';
  const locked = status?.groundball_locked || 0;
  const selectionsUsed = status?.selections_used || 0;
  const selectionsMax = (status?.selections_max || 0) + (status?.bonus_selections || 0);
  
  const config = TIER_CONFIG[tier];
  const progress = calculateProgress(locked, tier);

  // Small version
  if (size === 'sm') {
    if (isLoading) {
      return <Skeleton className="h-6 w-24 rounded-full" />;
    }
    
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
          'bg-gradient-to-r border',
          config.gradient,
          config.border,
          config.text
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

  // Medium version
  if (size === 'md') {
    if (isLoading) {
      return <Skeleton className="h-16 w-full rounded-xl" />;
    }
    
    return (
      <div
        className={cn(
          'p-4 rounded-xl bg-gradient-to-br border',
          config.gradient,
          config.border,
          config.bgGlow
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <div className={cn('font-semibold', config.text)}>
                {config.label}
              </div>
              <div className="text-sm text-slate-400">
                {locked.toLocaleString()} GROUNDBALL Locked
              </div>
            </div>
          </div>
          {showSelections && selectionsMax > 0 && (
            <div className="text-right">
              <div className="text-sm text-slate-400">Selections</div>
              <div className={cn('font-semibold', config.text)}>
                {selectionsUsed}/{selectionsMax}
              </div>
            </div>
          )}
        </div>
        
        {showProgress && progress.nextTier && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Progress to {progress.nextTier.charAt(0).toUpperCase() + progress.nextTier.slice(1)}</span>
              <span>{Math.round(progress.percent)}%</span>
            </div>
            <Progress value={progress.percent} className="h-1.5" />
          </div>
        )}
      </div>
    );
  }

  // Large version (profile page)
  if (isLoading) {
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
        config.border,
        config.bgGlow
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <span>🥍</span>
          <span>GROUNDBALL</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5 space-y-5">
        {/* Status Display */}
        <div className="text-center">
          <div className="text-4xl mb-2">{config.icon}</div>
          <div className={cn('text-xl font-bold uppercase tracking-wide', config.text)}>
            {tier === 'none' ? 'Member' : `${tier.charAt(0).toUpperCase() + tier.slice(1)} Status`}
          </div>
          <div className="text-slate-400 mt-1">
            {locked.toLocaleString()} GROUNDBALL Locked
          </div>
        </div>
        
        {/* Progress to Next Tier */}
        {showProgress && progress.nextTier && (
          <div className="space-y-2">
            <div className="text-sm text-slate-400">
              Progress to {progress.nextTier.charAt(0).toUpperCase() + progress.nextTier.slice(1)}
            </div>
            <div className="relative">
              <Progress value={progress.percent} className="h-3" />
              <span className="absolute right-0 top-0 -translate-y-full text-xs text-slate-400 pb-1">
                {Math.round(progress.percent)}%
              </span>
            </div>
            <div className="text-sm text-slate-500">
              {progress.remaining.toLocaleString()} more to {progress.nextTier.charAt(0).toUpperCase() + progress.nextTier.slice(1)}
            </div>
          </div>
        )}
        
        {showProgress && !progress.nextTier && tier === 'gold' && (
          <div className="text-center py-2">
            <div className="text-amber-400 font-medium">✨ Maximum Status Achieved</div>
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
                      'w-3 h-3 rounded-full',
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
          </div>
        )}
      </div>
    </div>
  );
}

export default GroundballStatusBadge;
