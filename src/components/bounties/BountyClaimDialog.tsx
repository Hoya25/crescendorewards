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
import { Badge } from '@/components/ui/badge';
import { Bounty } from '@/hooks/useBounties';
import { StatusTier } from '@/contexts/UnifiedUserContext';

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

  const multipliedReward = bounty.requires_360lock
    ? bounty.nctr_reward * bounty.lock_multiplier
    : bounty.nctr_reward;

  const newBalance = total360Locked + multipliedReward;
  const nctrToNext = nextTier ? Math.max(0, nextTier.min_nctr_360_locked - newBalance) : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {bounty.image_emoji || '🎯'} {bounty.title}
          </DialogTitle>
          <DialogDescription className="text-left space-y-3 pt-2">
            {bounty.requires_360lock ? (
              <div className="rounded-lg bg-lime-500/10 border border-lime-500/20 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-lime-500" />
                  <span className="text-sm font-medium text-lime-500">360LOCK Commitment Required</span>
                </div>
                <p className="text-sm text-foreground">
                  You will earn <span className="font-bold text-lime-500">{multipliedReward.toLocaleString()} NCTR</span>{' '}
                  ({bounty.lock_multiplier}x multiplier), locked for 360 days.
                </p>
                <p className="text-xs text-muted-foreground">
                  This NCTR counts toward your Crescendo status.
                </p>
              </div>
            ) : (
              <p className="text-sm">
                You will earn <span className="font-bold">{bounty.nctr_reward.toLocaleString()} NCTR</span>.
              </p>
            )}

            {/* Post-claim preview */}
            <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                After completion:
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your total 360LOCKed NCTR:</span>
                <span className="font-semibold text-foreground">{newBalance.toLocaleString()}</span>
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
          <Button variant="outline" onClick={onClose} disabled={claiming}>
            Cancel
          </Button>
          <Button
            className="bg-lime-500 hover:bg-lime-600 text-lime-950 font-semibold"
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
