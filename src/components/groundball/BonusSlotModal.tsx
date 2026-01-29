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
import { Plus, Coins, Loader2, AlertCircle } from 'lucide-react';
import { BONUS_SLOT_COST } from '@/hooks/useGroundballStatus';

interface BonusSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSlots: number;
  bonusSlots: number;
  claimsBalance: number;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function BonusSlotModal({
  open,
  onOpenChange,
  currentSlots,
  bonusSlots,
  claimsBalance,
  onConfirm,
  isLoading,
}: BonusSlotModalProps) {
  const canAfford = claimsBalance >= BONUS_SLOT_COST;
  const newTotalSlots = currentSlots + 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-foreground">
            <Plus className="w-5 h-5 text-amber-400" />
            <span>Add Bonus Selection Slot</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Want another selection? Expand your rewards lineup.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Current Slots</span>
              <span className="font-semibold text-foreground">{currentSlots}</span>
            </div>
            {bonusSlots > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Bonus Slots Active</span>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  +{bonusSlots}
                </Badge>
              </div>
            )}
          </div>

          {/* Cost */}
          <div className={`p-4 rounded-lg border ${canAfford ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-destructive/10 border-destructive/30'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className={`w-5 h-5 ${canAfford ? 'text-emerald-400' : 'text-destructive'}`} />
                <span className="font-medium text-foreground">Cost</span>
              </div>
              <span className={`font-bold ${canAfford ? 'text-emerald-400' : 'text-destructive'}`}>
                {BONUS_SLOT_COST} Claims
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 text-sm">
              <span className="text-muted-foreground">Your Balance</span>
              <span className={canAfford ? 'text-muted-foreground' : 'text-destructive'}>
                {claimsBalance} Claims
              </span>
            </div>
          </div>

          {/* Insufficient Balance Warning */}
          {!canAfford && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Insufficient Claims</p>
                <p className="text-muted-foreground">
                  You need {BONUS_SLOT_COST - claimsBalance} more Claims to purchase a bonus slot.
                </p>
              </div>
            </div>
          )}

          {/* What You Get */}
          {canAfford && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-sm text-amber-400 font-medium mb-1">After purchase:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• You'll have <strong className="text-foreground">{newTotalSlots} total slots</strong></li>
                <li>• Bonus slot lasts for the current quarter</li>
                <li>• Select any additional reward you qualify for</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border"
          >
            Cancel
          </Button>
          {canAfford ? (
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Bonus Slot • {BONUS_SLOT_COST} Claims
                </>
              )}
            </Button>
          ) : (
            <Button asChild className="bg-primary hover:bg-primary/90">
              <a href="/buy-claims">Get More Claims</a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BonusSlotModal;
