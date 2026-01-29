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
import { Heart, Check } from 'lucide-react';
import type { GroundballReward } from '@/hooks/useGroundballStatus';

interface SelectRewardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reward: GroundballReward | null;
  usedSlots: number;
  totalSlots: number;
  onConfirm: () => void;
  isLoading?: boolean;
}

const CADENCE_EXPLANATIONS: Record<string, string> = {
  daily: "You'll have ongoing access while this is selected",
  monthly: "You'll get 1 per month while this is selected",
  quarterly: "You'll get 1 per quarter while this is selected",
  annual: "You'll get 1 per year while this is selected",
  one_time: "This is a one-time reward you can claim once",
};

export function SelectRewardModal({
  open,
  onOpenChange,
  reward,
  usedSlots,
  totalSlots,
  onConfirm,
  isLoading,
}: SelectRewardModalProps) {
  if (!reward) return null;

  const isGiveback = reward.is_giveback;
  const newUsedSlots = isGiveback ? usedSlots : usedSlots + 1;
  const cadenceExplanation = reward.cadence 
    ? CADENCE_EXPLANATIONS[reward.cadence] || reward.cadence_description 
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-3xl">{reward.image_emoji || '🎁'}</span>
            <span className="text-white">{reward.title}</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {reward.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cadence Explanation */}
          {cadenceExplanation && (
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-sm text-slate-300">
                📅 {cadenceExplanation}
              </p>
              {reward.cadence_description && (
                <p className="text-xs text-slate-400 mt-1">
                  {reward.cadence_description}
                </p>
              )}
            </div>
          )}

          {/* Slot Impact */}
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            {isGiveback ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <Heart className="w-4 h-4" />
                <span className="text-sm">
                  This is a Give-Back reward and won't use a slot
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-slate-300">
                  This will use <strong>{newUsedSlots}</strong> of your <strong>{totalSlots}</strong> slots
                </p>
                <div className="flex gap-1">
                  {Array.from({ length: totalSlots }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full ${
                        i < newUsedSlots
                          ? 'bg-emerald-500'
                          : 'bg-slate-600 border border-slate-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sponsor */}
          {reward.sponsor && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Sponsored by</span>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                {reward.sponsor}
              </Badge>
            </div>
          )}

          {/* Multiplier */}
          {isGiveback && reward.multiplier_text && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              ✨ {reward.multiplier_text}
            </Badge>
          )}
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
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? (
              'Confirming...'
            ) : (
              <>
                <Check className="w-4 h-4 mr-1" />
                Confirm Selection
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SelectRewardModal;
