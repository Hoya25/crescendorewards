import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Check, Clock, ExternalLink } from 'lucide-react';
import { AlliancePartner } from './PartnerBenefitCard';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { addDays } from 'date-fns';

interface ActivateBenefitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: AlliancePartner | null;
  userId: string;
  availableSlots: number;
  totalSlots: number;
  onSuccess: () => void;
}

export function ActivateBenefitModal({
  open,
  onOpenChange,
  partner,
  userId,
  availableSlots,
  totalSlots,
  onSuccess
}: ActivateBenefitModalProps) {
  const [activating, setActivating] = useState(false);
  const { toast } = useToast();

  if (!partner) return null;

  const hasEnoughSlots = availableSlots >= partner.slot_cost;

  const handleActivate = async () => {
    if (!hasEnoughSlots) return;

    setActivating(true);
    try {
      // Create the activation record
      const { error } = await supabase
        .from('member_active_benefits')
        .insert({
          user_id: userId,
          partner_id: partner.id,
          status: partner.activation_type === 'code' ? 'active' : 'pending',
          activated_at: new Date().toISOString(),
          can_swap_after: addDays(new Date(), 30).toISOString(),
          slots_used: partner.slot_cost,
        });

      if (error) throw error;

      // Log the activation
      await supabase
        .from('benefit_activation_history')
        .insert({
          user_id: userId,
          partner_id: partner.id,
          action: 'activated',
        });

      // Update partner total activations
      await supabase
        .from('alliance_partners')
        .update({ total_activations: partner.total_activations + 1 })
        .eq('id', partner.id);

      toast({
        title: 'Benefit Activated!',
        description: partner.activation_type === 'code' 
          ? 'Check your active benefits for redemption details.'
          : 'Your benefit is pending activation. Check back soon!',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Activation error:', error);
      toast({
        title: 'Activation Failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActivating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {/* Partner logo */}
            <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {partner.logo_url ? (
                <img 
                  src={partner.logo_url} 
                  alt={partner.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">
                  {partner.name.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <DialogTitle>{partner.name}</DialogTitle>
              <DialogDescription>{partner.benefit_title}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Slot usage info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm">This will use</span>
            <Badge variant="secondary">
              {partner.slot_cost} of {totalSlots} benefit slots
            </Badge>
          </div>

          {/* What you get */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              What you get
            </h4>
            <p className="text-sm text-muted-foreground pl-6">
              {partner.benefit_description}
            </p>
            <div className="pl-6">
              <Badge variant="outline">${partner.monthly_value}/mo value</Badge>
            </div>
          </div>

          {/* How to activate */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-primary" />
              How to activate
            </h4>
            <p className="text-sm text-muted-foreground pl-6">
              {partner.activation_instructions || 'Activation details will be provided after confirmation.'}
            </p>
          </div>

          {/* 30-day hold warning */}
          <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-900/20">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
              Benefits have a <strong>30-day minimum hold</strong> before you can swap them for different benefits.
            </AlertDescription>
          </Alert>

          {/* Not enough slots warning */}
          {!hasEnoughSlots && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                You don't have enough available slots. You have {availableSlots} available, but this benefit requires {partner.slot_cost}.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleActivate}
            disabled={activating || !hasEnoughSlots}
          >
            {activating ? 'Activating...' : 'Activate Benefit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
