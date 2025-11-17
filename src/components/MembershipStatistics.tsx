import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { TrendingUp, Clock, Zap, Lock } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { membershipTiers } from '@/utils/membershipLevels';

interface HistoryEntry {
  id: string;
  tier_level: number;
  tier_name: string;
  locked_nctr: number;
  created_at: string;
}

interface MembershipStatisticsProps {
  userId: string;
}

export function MembershipStatistics({ userId }: MembershipStatisticsProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLocked: 0,
    averageDuration: 0,
    upgradeVelocity: 0,
    currentStreak: 0,
  });

  useEffect(() => {
    fetchStatistics();
  }, [userId]);

  const fetchStatistics = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setHistory(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: HistoryEntry[]) => {
    const totalLocked = data[data.length - 1]?.locked_nctr || 0;
    
    // Calculate average tier duration
    const durations: number[] = [];
    for (let i = 1; i < data.length; i++) {
      const duration = new Date(data[i].created_at).getTime() - new Date(data[i - 1].created_at).getTime();
      durations.push(duration / (1000 * 60 * 60 * 24)); // Convert to days
    }
    const averageDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    // Calculate upgrade velocity (upgrades per month)
    const firstUpgrade = new Date(data[0].created_at).getTime();
    const lastUpgrade = new Date(data[data.length - 1].created_at).getTime();
    const monthsDiff = (lastUpgrade - firstUpgrade) / (1000 * 60 * 60 * 24 * 30);
    const upgradeVelocity = monthsDiff > 0 ? data.length / monthsDiff : 0;

    // Calculate current streak (days since last upgrade)
    const daysSinceLastUpgrade = (Date.now() - lastUpgrade) / (1000 * 60 * 60 * 24);

    setStats({
      totalLocked,
      averageDuration: Math.round(averageDuration),
      upgradeVelocity: Number(upgradeVelocity.toFixed(2)),
      currentStreak: Math.floor(daysSinceLastUpgrade),
    });
  };

  const getChartData = () => {
    return history.map((entry, index) => ({
      date: new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      locked: entry.locked_nctr,
      tier: entry.tier_level,
      name: entry.tier_name,
    }));
  };

  const getTierDistribution = () => {
    const distribution = history.reduce((acc, entry) => {
      const tier = entry.tier_name;
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([name, count]) => ({
      name,
      count,
      color: membershipTiers.find(t => t.name === name)?.color || 'hsl(var(--muted))',
    }));
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium text-muted-foreground">No statistics yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Start locking NCTR to track your membership journey
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Locked</p>
              <p className="text-2xl font-bold">{stats.totalLocked.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Clock className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Duration</p>
              <p className="text-2xl font-bold">{stats.averageDuration}d</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Upgrades/Month</p>
              <p className="text-2xl font-bold">{stats.upgradeVelocity}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted/10">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Tier</p>
              <p className="text-2xl font-bold">{stats.currentStreak}d</p>
            </div>
          </div>
        </Card>
      </div>

      {/* NCTR Locked Over Time */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          NCTR Locked Over Time
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={getChartData()}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="locked" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Tier Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart className="w-5 h-5" />
          Tier History Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={getTierDistribution()}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar 
              dataKey="count" 
              fill="hsl(var(--primary))"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
