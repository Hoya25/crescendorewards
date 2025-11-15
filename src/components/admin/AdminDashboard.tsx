import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, ShoppingBag, Users, Coins, TrendingUp, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Stats {
  total_rewards: number;
  active_rewards: number;
  total_claims: number;
  pending_claims: number;
  approved_claims: number;
  shipped_claims: number;
  completed_claims: number;
  total_users: number;
  total_nctr_distributed: number;
  total_claim_balance: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_admin_stats') as { data: any; error: any };

      if (error) throw error;

      setStats(data as Stats);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load admin stats',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-muted" />
            <CardContent className="h-16 bg-muted/50 mt-4" />
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Rewards',
      value: stats.total_rewards,
      subtitle: `${stats.active_rewards} active`,
      icon: Gift,
      color: 'text-blue-500',
    },
    {
      title: 'Total Claims',
      value: stats.total_claims,
      subtitle: `${stats.pending_claims} pending`,
      icon: ShoppingBag,
      color: 'text-purple-500',
    },
    {
      title: 'Approved Claims',
      value: stats.approved_claims,
      subtitle: `${stats.shipped_claims} shipped`,
      icon: Package,
      color: 'text-green-500',
    },
    {
      title: 'Total Users',
      value: stats.total_users,
      subtitle: 'Registered users',
      icon: Users,
      color: 'text-orange-500',
    },
    {
      title: 'NCTR Distributed',
      value: stats.total_nctr_distributed.toLocaleString(),
      subtitle: 'Total tokens',
      icon: Coins,
      color: 'text-yellow-500',
    },
    {
      title: 'Claim Balance',
      value: stats.total_claim_balance.toLocaleString(),
      subtitle: 'Available to claim',
      icon: TrendingUp,
      color: 'text-cyan-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Overview of platform statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Claims Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{stats.pending_claims}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{stats.approved_claims}</div>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{stats.shipped_claims}</div>
              <p className="text-sm text-muted-foreground">Shipped</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{stats.completed_claims}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
