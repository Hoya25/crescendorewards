import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { addDays } from 'date-fns';
import { Clock, AlertTriangle, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ExpiryCount {
  range: string;
  count: number;
  color: string;
  icon: React.ReactNode;
  days: number;
}

export function LockExpiryWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['lock-expiry-counts'],
    queryFn: async () => {
      const now = new Date();
      const in7Days = addDays(now, 7);
      const in30Days = addDays(now, 30);
      const in90Days = addDays(now, 90);

      // Get counts for each range
      const [expiring7, expiring30, expiring90] = await Promise.all([
        supabase
          .from('unified_profiles')
          .select('id', { count: 'exact', head: true })
          .not('nctr_lock_expires_at', 'is', null)
          .lte('nctr_lock_expires_at', in7Days.toISOString())
          .gte('nctr_lock_expires_at', now.toISOString()),
        supabase
          .from('unified_profiles')
          .select('id', { count: 'exact', head: true })
          .not('nctr_lock_expires_at', 'is', null)
          .lte('nctr_lock_expires_at', in30Days.toISOString())
          .gt('nctr_lock_expires_at', in7Days.toISOString()),
        supabase
          .from('unified_profiles')
          .select('id', { count: 'exact', head: true })
          .not('nctr_lock_expires_at', 'is', null)
          .lte('nctr_lock_expires_at', in90Days.toISOString())
          .gt('nctr_lock_expires_at', in30Days.toISOString()),
      ]);

      return {
        expiring7Days: expiring7.count || 0,
        expiring30Days: expiring30.count || 0,
        expiring90Days: expiring90.count || 0,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const expiryRanges: ExpiryCount[] = [
    {
      range: 'Expiring in 7 days',
      count: data?.expiring7Days || 0,
      color: 'bg-red-500/10 text-red-600 border-red-500/30',
      icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
      days: 7,
    },
    {
      range: 'Expiring in 30 days',
      count: data?.expiring30Days || 0,
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
      icon: <Clock className="h-4 w-4 text-amber-500" />,
      days: 30,
    },
    {
      range: 'Expiring in 90 days',
      count: data?.expiring90Days || 0,
      color: 'bg-muted text-muted-foreground border-border',
      icon: <TrendingDown className="h-4 w-4 text-muted-foreground" />,
      days: 90,
    },
  ];

  const totalExpiring = (data?.expiring7Days || 0) + (data?.expiring30Days || 0) + (data?.expiring90Days || 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Upcoming Lock Expirations
        </CardTitle>
        <CardDescription>
          Members with NCTR locks expiring soon
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : totalExpiring === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No locks expiring in the next 90 days</p>
          </div>
        ) : (
          <div className="space-y-2">
            {expiryRanges.map((range) => (
              <div
                key={range.range}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border',
                  range.color
                )}
              >
                <div className="flex items-center gap-3">
                  {range.icon}
                  <span className="text-sm font-medium">{range.range}</span>
                </div>
                <span className="font-bold text-lg">{range.count}</span>
              </div>
            ))}
            <div className="pt-2 border-t mt-3">
              <a 
                href="/admin?view=users&filter=lock_expiring"
                className="text-sm text-primary hover:underline"
              >
                View all →
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
