import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Zap, 
  Tag, 
  Gift, 
  Headphones, 
  Clock, 
  Star, 
  UserCog, 
  Truck,
  RefreshCw
} from 'lucide-react';
import { useBenefitTypeSettings, BenefitTypeSetting } from '@/hooks/useBenefitTypeSettings';
import { Button } from '@/components/ui/button';

const BENEFIT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  earning_multiplier: Zap,
  discount_percent: Tag,
  claims_allowance: Gift,
  priority_support: Headphones,
  early_access: Clock,
  vip_events: Star,
  concierge_service: UserCog,
  free_shipping: Truck
};

export function BenefitTypeManager() {
  const { settings, loading, toggleBenefitType, refetch } = useBenefitTypeSettings();

  const coreSettings = settings.filter(s => s.category === 'core');
  const perkSettings = settings.filter(s => s.category === 'perk');

  const renderSetting = (setting: BenefitTypeSetting) => {
    const Icon = BENEFIT_ICONS[setting.benefit_key] || Star;
    
    return (
      <div
        key={setting.id}
        className={`flex items-center justify-between p-4 rounded-lg border transition-opacity ${
          setting.is_active ? 'bg-background' : 'bg-muted/50 opacity-60'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${setting.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
            <Icon className={`w-5 h-5 ${setting.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{setting.display_name}</span>
              {!setting.is_active && (
                <Badge variant="secondary" className="text-xs">Hidden</Badge>
              )}
            </div>
            {setting.description && (
              <p className="text-sm text-muted-foreground">{setting.description}</p>
            )}
          </div>
        </div>
        <Switch
          checked={setting.is_active}
          onCheckedChange={(checked) => toggleBenefitType(setting.benefit_key, checked)}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Global Benefit Controls</CardTitle>
            <CardDescription>
              Toggle which benefit types are available across all tiers. Disabled benefits are hidden from members.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Core Benefits */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Core Benefits
          </h4>
          <div className="space-y-2">
            {coreSettings.map(renderSetting)}
          </div>
        </div>

        <Separator />

        {/* Perks */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Additional Perks
          </h4>
          <div className="space-y-2">
            {perkSettings.map(renderSetting)}
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Disabling a benefit type will hide it from all tier displays 
            and member views. The underlying tier configuration is preserved.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
