import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Coins, ShoppingBag, Shield } from 'lucide-react';
import { DualReferralLinks } from '@/components/referral/DualReferralLinks';

interface EventAggregation {
  event_type: string;
  count: number;
  total_nctr: number;
}

const EVENT_LABELS: Record<string, { label: string; nctrPer: string }> = {
  signup: { label: 'Signups', nctrPer: '625 NCTR' },
  first_purchase: { label: 'First purchases', nctrPer: '2,500 NCTR' },
  '5th_purchase': { label: '5th purchases', nctrPer: '2,500 NCTR' },
  '10th_purchase': { label: '10th purchases', nctrPer: '5,000 NCTR' },
  bronze_reached: { label: 'Bronze reached', nctrPer: 'tracked' },
};

export function CreatorReferrals() {
  const { profile } = useUnifiedUser();

  const referralCode = (profile?.crescendo_data as any)?.referral_code || profile?.id?.slice(0, 8) || '';

  const { data, isLoading } = useQuery({
    queryKey: ['creator-referral-earnings', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data: rows, error } = await supabase
        .from('creator_referral_earnings' as any)
        .select('event_type, nctr_amount, referred_profile_id')
        .eq('creator_profile_id', profile.id);

      if (error) throw error;

      const byType: Record<string, { count: number; total_nctr: number; referredIds: Set<string> }> = {};
      const allReferredIds = new Set<string>();
      let totalNctr = 0;

      for (const row of (rows || []) as any[]) {
        if (!byType[row.event_type]) {
          byType[row.event_type] = { count: 0, total_nctr: 0, referredIds: new Set() };
        }
        byType[row.event_type].count += 1;
        byType[row.event_type].total_nctr += Number(row.nctr_amount) || 0;
        if (row.referred_profile_id) {
          byType[row.event_type].referredIds.add(row.referred_profile_id);
          allReferredIds.add(row.referred_profile_id);
        }
        totalNctr += Number(row.nctr_amount) || 0;
      }

      const aggregations: EventAggregation[] = Object.entries(byType).map(([type, d]) => ({
        event_type: type,
        count: d.count,
        total_nctr: d.total_nctr,
      }));

      return {
        aggregations,
        totalReferred: allReferredIds.size,
        totalNctr,
        fansPurchased: byType['first_purchase']?.referredIds.size || 0,
        fansAtBronze: byType['bronze_reached']?.referredIds.size || 0,
        hasData: (rows || []).length > 0,
      };
    },
    enabled: !!profile?.id,
  });

  // Visibility check
  const { data: shouldShow, isLoading: checkingVisibility } = useQuery({
    queryKey: ['creator-referral-visibility', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return false;
      if ((profile as any).source_category === 'streamer') return true;

      const { count, error } = await supabase
        .from('creator_referral_earnings' as any)
        .select('id', { count: 'exact', head: true })
        .eq('creator_profile_id', profile.id);

      if (error) return false;
      return (count || 0) > 0;
    },
    enabled: !!profile?.id,
  });

  if (checkingVisibility || isLoading || !shouldShow) return null;

  const stats = data || { totalReferred: 0, totalNctr: 0, fansPurchased: 0, fansAtBronze: 0, aggregations: [], hasData: false };

  const getCount = (type: string) => stats.aggregations.find(a => a.event_type === type)?.count || 0;

  if (!stats.hasData) {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Creator Referrals</p>
          <p className="text-sm text-muted-foreground mt-0.5">NCTR you've earned from your community.</p>
        </div>
        <Card className="border-border/50 bg-card">
          <CardContent className="p-5 text-center space-y-3">
            <Users className="w-8 h-8 mx-auto text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No referrals yet. Share your link to start earning from your community.
            </p>
            <DualReferralLinks referralCode={referralCode} compact className="max-w-md mx-auto text-left" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    { label: 'Fans Referred', value: stats.totalReferred, icon: Users },
    { label: 'NCTR Earned', value: stats.totalNctr.toLocaleString(), icon: Coins },
    { label: 'Fans Who Purchased', value: stats.fansPurchased, icon: ShoppingBag },
    { label: 'Fans at Bronze', value: stats.fansAtBronze, icon: Shield },
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Creator Referrals</p>
        <p className="text-sm text-muted-foreground mt-0.5">NCTR you've earned from your community.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-border/50 bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Milestone Breakdown */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Milestone Breakdown</p>
          {Object.entries(EVENT_LABELS).map(([type, { label, nctrPer }]) => {
            const count = getCount(type);
            return (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono text-foreground">
                  {count} × {nctrPer}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Share Link */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Share Your Link</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted/50 rounded px-3 py-2 truncate text-muted-foreground font-mono">
              {referralUrl}
            </code>
            <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Every fan who joins through your link earns you NCTR when they shop.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
