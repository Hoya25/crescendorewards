import { Lock, ArrowRight, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bounty } from '@/hooks/useBounties';
import { StatusTier } from '@/contexts/UnifiedUserContext';
import { DEFAULT_EARNING_MULTIPLIERS } from '@/utils/calculateReward';

interface BountyClaimDialogProps {
  bounty: Bounty | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  claiming: boolean;
  total360Locked: number;
  currentTier: StatusTier | null;
  nextTier: StatusTier | null;
}

export function BountyClaimDialog({
  bounty,
  open,
  onClose,
  onConfirm,
  claiming,
  total360Locked,
  currentTier,
  nextTier,
}: BountyClaimDialogProps) {
  if (!bounty) return null;

  const tierName = (currentTier?.tier_name || 'bronze').toLowerCase();
  const statusMult = (currentTier as any)?.earning_multiplier ?? DEFAULT_EARNING_MULTIPLIERS[tierName] ?? 1;
  const isMerch = bounty.requires_360lock;
  const lockMult = isMerch ? bounty.lock_multiplier : 1;

  const finalAmount = Math.round(bounty.nctr_reward * statusMult * lockMult);
  const newBalance = total360Locked + finalAmount;
  const nctrToNext = nextTier ? Math.max(0, nextTier.min_nctr_360_locked - newBalance) : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {bounty.image_emoji || '🎯'} {bounty.title}
          </DialogTitle>
          <DialogDescription className="text-left space-y-3 pt-2">
            {isMerch ? (
              <div className="rounded-lg bg-accent-lime/10 border border-accent-lime/20 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-accent-lime" />
                  <span className="text-sm font-medium text-accent-lime">360LOCK Commitment</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-foreground">You're earning <span className="font-bold text-accent-lime">{finalAmount.toLocaleString()} NCTR</span></p>
                  <p className="text-xs text-muted-foreground">
                    = {bounty.nctr_reward} × {statusMult}x ({tierName.charAt(0).toUpperCase() + tierName.slice(1)}) × {lockMult}x (360LOCK)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Locked for 360 days. Counts toward your Crescendo status.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm">
                You will earn <span className="font-bold">{finalAmount.toLocaleString()} NCTR</span>
                {statusMult > 1 && <span className="text-xs text-muted-foreground"> ({bounty.nctr_reward} × {statusMult}x {tierName})</span>}
              </p>
            )}

            <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" /> After completion:
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total 360LOCKed NCTR:</span>
                <span className="font-semibold">{newBalance.toLocaleString()}</span>
              </div>
              {currentTier && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current status:</span>
                  <span>{currentTier.badge_emoji} {currentTier.display_name}</span>
                </div>
              )}
              {nextTier && nctrToNext !== null && nctrToNext > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                  <ArrowRight className="h-3 w-3" />
                  {nctrToNext.toLocaleString()} NCTR away from {nextTier.badge_emoji} {nextTier.display_name}
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={claiming}>Cancel</Button>
          <Button
            className="bg-accent-lime hover:bg-accent-lime/90 text-black font-semibold"
            onClick={onConfirm}
            disabled={claiming}
          >
            {claiming ? 'Claiming…' : 'Confirm & Earn'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
