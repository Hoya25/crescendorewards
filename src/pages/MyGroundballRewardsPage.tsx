import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Check, 
  Circle, 
  Calendar, 
  RefreshCw, 
  Heart, 
  Plus,
  ExternalLink,
  Gift,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGroundballStatus, type RewardSelection, type GroundballReward } from '@/hooks/useGroundballStatus';
import { SwapRewardModal } from '@/components/groundball/SwapRewardModal';
import { RedemptionModal } from '@/components/groundball/RedemptionModal';

const STATUS_CONFIG = {
  none: { emoji: '○', label: 'No Status', color: 'text-muted-foreground', bgColor: 'bg-muted/50', borderColor: 'border-muted' },
  bronze: { emoji: '🥉', label: 'Bronze', color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
  silver: { emoji: '🥈', label: 'Silver', color: 'text-slate-300', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-400/30' },
  gold: { emoji: '🥇', label: 'Gold', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
};

const CADENCE_LABELS: Record<string, string> = {
  daily: 'Daily',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
  one_time: 'One-Time',
};

const SWAP_COST = 15; // Claims cost for paid swaps

export default function MyGroundballRewardsPage() {
  const { 
    status, 
    selections, 
    isLoading, 
    totalSlots, 
    usedSlots, 
    freeSwaps,
    swapReward,
  } = useGroundballStatus();
  
  const [swapModalSelection, setSwapModalSelection] = useState<RewardSelection | null>(null);
  const [redeemModalSelection, setRedeemModalSelection] = useState<RewardSelection | null>(null);

  const statusTier = status?.status_tier || 'none';
  const statusConfig = STATUS_CONFIG[statusTier as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.none;
  
  // Separate regular selections from give-back rewards
  const regularSelections = selections.filter(s => !s.reward?.is_giveback);
  const givebackSelections = selections.filter(s => s.reward?.is_giveback);
  
  // Calculate empty slots
  const emptySlots = Math.max(0, totalSlots - usedSlots);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              🥍 My GROUNDBALL Rewards
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your active reward selections
            </p>
          </div>
        </div>

        {/* Status Summary Card */}
        <Card className={cn('border-2', statusConfig.borderColor, statusConfig.bgColor)}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              {/* Status Badge */}
              <div className="flex items-center gap-4">
                <span className="text-4xl">{statusConfig.emoji}</span>
                <div>
                  <h2 className={cn('text-xl font-bold', statusConfig.color)}>
                    {statusConfig.label} Status
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {status?.groundball_locked || 0} GROUNDBALL Locked
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                {/* Selections */}
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center mb-1">
                    {Array.from({ length: totalSlots }).map((_, i) => (
                      <Circle 
                        key={i} 
                        className={cn(
                          'w-4 h-4',
                          i < usedSlots ? 'fill-emerald-500 text-emerald-500' : 'text-muted-foreground'
                        )} 
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {usedSlots} of {totalSlots} selections used
                  </p>
                </div>

                {/* Free Swaps */}
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{freeSwaps}</p>
                  <p className="text-sm text-muted-foreground">
                    Free swaps remaining
                  </p>
                </div>

                {/* Bonus Slots */}
                {(status?.bonus_selections || 0) > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-400">+{status?.bonus_selections}</p>
                    <p className="text-sm text-muted-foreground">
                      Bonus slots
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link to="/groundball/rewards">
                    <Plus className="w-4 h-4 mr-2" />
                    Browse Rewards
                  </Link>
                </Button>
                <Button variant="secondary">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get Bonus Slot
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Selections Grid */}
        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-500" />
            Your Active Selections ({regularSelections.length})
          </h3>

          {regularSelections.length === 0 && emptySlots === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  You haven't selected any rewards yet
                </p>
                <Button asChild>
                  <Link to="/groundball/rewards">Browse & Select Rewards</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Active Selection Cards */}
              {regularSelections.map((selection) => (
                <ActiveSelectionCard
                  key={selection.id}
                  selection={selection}
                  onSwap={() => setSwapModalSelection(selection)}
                  onRedeem={() => setRedeemModalSelection(selection)}
                />
              ))}

              {/* Empty Slot Cards */}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <EmptySlotCard key={`empty-${i}`} />
              ))}
            </div>
          )}
        </section>

        {/* Give-Back Section */}
        <section>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Heart className="w-5 h-5 text-emerald-500" />
            Your Give-Back Rewards
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            These don't use selection slots—give freely
          </p>

          {givebackSelections.length === 0 ? (
            <Card className="border-dashed border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="p-6 text-center">
                <Heart className="w-8 h-8 mx-auto mb-3 text-emerald-500" />
                <p className="text-muted-foreground mb-4">
                  Activate give-back rewards to multiply your impact
                </p>
                <Button asChild variant="outline" className="border-emerald-500/50 text-emerald-400">
                  <Link to="/groundball/rewards?filter=giveback">
                    Browse Give-Back Options
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {givebackSelections.map((selection) => (
                <GivebackSelectionCard
                  key={selection.id}
                  selection={selection}
                  onSwap={() => setSwapModalSelection(selection)}
                  onRedeem={() => setRedeemModalSelection(selection)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Swap Modal */}
      <SwapRewardModal
        open={!!swapModalSelection}
        onOpenChange={(open) => !open && setSwapModalSelection(null)}
        selection={swapModalSelection}
        reward={swapModalSelection?.reward || null}
        freeSwapsRemaining={freeSwaps}
        swapCost={SWAP_COST}
        onConfirm={(useFreeSwap) => {
          if (swapModalSelection) {
            swapReward.mutate({ 
              selectionId: swapModalSelection.id, 
              useFreeSwap 
            });
            setSwapModalSelection(null);
          }
        }}
        isLoading={swapReward.isPending}
      />

      {/* Redemption Modal */}
      {redeemModalSelection && (
        <RedemptionModal
          selection={redeemModalSelection}
          onClose={() => setRedeemModalSelection(null)}
        />
      )}
    </PageContainer>
  );
}

// Active Selection Card Component
function ActiveSelectionCard({ 
  selection, 
  onSwap, 
  onRedeem 
}: { 
  selection: RewardSelection; 
  onSwap: () => void;
  onRedeem: () => void;
}) {
  const reward = selection.reward;
  if (!reward) return null;

  const cadenceLabel = reward.cadence ? CADENCE_LABELS[reward.cadence] || reward.cadence : null;
  const redemptionStatus = getRedemptionStatus(selection, reward);

  return (
    <Card className="bg-slate-900/50 border-emerald-500/30 overflow-hidden">
      {/* Selected Badge */}
      <div className="bg-emerald-500/20 px-4 py-2 flex items-center gap-2">
        <Check className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-medium text-emerald-400">SELECTED</span>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span className="text-3xl">{reward.image_emoji || '🎁'}</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground leading-tight">
              {reward.title}
            </h4>
            {reward.sponsor && (
              <p className="text-sm text-muted-foreground mt-1">
                Sponsored by {reward.sponsor}
              </p>
            )}
          </div>
        </div>

        {/* Cadence */}
        {cadenceLabel && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{cadenceLabel}</span>
            {reward.cadence_description && (
              <span className="text-muted-foreground/70">• {reward.cadence_description}</span>
            )}
          </div>
        )}

        {/* Redemption Status */}
        <div className={cn(
          'p-3 rounded-lg',
          redemptionStatus.canRedeem ? 'bg-amber-500/10' : 'bg-muted/30'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {redemptionStatus.canRedeem ? (
                <Circle className="w-4 h-4 text-amber-400" />
              ) : (
                <Check className="w-4 h-4 text-emerald-400" />
              )}
              <span className={cn(
                'text-sm',
                redemptionStatus.canRedeem ? 'text-amber-400' : 'text-muted-foreground'
              )}>
                {redemptionStatus.label}
              </span>
            </div>
            {redemptionStatus.canRedeem && (
              <Button size="sm" onClick={onRedeem}>
                Redeem Now
              </Button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to={`/groundball/rewards/${reward.id}`}>
              <ExternalLink className="w-3 h-3 mr-1" />
              View Details
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={onSwap}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Swap Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Give-back Selection Card
function GivebackSelectionCard({ 
  selection, 
  onSwap,
  onRedeem 
}: { 
  selection: RewardSelection; 
  onSwap: () => void;
  onRedeem: () => void;
}) {
  const reward = selection.reward;
  if (!reward) return null;

  const cadenceLabel = reward.cadence ? CADENCE_LABELS[reward.cadence] || reward.cadence : null;

  return (
    <Card className="bg-emerald-500/5 border-emerald-500/30 overflow-hidden">
      {/* Give-back Badge */}
      <div className="bg-emerald-500/20 px-4 py-2 flex items-center gap-2">
        <Heart className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-medium text-emerald-400">GIVE-BACK ACTIVE</span>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span className="text-3xl">{reward.image_emoji || '💚'}</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground leading-tight">
              {reward.title}
            </h4>
            {reward.multiplier_text && (
              <Badge className="mt-1 bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                ✨ {reward.multiplier_text}
              </Badge>
            )}
          </div>
        </div>

        {/* Cadence */}
        {cadenceLabel && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{cadenceLabel}</span>
            {reward.cadence_description && (
              <span className="text-muted-foreground/70">• {reward.cadence_description}</span>
            )}
          </div>
        )}

        <p className="text-xs text-emerald-400/80">
          💚 Doesn't use a selection slot
        </p>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-emerald-500/20">
          <Button variant="outline" size="sm" className="flex-1 border-emerald-500/30" onClick={onRedeem}>
            Contribute
          </Button>
          <Button variant="ghost" size="sm" className="flex-1" onClick={onSwap}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Deactivate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty Slot Card
function EmptySlotCard() {
  return (
    <Card className="border-dashed border-muted bg-muted/10">
      <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
        <Circle className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground font-medium mb-1">Empty Slot</p>
        <p className="text-sm text-muted-foreground/70 mb-4">
          You have a selection remaining
        </p>
        <Button asChild size="sm">
          <Link to="/groundball/rewards">
            <Plus className="w-4 h-4 mr-1" />
            Browse & Select
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// Helper function to determine redemption status
function getRedemptionStatus(selection: RewardSelection, reward: GroundballReward) {
  const lastRedeemed = selection.last_redeemed_at ? new Date(selection.last_redeemed_at) : null;
  const now = new Date();
  const cadence = reward.cadence || 'one_time';

  // One-time rewards
  if (cadence === 'one_time') {
    if (selection.redemption_count > 0) {
      return { canRedeem: false, label: '✓ Claimed' };
    }
    return { canRedeem: true, label: 'Ready to claim' };
  }

  // Daily rewards - always available
  if (cadence === 'daily') {
    if (lastRedeemed && isSameDay(lastRedeemed, now)) {
      return { canRedeem: false, label: '✓ Redeemed today' };
    }
    return { canRedeem: true, label: 'Available today' };
  }

  // Monthly rewards
  if (cadence === 'monthly') {
    if (lastRedeemed && isSameMonth(lastRedeemed, now)) {
      return { canRedeem: false, label: '✓ Redeemed this month' };
    }
    return { canRedeem: true, label: 'This Month: Not yet redeemed' };
  }

  // Quarterly rewards
  if (cadence === 'quarterly') {
    if (lastRedeemed && isSameQuarter(lastRedeemed, now)) {
      return { canRedeem: false, label: '✓ Redeemed this quarter' };
    }
    return { canRedeem: true, label: 'This Quarter: Not yet redeemed' };
  }

  // Annual rewards
  if (cadence === 'annual') {
    if (lastRedeemed && isSameYear(lastRedeemed, now)) {
      return { canRedeem: false, label: '✓ Redeemed this year' };
    }
    return { canRedeem: true, label: 'This Year: Not yet redeemed' };
  }

  return { canRedeem: true, label: 'Available' };
}

// Date helper functions
function isSameDay(d1: Date, d2: Date): boolean {
  return d1.toDateString() === d2.toDateString();
}

function isSameMonth(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

function isSameQuarter(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && 
    Math.floor(d1.getMonth() / 3) === Math.floor(d2.getMonth() / 3);
}

function isSameYear(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear();
}
