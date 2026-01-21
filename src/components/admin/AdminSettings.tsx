import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, DollarSign, Settings, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Json } from '@/integrations/supabase/types';

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
  const [priceFloor, setPriceFloor] = useState('4');

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
        // Handle both string and number JSON values
        const value = typeof priceFloorSetting.setting_value === 'string' 
          ? priceFloorSetting.setting_value.replace(/"/g, '')
          : String(priceFloorSetting.setting_value);
        setPriceFloor(value);
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
