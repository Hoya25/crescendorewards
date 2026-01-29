import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Circle, Calendar, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGroundballStatus } from '@/hooks/useGroundballStatus';

const STATUS_CONFIG = {
  none: { emoji: '○', label: 'No Status', color: 'text-muted-foreground', borderColor: 'border-border' },
  bronze: { emoji: '🥉', label: 'Bronze', color: 'text-orange-400', borderColor: 'border-orange-500/30' },
  silver: { emoji: '🥈', label: 'Silver', color: 'text-slate-300', borderColor: 'border-slate-400/30' },
  gold: { emoji: '🥇', label: 'Gold', color: 'text-amber-400', borderColor: 'border-amber-500/30' },
};

const CADENCE_LABELS: Record<string, string> = {
  daily: 'Daily',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
  one_time: 'One-Time',
};

export function GroundballDashboardWidget() {
  const { 
    status, 
    selections, 
    isLoading, 
    totalSlots, 
    usedSlots 
  } = useGroundballStatus();

  const statusTier = status?.status_tier || 'none';
  const statusConfig = STATUS_CONFIG[statusTier as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.none;

  // Find next available redemption from active selections
  const nextRedemption = selections.find(s => {
    if (!s.reward) return false;
    const cadence = s.reward.cadence || 'one_time';
    if (cadence === 'one_time' && s.redemption_count > 0) return false;
    
    // Check if redemption is available based on cadence
    const lastRedeemed = s.last_redeemed_at ? new Date(s.last_redeemed_at) : null;
    const now = new Date();
    
    if (!lastRedeemed) return true;
    
    switch (cadence) {
      case 'daily':
        return lastRedeemed.toDateString() !== now.toDateString();
      case 'monthly':
        return lastRedeemed.getMonth() !== now.getMonth() || lastRedeemed.getFullYear() !== now.getFullYear();
      case 'quarterly':
        return Math.floor(lastRedeemed.getMonth() / 3) !== Math.floor(now.getMonth() / 3) || lastRedeemed.getFullYear() !== now.getFullYear();
      case 'annual':
        return lastRedeemed.getFullYear() !== now.getFullYear();
      default:
        return true;
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border-2', statusConfig.borderColor, 'bg-gradient-to-br from-emerald-500/5 to-transparent')}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          🥍 GROUNDBALL Impact Engine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{statusConfig.emoji}</span>
            <span className={cn('font-semibold', statusConfig.color)}>
              {statusConfig.label} Status
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Selection Indicators */}
            <div className="flex gap-0.5">
              {Array.from({ length: totalSlots }).map((_, i) => (
                <Circle 
                  key={i} 
                  className={cn(
                    'w-3 h-3',
                    i < usedSlots ? 'fill-emerald-500 text-emerald-500' : 'text-muted-foreground'
                  )} 
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {usedSlots}/{totalSlots} selected
            </span>
          </div>
        </div>

        {/* Next Redemption */}
        {nextRedemption && nextRedemption.reward && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-muted-foreground mb-1">Next redemption available:</p>
            <div className="flex items-center gap-2">
              <span className="text-lg">{nextRedemption.reward.image_emoji || '🎁'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{nextRedemption.reward.title}</p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                <Check className="w-3 h-3 mr-1" />
                Ready now
              </Badge>
            </div>
          </div>
        )}

        {/* No selections state */}
        {selections.length === 0 && (
          <div className="p-4 rounded-lg bg-muted/30 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              You haven't selected any rewards yet
            </p>
            <p className="text-xs text-muted-foreground">
              Browse the GROUNDBALL marketplace to get started
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to="/groundball/my-rewards">
              View My Rewards
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
          <Button asChild size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
            <Link to="/groundball/rewards">
              Browse More
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default GroundballDashboardWidget;
