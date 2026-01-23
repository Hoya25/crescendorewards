import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, DollarSign, Settings, AlertCircle, Users, Lock, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Json } from '@/integrations/supabase/types';
import { NCTRLogo } from '@/components/NCTRLogo';

interface AdminSetting {
  id: string;
  setting_key: string;
  setting_value: Json;
  description: string | null;
  updated_at: string;
}

export function AdminSettings() {
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingReferral, setSavingReferral] = useState(false);
  const [savingClaimValue, setSavingClaimValue] = useState(false);
  const [priceFloor, setPriceFloor] = useState('4');
  const [referralAllocation, setReferralAllocation] = useState('500');
  const [claimValueUsd, setClaimValueUsd] = useState('5');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;

      setSettings(data || []);
      
      // Extract price floor setting
      const priceFloorSetting = data?.find(s => s.setting_key === 'claim_price_floor');
      if (priceFloorSetting) {
        const value = typeof priceFloorSetting.setting_value === 'string' 
          ? priceFloorSetting.setting_value.replace(/"/g, '')
          : String(priceFloorSetting.setting_value);
        setPriceFloor(value);
      }

      // Extract referral 360LOCK allocation setting
      const referralSetting = data?.find(s => s.setting_key === 'referral_360lock_allocation');
      if (referralSetting) {
        const value = typeof referralSetting.setting_value === 'string' 
          ? referralSetting.setting_value.replace(/"/g, '')
          : String(referralSetting.setting_value);
        setReferralAllocation(value);
      }

      // Extract claim value USD setting
      const claimValueSetting = data?.find(s => s.setting_key === 'claim_value_usd');
      if (claimValueSetting) {
        const value = typeof claimValueSetting.setting_value === 'string' 
          ? claimValueSetting.setting_value.replace(/"/g, '')
          : String(claimValueSetting.setting_value);
        setClaimValueUsd(value);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePriceFloor = async () => {
    const value = parseFloat(priceFloor);
    if (isNaN(value) || value < 0) {
      toast({
        title: 'Invalid Value',
        description: 'Price floor must be a positive number',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('admin_settings')
        .update({ 
          setting_value: value,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'claim_price_floor');

      if (error) throw error;

      toast({
        title: 'Settings Saved',
        description: `Price floor updated to $${value} per claim`,
      });
      
      await fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReferralAllocation = async () => {
    const value = parseInt(referralAllocation);
    if (isNaN(value) || value < 0) {
      toast({
        title: 'Invalid Value',
        description: 'Referral allocation must be a positive number',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingReferral(true);
      
      const { error } = await supabase
        .from('admin_settings')
        .update({ 
          setting_value: value,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'referral_360lock_allocation');

      if (error) throw error;

      toast({
        title: 'Settings Saved',
        description: `Referral 360LOCK allocation updated to ${value} NCTR`,
      });
      
      await fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSavingReferral(false);
    }
  };

  const handleSaveClaimValue = async () => {
    const value = parseFloat(claimValueUsd);
    if (isNaN(value) || value <= 0) {
      toast({
        title: 'Invalid Value',
        description: 'Claim value must be a positive number',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingClaimValue(true);
      
      const { error } = await supabase
        .from('admin_settings')
        .update({ 
          setting_value: value,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'claim_value_usd');

      if (error) throw error;

      toast({
        title: 'Settings Saved',
        description: `Claim value updated to $${value} per claim`,
      });
      
      await fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSavingClaimValue(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Configure system-wide settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pricing Settings
          </CardTitle>
          <CardDescription>
            Configure pricing rules for claim purchases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="priceFloor">Minimum Price Per Claim ($)</Label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-[200px]">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="priceFloor"
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceFloor}
                  onChange={(e) => setPriceFloor(e.target.value)}
                  className="pl-8"
                  placeholder="4.00"
                />
              </div>
              <Button onClick={handleSavePriceFloor} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              This sets the minimum price per claim for all purchases, including custom amounts. 
              For example, if set to $4, purchasing 100 claims requires at least $400.
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Current rate: Custom purchases calculate at $4.55 per claim (0.22 claims/$). 
              The price floor ensures no purchase can get claims cheaper than ${priceFloor || '4'}/claim.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Reward Submission Settings
          </CardTitle>
          <CardDescription>
            Configure claim value for contributor reward submissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="claimValueUsd" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Claim Value (USD)
            </Label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-[200px]">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="claimValueUsd"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={claimValueUsd}
                  onChange={(e) => setClaimValueUsd(e.target.value)}
                  className="pl-8"
                  placeholder="5.00"
                />
              </div>
              <Button onClick={handleSaveClaimValue} disabled={savingClaimValue}>
                {savingClaimValue ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              This sets the dollar value per claim when calculating "Claims Required" for reward submissions.
              For example, a $65 floor amount ÷ $5 claim value = 13 Claims Required.
            </p>
          </div>

          <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <Tag className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              Current claim value: <span className="font-bold">${claimValueUsd || '5'}</span> per claim.
              A $100 floor = {Math.ceil(100 / (parseFloat(claimValueUsd) || 5))} claims required.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Referral Program Settings
          </CardTitle>
          <CardDescription>
            Configure NCTR 360LOCK allocation for referrals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="referralAllocation" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              360LOCK Allocation Per Referral
            </Label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-[200px]">
                <NCTRLogo size="xs" className="absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="referralAllocation"
                  type="number"
                  min="0"
                  step="1"
                  value={referralAllocation}
                  onChange={(e) => setReferralAllocation(e.target.value)}
                  className="pl-10"
                  placeholder="500"
                />
              </div>
              <Button onClick={handleSaveReferralAllocation} disabled={savingReferral}>
                {savingReferral ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Amount of NCTR 360LOCK allocated to both referrer and referred user for each successful referral. 
              This appears as a prominent CTA in the member's referral card.
            </p>
          </div>

          <Alert className="bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800">
            <Lock className="h-4 w-4 text-violet-600" />
            <AlertDescription className="text-violet-900 dark:text-violet-100">
              Current allocation: <span className="font-bold">{referralAllocation || '500'} NCTR</span> per successful referral. 
              This 360LOCK allocation helps members progress toward higher tiers.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            All Settings
          </CardTitle>
          <CardDescription>
            Overview of all system configuration values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {settings.map((setting) => (
              <div key={setting.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium font-mono text-sm">{setting.setting_key}</p>
                    <p className="text-sm text-muted-foreground">{setting.description || 'No description'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                      {typeof setting.setting_value === 'object' 
                        ? JSON.stringify(setting.setting_value)
                        : String(setting.setting_value)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
