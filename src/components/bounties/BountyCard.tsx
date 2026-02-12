import { Lock, ShoppingBag, RotateCcw, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bounty, BountyClaim, hasCompletedInPeriod, getPeriodResetLabel } from '@/hooks/useBounties';
import { StatusTier } from '@/contexts/UnifiedUserContext';
import { useNavigate } from 'react-router-dom';
import { calculateReward, DEFAULT_EARNING_MULTIPLIERS } from '@/utils/calculateReward';
import { FirstBountyTooltip } from './FirstBountyTooltip';

interface BountyCardProps {
  bounty: Bounty;
  userTier: StatusTier | null;
  total360Locked: number;
  nextTier: StatusTier | null;
  claims: BountyClaim[];
  hasMerchEligibility: boolean;
  onClaim: (bounty: Bounty) => void;
  isFirstAvailable?: boolean;
  hasCompletedAny?: boolean;
}

const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

function isTierSufficient(userTierName: string | undefined, requiredTier: string | null): boolean {
  if (!requiredTier) return true;
  if (!userTierName) return false;
  return TIER_ORDER.indexOf(userTierName.toLowerCase()) >= TIER_ORDER.indexOf(requiredTier.toLowerCase());
}

// Difficulty heuristic based on reward amount
function getDifficulty(reward: number): { label: string; color: string } {
  if (reward <= 200) return { label: 'Easy', color: '#4CAF50' };
  if (reward <= 500) return { label: 'Medium', color: '#FF9800' };
  return { label: 'Hard', color: '#F44336' };
}

export function BountyCard({ bounty, userTier, total360Locked, nextTier, claims, hasMerchEligibility, onClaim, isFirstAvailable, hasCompletedAny }: BountyCardProps) {
  const navigate = useNavigate();
  const userTierName = userTier?.tier_name;
  const meetsStatus = isTierSufficient(userTierName, bounty.min_status_required);
  const needsPurchase = bounty.requires_purchase && !hasMerchEligibility;
  const isRecurringCompleted = bounty.is_recurring && hasCompletedInPeriod(claims, bounty.id, bounty.recurrence_period);
  const isLocked = !meetsStatus || needsPurchase;

  const tierName = (userTierName || 'bronze').toLowerCase();
  const statusMultiplier = (userTier as any)?.earning_multiplier ?? DEFAULT_EARNING_MULTIPLIERS[tierName] ?? 1;
  const isMerchBounty = bounty.bounty_tier?.startsWith('merch_') || bounty.requires_360lock;

  const calc = calculateReward(bounty.nctr_reward, {
    statusMultiplier,
    tierName,
    isMerch: isMerchBounty,
    is360Lock: bounty.requires_360lock,
  });

  const baseReward = bounty.nctr_reward;
  const lockReward = Math.round(baseReward * statusMultiplier * 3);
  const difficulty = getDifficulty(baseReward);

  // Status requirement badge config
  const statusBadge = (() => {
    if (!bounty.min_status_required) return { label: 'All Members', bg: '#4CAF5020', color: '#4CAF50', border: '#4CAF5040' };
    const tier = bounty.min_status_required.toLowerCase();
    const colors: Record<string, { color: string }> = {
      bronze: { color: '#CD7F32' },
      silver: { color: '#C0C0C0' },
      gold: { color: '#FFD700' },
      platinum: { color: '#E5E4E2' },
      diamond: { color: '#B9F2FF' },
    };
    const c = colors[tier] || colors.bronze;
    return {
      label: `${tier.charAt(0).toUpperCase() + tier.slice(1)}+ Required`,
      bg: c.color + '20',
      color: c.color,
      border: c.color + '40',
    };
  })();

  const showFirstBountyTooltip = isFirstAvailable && !hasCompletedAny;

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 border ${
      isLocked ? 'opacity-60 border-border' : 'border-border hover:border-accent-lime/40 hover:shadow-lg hover:-translate-y-0.5'
    }`}>
      {showFirstBountyTooltip && <FirstBountyTooltip show />}
      {showFirstBountyTooltip && (
        <div className="absolute inset-0 rounded-lg pointer-events-none z-10 animate-pulse"
             style={{ boxShadow: '0 0 0 2px hsl(var(--accent-lime))' }} />
      )}
      <CardContent className="p-0">
        {/* Image header */}
        <div className="relative h-28 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          {bounty.image_url ? (
            <img src={bounty.image_url} alt={bounty.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">{bounty.image_emoji || '🎯'}</span>
          )}

          {/* Lock overlay for gated bounties */}
          {isLocked && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center">
                <Lock className="h-6 w-6 text-white/80 mx-auto mb-1" />
                <p className="text-[10px] text-white/80 font-medium">
                  Reach {bounty.min_status_required?.charAt(0).toUpperCase()}{bounty.min_status_required?.slice(1)} to Unlock
                </p>
              </div>
            </div>
          )}

          {/* Top badges row */}
          <div className="absolute top-2 left-2 flex gap-1.5">
            <Badge variant="outline" className="text-[10px] font-bold border-0 px-1.5 py-0.5"
                   style={{ backgroundColor: statusBadge.bg, color: statusBadge.color, borderColor: statusBadge.border }}>
              {statusBadge.label}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-bold border-0 px-1.5 py-0.5"
                   style={{ backgroundColor: difficulty.color + '20', color: difficulty.color, borderColor: difficulty.color + '40' }}>
              {difficulty.label}
            </Badge>
          </div>

          {bounty.requires_360lock && (
            <Badge className="absolute top-2 right-2 text-[10px] font-bold border-0 gap-0.5 px-1.5 py-0.5"
                   style={{ backgroundColor: 'hsl(var(--accent-lime))', color: '#1A1A2E' }}>
              <Lock className="h-3 w-3" /> 360LOCK
            </Badge>
          )}
        </div>

        <div className="p-3 space-y-2.5">
          <h3 className="font-bold text-sm text-foreground leading-tight">{bounty.title}</h3>
          {bounty.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{bounty.description}</p>
          )}

          {/* Reward display — base + 360LOCK math */}
          <div className="rounded-lg bg-muted/50 p-2.5 space-y-1">
            <p className="text-xs text-muted-foreground">Base: {baseReward.toLocaleString()} NCTR</p>
            <p className="text-base font-bold" style={{ color: 'hsl(var(--accent-lime))' }}>
              With 360LOCK: {lockReward.toLocaleString()} NCTR
            </p>
          </div>

          {/* Status tags row */}
          <div className="flex flex-wrap gap-1.5">
            {bounty.requires_purchase && (
              <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/30 gap-1">
                <ShoppingBag className="h-3 w-3" /> Requires NCTR Merch Purchase
              </Badge>
            )}
            {bounty.is_recurring && (
              <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30 gap-1">
                <RotateCcw className="h-3 w-3" /> {bounty.recurrence_period === 'weekly' ? 'Weekly' : bounty.recurrence_period === 'monthly' ? 'Monthly' : bounty.recurrence_period}
              </Badge>
            )}
          </div>

          {/* Purchase required message */}
          {needsPurchase && meetsStatus && (
            <div className="rounded-lg bg-orange-500/5 p-2.5">
              <p className="text-xs text-orange-400">Buy NCTR merch to unlock this bounty</p>
              <a href="https://nctr-merch.myshopify.com" target="_blank" rel="noopener noreferrer"
                 className="text-[10px] text-orange-400 underline flex items-center gap-1 mt-1">
                Shop NCTR Merch <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Recurring completed */}
          {isRecurringCompleted && (
            <div className="rounded-lg bg-emerald-500/10 p-2.5">
              <p className="text-xs text-emerald-400">
                ✅ Completed this {bounty.recurrence_period === 'weekly' ? 'week' : bounty.recurrence_period === 'monthly' ? 'month' : 'period'}.{' '}
                {getPeriodResetLabel(bounty.recurrence_period)}
              </p>
            </div>
          )}

          {/* CTA */}
          {isLocked ? (
            <Button variant="outline" size="sm" className="w-full text-muted-foreground"
                    onClick={() => navigate('/membership')}>
              🔒 Reach {bounty.min_status_required?.charAt(0).toUpperCase()}{bounty.min_status_required?.slice(1)} to Unlock
            </Button>
          ) : isRecurringCompleted ? (
            <Button variant="outline" size="sm" className="w-full" disabled>
              Completed — {getPeriodResetLabel(bounty.recurrence_period)}
            </Button>
          ) : (
            <Button size="sm" className="w-full font-semibold"
                    style={{ backgroundColor: 'hsl(var(--accent-lime))', color: '#1A1A2E' }}
                    onClick={() => onClaim(bounty)}>
              {bounty.cta_text || 'Claim Bounty'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
