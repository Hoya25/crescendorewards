import { useState, useEffect } from 'react';
import { useDeliveryProfile } from '@/hooks/useDeliveryProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Mail, Phone, MapPin, Wallet, Twitter, Instagram, 
  MessageCircle, Send, Youtube, Video, Check, Save, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

const COUNTRIES = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'NL', 'JP', 'KR', 'SG'];

interface FormData {
  email: string;
  phone: string;
  shipping_name: string;
  shipping_address_line1: string;
  shipping_address_line2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country: string;
  wallet_address: string;
  twitter_handle: string;
  instagram_handle: string;
  tiktok_handle: string;
  kick_username: string;
  discord_username: string;
  telegram_handle: string;
  youtube_channel: string;
}

function FieldIcon({ name, filled }: { name: string; filled: boolean }) {
  const iconClass = cn("w-4 h-4", filled ? "text-emerald-500" : "text-muted-foreground");
  const icons: Record<string, React.ReactNode> = {
    Mail: <Mail className={iconClass} />,
    Phone: <Phone className={iconClass} />,
    MapPin: <MapPin className={iconClass} />,
    Wallet: <Wallet className={iconClass} />,
    Twitter: <Twitter className={iconClass} />,
    Instagram: <Instagram className={iconClass} />,
    Video: <Video className={iconClass} />,
    Twitch: <Video className={iconClass} />,
    MessageCircle: <MessageCircle className={iconClass} />,
    Send: <Send className={iconClass} />,
    Youtube: <Youtube className={iconClass} />,
  };
  return icons[name] || null;
}

export function DeliveryProfileForm() {
  const { profile, loading, updateProfile, completionPercentage } = useDeliveryProfile();
  const { address: connectedWallet } = useAccount();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    phone: '',
    shipping_name: '',
    shipping_address_line1: '',
    shipping_address_line2: '',
    shipping_city: '',
    shipping_state: '',
    shipping_zip: '',
    shipping_country: 'US',
    wallet_address: '',
    twitter_handle: '',
    instagram_handle: '',
    tiktok_handle: '',
    kick_username: '',
    discord_username: '',
    telegram_handle: '',
    youtube_channel: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        email: profile.email || '',
        phone: profile.phone || '',
        shipping_name: profile.shipping_name || '',
        shipping_address_line1: profile.shipping_address_line1 || '',
        shipping_address_line2: profile.shipping_address_line2 || '',
        shipping_city: profile.shipping_city || '',
        shipping_state: profile.shipping_state || '',
        shipping_zip: profile.shipping_zip || '',
        shipping_country: profile.shipping_country || 'US',
        wallet_address: profile.wallet_address || '',
        twitter_handle: profile.twitter_handle || '',
        instagram_handle: profile.instagram_handle || '',
        tiktok_handle: profile.tiktok_handle || '',
        kick_username: profile.kick_username || '',
        discord_username: profile.discord_username || '',
        telegram_handle: profile.telegram_handle || '',
        youtube_channel: profile.youtube_channel || '',
      });
    }
  }, [profile]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await updateProfile(formData);
    setSaving(false);
  };

  const useConnectedWallet = () => {
    if (connectedWallet) {
      handleChange('wallet_address', connectedWallet);
    }
  };

  const countFilledFields = () => {
    let count = 0;
    if (formData.email) count++;
    if (formData.phone) count++;
    if (formData.shipping_name && formData.shipping_address_line1 && formData.shipping_city) count++;
    if (formData.wallet_address) count++;
    if (formData.twitter_handle) count++;
    if (formData.instagram_handle) count++;
    if (formData.tiktok_handle) count++;
    if (formData.kick_username) count++;
    if (formData.discord_username) count++;
    if (formData.telegram_handle) count++;
    if (formData.youtube_channel) count++;
    return count;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const filledCount = countFilledFields();
  const totalFields = 11;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Profile Completion</span>
            <span className="text-sm text-muted-foreground">{filledCount}/{totalFields} fields</span>
          </div>
          <Progress value={(filledCount / totalFields) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Complete your delivery profile to claim rewards faster
          </p>
        </CardContent>
      </Card>

      <Accordion type="multiple" defaultValue={['contact', 'shipping', 'wallet', 'social']} className="space-y-4">
        {/* Contact Information */}
        <AccordionItem value="contact" className="border rounded-lg px-4">
          <AccordionTrigger className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <FieldIcon name="Mail" filled={!!formData.email} />
                <span>Contact Information</span>
              </div>
              {formData.email && formData.phone && (
                <Check className="w-4 h-4 text-emerald-500" />
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <FieldIcon name="Mail" filled={!!formData.email} />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <FieldIcon name="Phone" filled={!!formData.phone} />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Shipping Address */}
        <AccordionItem value="shipping" className="border rounded-lg px-4">
          <AccordionTrigger className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <FieldIcon name="MapPin" filled={!!formData.shipping_address_line1} />
                <span>Shipping Address</span>
              </div>
              {formData.shipping_name && formData.shipping_address_line1 && formData.shipping_city && (
                <Check className="w-4 h-4 text-emerald-500" />
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shipping_name">Full Name</Label>
              <Input
                id="shipping_name"
                value={formData.shipping_name}
                onChange={(e) => handleChange('shipping_name', e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address1">Address Line 1</Label>
              <Input
                id="address1"
                value={formData.shipping_address_line1}
                onChange={(e) => handleChange('shipping_address_line1', e.target.value)}
                placeholder="123 Main Street"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address2">Address Line 2 (Optional)</Label>
              <Input
                id="address2"
                value={formData.shipping_address_line2}
                onChange={(e) => handleChange('shipping_address_line2', e.target.value)}
                placeholder="Apt 4B"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.shipping_city}
                  onChange={(e) => handleChange('shipping_city', e.target.value)}
                  placeholder="Denver"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select value={formData.shipping_state} onValueChange={(v) => handleChange('shipping_state', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  value={formData.shipping_zip}
                  onChange={(e) => handleChange('shipping_zip', e.target.value)}
                  placeholder="80211"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={formData.shipping_country} onValueChange={(v) => handleChange('shipping_country', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Crypto Wallet */}
        <AccordionItem value="wallet" className="border rounded-lg px-4">
          <AccordionTrigger className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <FieldIcon name="Wallet" filled={!!formData.wallet_address} />
                <span>Crypto Wallet</span>
              </div>
              {formData.wallet_address && (
                <Check className="w-4 h-4 text-emerald-500" />
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wallet" className="flex items-center gap-2">
                <FieldIcon name="Wallet" filled={!!formData.wallet_address} />
                Wallet Address (Base/Ethereum)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="wallet"
                  value={formData.wallet_address}
                  onChange={(e) => handleChange('wallet_address', e.target.value)}
                  placeholder="0x..."
                  className="font-mono text-sm flex-1"
                />
                {connectedWallet && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={useConnectedWallet}
                  >
                    Use Connected
                  </Button>
                )}
              </div>
              {connectedWallet && (
                <p className="text-xs text-muted-foreground">
                  Connected: {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Social Handles */}
        <AccordionItem value="social" className="border rounded-lg px-4">
          <AccordionTrigger className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <FieldIcon name="Twitter" filled={!!formData.twitter_handle} />
                <span>Social Handles</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {[formData.twitter_handle, formData.instagram_handle, formData.discord_username, 
                  formData.kick_username, formData.tiktok_handle, formData.telegram_handle, 
                  formData.youtube_channel].filter(Boolean).length}/7
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FieldIcon name="Twitter" filled={!!formData.twitter_handle} />
                  X (Twitter)
                </Label>
                <Input
                  value={formData.twitter_handle}
                  onChange={(e) => handleChange('twitter_handle', e.target.value)}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FieldIcon name="Instagram" filled={!!formData.instagram_handle} />
                  Instagram
                </Label>
                <Input
                  value={formData.instagram_handle}
                  onChange={(e) => handleChange('instagram_handle', e.target.value)}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FieldIcon name="Video" filled={!!formData.tiktok_handle} />
                  TikTok
                </Label>
                <Input
                  value={formData.tiktok_handle}
                  onChange={(e) => handleChange('tiktok_handle', e.target.value)}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FieldIcon name="Zap" filled={!!formData.kick_username} />
                  Kick
                </Label>
                <Input
                  value={formData.kick_username}
                  onChange={(e) => handleChange('kick_username', e.target.value)}
                  placeholder="username"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FieldIcon name="MessageCircle" filled={!!formData.discord_username} />
                  Discord
                </Label>
                <Input
                  value={formData.discord_username}
                  onChange={(e) => handleChange('discord_username', e.target.value)}
                  placeholder="username"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FieldIcon name="Send" filled={!!formData.telegram_handle} />
                  Telegram
                </Label>
                <Input
                  value={formData.telegram_handle}
                  onChange={(e) => handleChange('telegram_handle', e.target.value)}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-2">
                  <FieldIcon name="Youtube" filled={!!formData.youtube_channel} />
                  YouTube Channel
                </Label>
                <Input
                  value={formData.youtube_channel}
                  onChange={(e) => handleChange('youtube_channel', e.target.value)}
                  placeholder="@channel or URL"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save Delivery Profile
          </>
        )}
      </Button>
    </div>
  );
}
