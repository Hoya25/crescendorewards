import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Check, ExternalLink } from 'lucide-react';
import { AlliancePartner } from './PartnerBenefitCard';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { addDays } from 'date-fns';
import { PLATFORM_COLORS, PLATFORM_NAMES } from '@/utils/creatorPlatforms';

interface ActivateBenefitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: AlliancePartner | null;
  userId: string;
  availableSlots: number;
  totalSlots: number;
  onSuccess: () => void;
}

const PLATFORM_URL_PATTERNS: Record<string, string> = {
  twitch: 'twitch.tv',
  youtube: 'youtube.com',
  patreon: 'patreon.com',
  substack: 'substack.com',
};

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
  const [creatorName, setCreatorName] = useState('');
  const [creatorUrl, setCreatorUrl] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const { toast } = useToast();

  if (!partner) return null;

  const hasEnoughSlots = availableSlots >= partner.slot_cost;
  const isCreatorSub = partner.is_creator_subscription;
  const fixedPlatform = partner.creator_platform;
  const effectivePlatform = fixedPlatform || selectedPlatform;
  const platformColor = effectivePlatform ? PLATFORM_COLORS[effectivePlatform as keyof typeof PLATFORM_COLORS] : undefined;
  const platformName = effectivePlatform ? PLATFORM_NAMES[effectivePlatform as keyof typeof PLATFORM_NAMES] : 'Any Platform';

  const validateUrl = (url: string, platform: string): boolean => {
    if (!platform || !url) return true;
    const pattern = PLATFORM_URL_PATTERNS[platform];
    return pattern ? url.toLowerCase().includes(pattern) : true;
  };

  const isValidCreatorInput = () => {
    if (!isCreatorSub) return true;
    if (!creatorName.trim()) return false;
    if (!creatorUrl.trim()) return false;
    if (!fixedPlatform && !selectedPlatform) return false;
    return validateUrl(creatorUrl, effectivePlatform);
  };

  const handleActivate = async () => {
    if (!hasEnoughSlots) return;
    if (isCreatorSub && !isValidCreatorInput()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all creator details.',
        variant: 'destructive',
      });
      return;
    }

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
          selected_creator_name: isCreatorSub ? creatorName.trim() : null,
          selected_creator_url: isCreatorSub ? creatorUrl.trim() : null,
          selected_creator_platform: isCreatorSub ? effectivePlatform : null,
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

      const successMessage = isCreatorSub
        ? `We'll set up your subscription to ${creatorName} within 48 hours.`
        : partner.activation_type === 'code' 
          ? 'Check your active benefits for redemption details.'
          : 'Your benefit is pending activation. Check back soon!';

      toast({
        title: 'Benefit Activated!',
        description: successMessage,
      });

      // Reset form
      setCreatorName('');
      setCreatorUrl('');
      setSelectedPlatform('');
      
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Activation error:', error);
      toast({
        title: 'Activation Failed',
        description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActivating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
              <div className="flex items-center gap-2">
                <DialogTitle>{partner.name}</DialogTitle>
                {isCreatorSub && (
                  <Badge 
                    className="text-white text-[10px]"
                    style={{ backgroundColor: platformColor || '#6b7280' }}
                  >
                    {platformName}
                  </Badge>
                )}
              </div>
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

          {/* Creator Selection for creator subscriptions */}
          {isCreatorSub && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm">Choose Your Creator</h4>
              
              {/* Platform selector if not fixed */}
              {!fixedPlatform && (
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twitch">Twitch</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="patreon">Patreon</SelectItem>
                      <SelectItem value="substack">Substack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="creatorName">Creator/Channel Name *</Label>
                <Input
                  id="creatorName"
                  placeholder="e.g., MrBeast, Pokimane, Tim Ferriss"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="creatorUrl">Creator URL *</Label>
                <Input
                  id="creatorUrl"
                  placeholder={
                    effectivePlatform === 'twitch' ? 'https://twitch.tv/username' :
                    effectivePlatform === 'youtube' ? 'https://youtube.com/@channel' :
                    effectivePlatform === 'patreon' ? 'https://patreon.com/creator' :
                    effectivePlatform === 'substack' ? 'https://writer.substack.com' :
                    'https://...'
                  }
                  value={creatorUrl}
                  onChange={(e) => setCreatorUrl(e.target.value)}
                />
                {creatorUrl && effectivePlatform && !validateUrl(creatorUrl, effectivePlatform) && (
                  <p className="text-xs text-destructive">
                    URL should be from {PLATFORM_URL_PATTERNS[effectivePlatform]}
                  </p>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Enter the creator you want to support. We'll set up your subscription within 48 hours.
              </p>
            </div>
          )}

          {/* How to activate (for non-creator subs) */}
          {!isCreatorSub && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-primary" />
                How to activate
              </h4>
              <p className="text-sm text-muted-foreground pl-6">
                {partner.activation_instructions || 'Activation details will be provided after confirmation.'}
              </p>
            </div>
          )}

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
            disabled={activating || !hasEnoughSlots || (isCreatorSub && !isValidCreatorInput())}
          >
            {activating ? 'Activating...' : 'Activate Benefit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
