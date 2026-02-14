import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, Phone, MapPin, Wallet, Twitter, Instagram, 
  MessageCircle, Send, Youtube, Video, Loader2, Package, AlertCircle, Zap
} from 'lucide-react';
import { useDeliveryProfile } from '@/hooks/useDeliveryProfile';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { RequiredDataField, DeliveryMethod } from '@/types/delivery';
import { DELIVERY_FIELD_CONFIGS } from '@/types/delivery';

interface ClaimDeliveryModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (deliveryData: Record<string, string>) => void;
  rewardTitle: string;
  deliveryMethod: DeliveryMethod;
  requiredFields: RequiredDataField[];
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

function getDeliverySubtitle(method: DeliveryMethod): string {
  switch (method) {
    case 'instant_code': return "We'll also email you a copy";
    case 'email': return "We'll send the details to your email";
    case 'wallet_transfer': return "We'll send to your wallet";
    case 'shipping': return "We'll ship to your address";
    case 'platform_delivery': return "We'll deliver to your account";
    case 'scheduling': return "We'll send booking details";
    case 'manual': return "We'll contact you with details";
    default: return "Please confirm your delivery information";
  }
}

function FieldIcon({ field }: { field: string }) {
  const iconClass = "w-4 h-4 text-muted-foreground";
  switch (field) {
    case 'email': return <Mail className={iconClass} />;
    case 'phone': return <Phone className={iconClass} />;
    case 'shipping_address': return <MapPin className={iconClass} />;
    case 'wallet_address': return <Wallet className={iconClass} />;
    case 'twitter_handle': return <Twitter className={iconClass} />;
    case 'instagram_handle': return <Instagram className={iconClass} />;
    case 'tiktok_handle': return <Video className={iconClass} />;
    case 'kick_username': return <Zap className={iconClass} />;
    case 'discord_username': return <MessageCircle className={iconClass} />;
    case 'telegram_handle': return <Send className={iconClass} />;
    case 'youtube_channel': return <Youtube className={iconClass} />;
    default: return <Package className={iconClass} />;
  }
}

export function ClaimDeliveryModal({
  open,
  onClose,
  onComplete,
  rewardTitle,
  deliveryMethod,
  requiredFields
}: ClaimDeliveryModalProps) {
  const { profile, updateProfile } = useDeliveryProfile();
  const { address: connectedWallet } = useAccount();
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Shipping address sub-fields
  const [shippingData, setShippingData] = useState({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  });

  // Initialize form with existing profile data
  useEffect(() => {
    if (profile) {
      const initial: Record<string, string> = {};
      requiredFields.forEach(field => {
        if (field === 'shipping_address') {
          setShippingData({
            name: profile.shipping_name || '',
            line1: profile.shipping_address_line1 || '',
            line2: profile.shipping_address_line2 || '',
            city: profile.shipping_city || '',
            state: profile.shipping_state || '',
            zip: profile.shipping_zip || '',
            country: profile.shipping_country || 'US'
          });
        } else {
          const profileKey = field as keyof typeof profile;
          initial[field] = (profile[profileKey] as string) || '';
        }
      });
      setFormData(initial);
    }
  }, [profile, requiredFields]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleShippingChange = (key: keyof typeof shippingData, value: string) => {
    setShippingData(prev => ({ ...prev, [key]: value }));
  };

  const useConnectedWallet = () => {
    if (connectedWallet) {
      handleChange('wallet_address', connectedWallet);
    }
  };

  const isFormValid = () => {
    for (const field of requiredFields) {
      if (field === 'shipping_address') {
        if (!shippingData.name || !shippingData.line1 || !shippingData.city || 
            !shippingData.state || !shippingData.zip) {
          return false;
        }
      } else if (!formData[field]?.trim()) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setSubmitting(true);

    // Build delivery data
    const deliveryData: Record<string, string> = { ...formData };
    
    if (requiredFields.includes('shipping_address')) {
      deliveryData.shipping_name = shippingData.name;
      deliveryData.shipping_address_line1 = shippingData.line1;
      deliveryData.shipping_address_line2 = shippingData.line2;
      deliveryData.shipping_city = shippingData.city;
      deliveryData.shipping_state = shippingData.state;
      deliveryData.shipping_zip = shippingData.zip;
      deliveryData.shipping_country = shippingData.country;
    }

    // Save to profile if checkbox is checked
    if (saveToProfile) {
      const profileUpdate: Record<string, string> = {};
      Object.entries(deliveryData).forEach(([key, value]) => {
        if (value) profileUpdate[key] = value;
      });
      await updateProfile(profileUpdate);
    }

    setSubmitting(false);
    onComplete(deliveryData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Where should we send this?</DialogTitle>
          <DialogDescription>{getDeliverySubtitle(deliveryMethod)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {requiredFields.map((field) => {
            const config = DELIVERY_FIELD_CONFIGS[field];
            
            if (field === 'shipping_address') {
              return (
                <div key={field} className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <FieldIcon field={field} />
                    Shipping Address
                  </Label>
                  <Input
                    value={shippingData.name}
                    onChange={(e) => handleShippingChange('name', e.target.value)}
                    placeholder="Full Name"
                  />
                  <Input
                    value={shippingData.line1}
                    onChange={(e) => handleShippingChange('line1', e.target.value)}
                    placeholder="Street Address"
                  />
                  <Input
                    value={shippingData.line2}
                    onChange={(e) => handleShippingChange('line2', e.target.value)}
                    placeholder="Apt, Suite, etc. (optional)"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={shippingData.city}
                      onChange={(e) => handleShippingChange('city', e.target.value)}
                      placeholder="City"
                    />
                    <Select value={shippingData.state} onValueChange={(v) => handleShippingChange('state', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={shippingData.zip}
                      onChange={(e) => handleShippingChange('zip', e.target.value)}
                      placeholder="ZIP Code"
                    />
                    <Input
                      value={shippingData.country}
                      onChange={(e) => handleShippingChange('country', e.target.value)}
                      placeholder="Country"
                    />
                  </div>
                </div>
              );
            }

            if (field === 'wallet_address') {
              const needsWallet = !formData[field]?.trim() && !connectedWallet;
              
              return (
                <div key={field} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FieldIcon field={field} />
                    {config.label} <span className="text-destructive">*</span>
                  </Label>
                  
                  {needsWallet && !formData[field] ? (
                    <Alert className="border-amber-500/50 bg-amber-500/10">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-sm">
                        A wallet address is required for blockchain-based rewards.
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  
                  <div className="flex gap-2">
                    <Input
                      value={formData[field] || ''}
                      onChange={(e) => handleChange(field, e.target.value)}
                      placeholder={config.placeholder}
                      className="font-mono text-sm flex-1"
                    />
                    {connectedWallet ? (
                      <Button type="button" variant="outline" size="sm" onClick={useConnectedWallet}>
                        Use Wallet
                      </Button>
                    ) : (
                      <ConnectButton.Custom>
                        {({ openConnectModal, mounted }) => (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={openConnectModal}
                            disabled={!mounted}
                          >
                            <Wallet className="w-4 h-4 mr-1" />
                            Connect
                          </Button>
                        )}
                      </ConnectButton.Custom>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Link your wallet or enter your Base wallet address manually
                  </p>
                </div>
              );
            }

            return (
              <div key={field} className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FieldIcon field={field} />
                  {config.label}
                </Label>
                <Input
                  type={config.type || 'text'}
                  value={formData[field] || ''}
                  onChange={(e) => handleChange(field, e.target.value)}
                  placeholder={config.placeholder}
                />
              </div>
            );
          })}

          <Separator />

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="save-profile" 
              checked={saveToProfile} 
              onCheckedChange={(checked) => setSaveToProfile(!!checked)} 
            />
            <label htmlFor="save-profile" className="text-sm text-muted-foreground cursor-pointer">
              Save to my profile for future claims
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isFormValid() || submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Continue to Claim'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
