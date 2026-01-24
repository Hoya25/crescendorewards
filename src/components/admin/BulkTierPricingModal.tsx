import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TierPricingEditor } from './TierPricingEditor';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { validateTierPricing, type ValidationResult } from '@/utils/tierPricingValidation';

interface TierPricing {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
  diamond: number;
}

interface BulkTierPricingModalProps {
  open: boolean;
  onClose: () => void;
  selectedRewardIds: string[];
  onSuccess: () => void;
}

export function BulkTierPricingModal({
  open,
  onClose,
  selectedRewardIds,
  onSuccess,
}: BulkTierPricingModalProps) {
  const [saving, setSaving] = useState(false);
  const [baseCost, setBaseCost] = useState(100);
  const [tierPricing, setTierPricing] = useState<TierPricing>({
    bronze: 100,
    silver: 80,
    gold: 60,
    platinum: 40,
    diamond: 20,
  });
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const handleSave = async () => {
    if (!validation?.isValid) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the tier pricing errors before saving.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Update all selected rewards with the tier pricing - cast to Json type
      const { error } = await supabase
        .from('rewards')
        .update({ 
          status_tier_claims_cost: tierPricing as unknown as Record<string, number>,
        })
        .in('id', selectedRewardIds);

      if (error) throw error;

      toast({
        title: 'Tier Pricing Applied',
        description: `Successfully updated tier pricing for ${selectedRewardIds.length} rewards.`,
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error applying bulk tier pricing:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply tier pricing.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearTierPricing = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('rewards')
        .update({ status_tier_claims_cost: null })
        .in('id', selectedRewardIds);

      if (error) throw error;

      toast({
        title: 'Tier Pricing Cleared',
        description: `Removed tier pricing from ${selectedRewardIds.length} rewards.`,
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error clearing tier pricing:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to clear tier pricing.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Set Tier Pricing</DialogTitle>
          <DialogDescription>
            Apply the same tier-based pricing to {selectedRewardIds.length} selected reward{selectedRewardIds.length !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info Banner */}
          <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">This will override existing tier pricing</p>
              <p className="text-muted-foreground">
                The tier pricing you set here will replace any existing tier pricing on the selected rewards.
                Each reward's base cost will remain unchanged.
              </p>
            </div>
          </div>

          {/* Selected Count */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {selectedRewardIds.length} Rewards Selected
            </Badge>
          </div>

          {/* Tier Pricing Editor */}
          <TierPricingEditor
            baseCost={baseCost}
            pricing={tierPricing}
            onChange={setTierPricing}
            onValidationChange={setValidation}
            showValidation={true}
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClearTierPricing}
            disabled={saving}
            className="text-destructive hover:text-destructive"
          >
            Clear Tier Pricing
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !validation?.isValid}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Apply to {selectedRewardIds.length} Rewards
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
