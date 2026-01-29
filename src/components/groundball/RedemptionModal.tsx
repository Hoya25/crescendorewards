import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, Check, Gift, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { RewardSelection, GroundballReward } from '@/hooks/useGroundballStatus';

interface RedemptionModalProps {
  selection: RewardSelection;
  onClose: () => void;
}

const CADENCE_LABELS: Record<string, string> = {
  daily: 'Daily',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
  one_time: 'One-Time',
};

const CADENCE_DESCRIPTIONS: Record<string, string> = {
  daily: 'You can redeem this reward once per day',
  monthly: 'You can redeem this reward once per month',
  quarterly: 'You can redeem this reward once per quarter',
  annual: 'You can redeem this reward once per year',
  one_time: 'This is a one-time reward that can only be claimed once',
};

export function RedemptionModal({ selection, onClose }: RedemptionModalProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  
  const reward = selection.reward;
  if (!reward) return null;

  const cadence = reward.cadence || 'one_time';
  const cadenceLabel = CADENCE_LABELS[cadence] || cadence;
  const cadenceDesc = CADENCE_DESCRIPTIONS[cadence] || '';
  const isGiveback = reward.is_giveback;

  const redeemMutation = useMutation({
    mutationFn: async () => {
      // Insert redemption record
      const { error: insertError } = await supabase
        .from('reward_redemptions')
        .insert({
          member_id: selection.member_id,
          reward_id: selection.reward_id,
          selection_id: selection.id,
          period: getCurrentPeriod(cadence),
          notes: notes || null,
        });

      if (insertError) throw insertError;

      // Update selection with last_redeemed_at and increment count
      const { error: updateError } = await supabase
        .from('member_reward_selections')
        .update({
          last_redeemed_at: new Date().toISOString(),
          redemption_count: (selection.redemption_count || 0) + 1,
        })
        .eq('id', selection.id);

      if (updateError) throw updateError;

      return { reward };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groundball-selections'] });
      toast.success(`${reward.title} redeemed successfully!`);
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Failed to redeem: ${error.message}`);
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isGiveback ? (
              <>💚 Contribute</>
            ) : (
              <>
                <Gift className="w-5 h-5 text-emerald-500" />
                Redeem Reward
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isGiveback 
              ? 'Activate your give-back contribution'
              : 'Confirm your reward redemption'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reward Info */}
          <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
            <span className="text-3xl">{reward.image_emoji || '🎁'}</span>
            <div className="flex-1">
              <h4 className="font-semibold">{reward.title}</h4>
              {reward.sponsor && (
                <p className="text-sm text-muted-foreground">
                  Sponsored by {reward.sponsor}
                </p>
              )}
              {reward.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {reward.description}
                </p>
              )}
            </div>
          </div>

          {/* Cadence Info */}
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg">
            <Calendar className="w-4 h-4 text-amber-400" />
            <div>
              <Badge variant="outline" className="text-amber-400 border-amber-500/30">
                {cadenceLabel}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                {cadenceDesc}
              </p>
            </div>
          </div>

          {/* Redemption Details */}
          {!isGiveback && (
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this redemption..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          )}

          {/* Give-back specific content */}
          {isGiveback && reward.multiplier_text && (
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <p className="text-sm text-emerald-400 flex items-center gap-2">
                ✨ {reward.multiplier_text}
              </p>
            </div>
          )}

          {/* Redemption count */}
          {selection.redemption_count > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              You've redeemed this {selection.redemption_count} time{selection.redemption_count > 1 ? 's' : ''} previously
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => redeemMutation.mutate()}
            disabled={redeemMutation.isPending}
            className={isGiveback ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            {redeemMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {isGiveback ? 'Confirm Contribution' : 'Confirm Redemption'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper to get current period string based on cadence
function getCurrentPeriod(cadence: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  const day = now.getDate();

  switch (cadence) {
    case 'daily':
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    case 'monthly':
      return `${year}-${String(month).padStart(2, '0')}`;
    case 'quarterly':
      return `${year}-Q${quarter}`;
    case 'annual':
      return `${year}`;
    case 'one_time':
    default:
      return 'one_time';
  }
}

export default RedemptionModal;
