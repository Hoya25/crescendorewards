import { Lock, ShoppingBag, RotateCcw, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bounty, BountyClaim, hasCompletedInPeriod, getPeriodResetLabel } from '@/hooks/useBounties';
import { StatusTier } from '@/contexts/UnifiedUserContext';
import { useNavigate } from 'react-router-dom';

interface BountyCardProps {
  bounty: Bounty;
  userTier: StatusTier | null;
  total360Locked: number;
  nextTier: StatusTier | null;
  claims: BountyClaim[];
  hasMerchEligibility: boolean;
  onClaim: (bounty: Bounty) => void;
}

const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

const TIER_TAG_CONFIG: Record<string, { label: string; className: string }> = {
  merch_tier1: { label: 'TIER 1 • ALL MEMBERS', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  merch_tier2: { label: 'TIER 2 • SILVER+', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  merch_tier3: { label: 'TIER 3 • GOLD+', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  merch_recurring: { label: 'RECURRING', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  general: { label: 'GENERAL', className: 'bg-muted text-muted-foreground border-border' },
};

function isTierSufficient(userTierName: string | undefined, requiredTier: string | null): boolean {
  if (!requiredTier) return true;
  if (!userTierName) return false;
  return TIER_ORDER.indexOf(userTierName.toLowerCase()) >= TIER_ORDER.indexOf(requiredTier.toLowerCase());
}

export function BountyCard({ bounty, userTier, total360Locked, nextTier, claims, hasMerchEligibility, onClaim }: BountyCardProps) {
  const navigate = useNavigate();
  const userTierName = userTier?.tier_name;
  const meetsStatus = isTierSufficient(userTierName, bounty.min_status_required);
  const needsPurchase = bounty.requires_purchase && !hasMerchEligibility;

  const isRecurringCompleted = bounty.is_recurring && hasCompletedInPeriod(claims, bounty.id, bounty.recurrence_period);
  const isLocked = !meetsStatus || needsPurchase;
  const baseReward = bounty.nctr_reward;
  const multipliedReward = bounty.requires_360lock ? baseReward * bounty.lock_multiplier : baseReward;

  const tierTag = TIER_TAG_CONFIG[bounty.bounty_tier] || TIER_TAG_CONFIG.general;

  // Calculate NCTR needed for required tier
  const requiredTierObj = bounty.min_status_required;
  const nctrAwayFromRequired = (() => {
    if (!requiredTierObj || meetsStatus) return null;
    // We don't have exact tier thresholds here, use nextTier as approximation
    if (nextTier && nextTier.tier_name?.toLowerCase() === requiredTierObj.toLowerCase()) {
      return Math.max(0, nextTier.min_nctr_360_locked - total360Locked);
    }
    return null;
  })();

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 border ${
      isLocked ? 'opacity-70 border-border' : 'border-border hover:border-primary/40 hover:shadow-lg'
    }`}>
      <CardContent className="p-0">
        {/* Image / Emoji header */}
        <div className="relative h-32 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          {bounty.image_url ? (
            <img src={bounty.image_url} alt={bounty.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl">{bounty.image_emoji || '🎯'}</span>
          )}

          {/* Tier tag */}
          <Badge variant="outline" className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider ${tierTag.className}`}>
            {tierTag.label}
          </Badge>

          {/* 360LOCK badge */}
          {bounty.requires_360lock && (
            <Badge className="absolute top-2 right-2 bg-lime-500/90 text-lime-950 text-[10px] font-bold border-0 gap-1">
              <Lock className="h-3 w-3" /> 360LOCK REQUIRED
            </Badge>
          )}
        </div>

        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-foreground leading-tight">{bounty.title}</h3>
          {bounty.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{bounty.description}</p>
          )}

          {/* Reward display */}
          <div className="flex items-baseline gap-2">
            {bounty.requires_360lock ? (
              <>
                <span className="text-xs text-muted-foreground line-through">Base: {baseReward} NCTR</span>
                <span className="text-lg font-bold text-lime-500">
                  {multipliedReward.toLocaleString()} NCTR
                </span>
                <Badge variant="outline" className="text-[10px] border-lime-500/30 text-lime-500">
                  {bounty.lock_multiplier}x
                </Badge>
              </>
            ) : (
              <span className="text-lg font-bold text-foreground">{baseReward.toLocaleString()} NCTR</span>
            )}
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-1.5">
            {bounty.requires_purchase && (
              <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/30 gap-1">
                <ShoppingBag className="h-3 w-3" /> Purchase Required
              </Badge>
            )}
            {bounty.is_recurring && (
              <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30 gap-1">
                <RotateCcw className="h-3 w-3" /> {bounty.recurrence_period}
              </Badge>
            )}
          </div>

          {/* Status gating message */}
          {!meetsStatus && bounty.min_status_required && (
            <div className="rounded-lg bg-muted/50 p-2.5 space-y-1">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                🔒 {bounty.min_status_required.charAt(0).toUpperCase() + bounty.min_status_required.slice(1)} Status Required
              </p>
              {nctrAwayFromRequired !== null && (
                <p className="text-[10px] text-muted-foreground">
                  You are {nctrAwayFromRequired.toLocaleString()} NCTR away from {bounty.min_status_required}. Keep completing bounties with 360LOCK to level up.
                </p>
              )}
            </div>
          )}

          {/* Purchase required message */}
          {needsPurchase && meetsStatus && (
            <div className="rounded-lg bg-orange-500/5 p-2.5">
              <p className="text-xs text-orange-400">
                Buy NCTR merch to unlock this bounty
              </p>
              <a
                href="https://nctr-merch.myshopify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-orange-400 underline flex items-center gap-1 mt-1"
              >
                Shop NCTR Merch <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Recurring completed message */}
          {isRecurringCompleted && (
            <div className="rounded-lg bg-emerald-500/10 p-2.5">
              <p className="text-xs text-emerald-400">
                ✅ Completed this {bounty.recurrence_period === 'weekly' ? 'week' : bounty.recurrence_period === 'daily' ? 'period' : 'month'}.{' '}
                {getPeriodResetLabel(bounty.recurrence_period)}
              </p>
            </div>
          )}

          {/* CTA */}
          {!meetsStatus ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => navigate('/membership')}
            >
              🔒 Reach {bounty.min_status_required?.charAt(0).toUpperCase()}{bounty.min_status_required?.slice(1)} to Unlock
            </Button>
          ) : needsPurchase ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-orange-400 border-orange-500/30"
              asChild
            >
              <a href="https://nctr-merch.myshopify.com" target="_blank" rel="noopener noreferrer">
                Buy NCTR Merch to Unlock
              </a>
            </Button>
          ) : isRecurringCompleted ? (
            <Button variant="outline" size="sm" className="w-full" disabled>
              Completed — {getPeriodResetLabel(bounty.recurrence_period)}
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full bg-lime-500 hover:bg-lime-600 text-lime-950 font-semibold"
              onClick={() => onClaim(bounty)}
            >
              {bounty.cta_text || 'Claim This Bounty'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
