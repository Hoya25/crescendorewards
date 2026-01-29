import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, Coins } from 'lucide-react';
import type { GroundballReward, RewardSelection } from '@/hooks/useGroundballStatus';

interface SwapRewardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selection: RewardSelection | null;
  reward: GroundballReward | null;
  freeSwapsRemaining: number;
  swapCost: number;
  onConfirm: (useFreeSwap: boolean) => void;
  isLoading?: boolean;
}

export function SwapRewardModal({
  open,
  onOpenChange,
  selection,
  reward,
  freeSwapsRemaining,
  swapCost,
  onConfirm,
  isLoading,
}: SwapRewardModalProps) {
  if (!selection || !reward) return null;

  const hasFreeSwap = freeSwapsRemaining > 0;
  const isGiveback = reward.is_giveback;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-white">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            <span>Swap Out Reward</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Remove "{reward.title}" from your selections
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Selection */}
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center gap-3">
            <span className="text-3xl">{reward.image_emoji || '🎁'}</span>
            <div>
              <p className="font-medium text-white">{reward.title}</p>
              {reward.sponsor && (
                <p className="text-xs text-slate-400">by {reward.sponsor}</p>
              )}
            </div>
          </div>

          {/* Swap Cost Information */}
          {isGiveback ? (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <p className="text-sm text-emerald-400">
                💚 Give-back rewards can be deactivated anytime at no cost
              </p>
            </div>
          ) : hasFreeSwap ? (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <p className="text-sm text-emerald-400">
                ✓ You have {freeSwapsRemaining} free swap{freeSwapsRemaining > 1 ? 's' : ''} this quarter
              </p>
              <p className="text-xs text-slate-400 mt-1">
                This swap won't cost any Claims
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-400">
                <Coins className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Use {swapCost} Claims for this swap?
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                You've used all free swaps this quarter
              </p>
            </div>
          )}

          {/* What happens next */}
          <div className="text-sm text-slate-400">
            <p>After swapping:</p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
              <li>This reward will be removed from your selections</li>
              {!isGiveback && <li>You'll have a slot available for a new selection</li>}
              <li>You can select a different reward from the catalog</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(hasFreeSwap || isGiveback)}
            disabled={isLoading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isLoading ? (
              'Processing...'
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-1" />
                {isGiveback 
                  ? 'Deactivate' 
                  : hasFreeSwap 
                    ? 'Use Free Swap' 
                    : `Swap for ${swapCost} Claims`
                }
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SwapRewardModal;
