import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, ShoppingBag, Coins, Trophy, Gift } from 'lucide-react';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';

const notificationOptions = [
  {
    key: 'email_shop_purchases' as const,
    label: 'Shop Purchases',
    description: 'Get notified when NCTR is credited from your shop purchases',
    icon: ShoppingBag,
  },
  {
    key: 'email_nctr_credited' as const,
    label: 'NCTR Balance Updates',
    description: 'Get notified when NCTR is added to your balance',
    icon: Coins,
  },
  {
    key: 'email_tier_changes' as const,
    label: 'Status Tier Changes',
    description: 'Get notified when your membership tier changes',
    icon: Trophy,
  },
  {
    key: 'email_rewards_claimed' as const,
    label: 'Rewards Claimed',
    description: 'Get notified when you claim a reward',
    icon: Gift,
  },
];

export function NotificationPreferences() {
  const { settings, loading, saving, updateSetting } = useNotificationSettings();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <CardTitle>Notification Preferences</CardTitle>
        </div>
        <CardDescription>
          Choose which email notifications you'd like to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notificationOptions.map((option) => {
          const Icon = option.icon;
          const isEnabled = settings?.[option.key] ?? true;

          return (
            <div
              key={option.key}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <Label htmlFor={option.key} className="font-medium cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {option.description}
                  </p>
                </div>
              </div>
              <Switch
                id={option.key}
                checked={isEnabled}
                onCheckedChange={(checked) => updateSetting(option.key, checked)}
                disabled={saving}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
