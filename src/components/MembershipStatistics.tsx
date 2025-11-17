import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { TrendingUp, Clock, Zap, Lock, Target, Calendar, Activity, Trophy } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { membershipTiers } from '@/utils/membershipLevels';
import { format, addDays, differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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
  const [prediction, setPrediction] = useState<{
    nextTier: typeof membershipTiers[0] | null;
    estimatedDate: Date | null;
    daysRemaining: number;
    nctrNeeded: number;
    confidence: 'high' | 'medium' | 'low';
    dailyAverage: number;
  }>({
    nextTier: null,
    estimatedDate: null,
    daysRemaining: 0,
    nctrNeeded: 0,
    confidence: 'low',
    dailyAverage: 0,
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
        calculatePrediction(data);
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

  const calculatePrediction = (data: HistoryEntry[]) => {
    if (data.length < 2) {
      // Not enough data for prediction
      setPrediction({
        nextTier: null,
        estimatedDate: null,
        daysRemaining: 0,
        nctrNeeded: 0,
        confidence: 'low',
        dailyAverage: 0,
      });
      return;
    }

    const currentLocked = data[data.length - 1].locked_nctr;
    const currentTierLevel = data[data.length - 1].tier_level;
    
    // Find next tier
    const nextTier = membershipTiers.find(t => t.level > currentTierLevel);
    if (!nextTier) {
      // Already at max tier
      setPrediction({
        nextTier: null,
        estimatedDate: null,
        daysRemaining: 0,
        nctrNeeded: 0,
        confidence: 'high',
        dailyAverage: 0,
      });
      return;
    }

    const nctrNeeded = nextTier.requirement - currentLocked;

    // Calculate locking velocity (NCTR per day)
    const lockingEvents = data.map((entry, index) => {
      if (index === 0) return { date: new Date(entry.created_at), amount: entry.locked_nctr };
      return {
        date: new Date(entry.created_at),
        amount: entry.locked_nctr - data[index - 1].locked_nctr,
      };
    }).filter((_, index) => index > 0); // Skip first entry as it's the initial lock

    if (lockingEvents.length === 0) {
      setPrediction({
        nextTier,
        estimatedDate: null,
        daysRemaining: 0,
        nctrNeeded,
        confidence: 'low',
        dailyAverage: 0,
      });
      return;
    }

    // Calculate time spans and daily averages
    const firstLock = new Date(data[0].created_at);
    const lastLock = new Date(data[data.length - 1].created_at);
    const totalDays = differenceInDays(lastLock, firstLock) || 1;
    const totalNCTRLocked = currentLocked - (data[0].locked_nctr || 0);
    const dailyAverage = totalNCTRLocked / totalDays;

    // Use weighted average (recent activity weighted more)
    const recentLocks = lockingEvents.slice(-3); // Last 3 locks
    const recentDailyAverage = recentLocks.reduce((sum, event, index) => {
      const prevDate = index > 0 ? lockingEvents[lockingEvents.length - 3 + index - 1].date : firstLock;
      const daysSince = differenceInDays(event.date, prevDate) || 1;
      return sum + (event.amount / daysSince);
    }, 0) / recentLocks.length;

    // Use weighted approach: 70% recent, 30% all-time
    const predictedDailyRate = (recentDailyAverage * 0.7) + (dailyAverage * 0.3);

    if (predictedDailyRate <= 0) {
      setPrediction({
        nextTier,
        estimatedDate: null,
        daysRemaining: 0,
        nctrNeeded,
        confidence: 'low',
        dailyAverage: 0,
      });
      return;
    }

    const daysToNextTier = Math.ceil(nctrNeeded / predictedDailyRate);
    const estimatedDate = addDays(new Date(), daysToNextTier);

    // Determine confidence based on consistency of locking pattern
    const lockingIntervals = lockingEvents.map((event, index) => {
      if (index === 0) return 0;
      return differenceInDays(event.date, lockingEvents[index - 1].date);
    }).filter(interval => interval > 0);

    const avgInterval = lockingIntervals.reduce((a, b) => a + b, 0) / lockingIntervals.length;
    const variance = lockingIntervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / lockingIntervals.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / avgInterval;

    let confidence: 'high' | 'medium' | 'low';
    if (lockingEvents.length >= 5 && coefficientOfVariation < 0.5) {
      confidence = 'high';
    } else if (lockingEvents.length >= 3 && coefficientOfVariation < 1) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    setPrediction({
      nextTier,
      estimatedDate,
      daysRemaining: daysToNextTier,
      nctrNeeded,
      confidence,
      dailyAverage: predictedDailyRate,
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

  const getProjectionData = () => {
    if (!prediction.estimatedDate || !prediction.nextTier) return [];

    const today = new Date();
    const projectionPoints = 10;
    const dayInterval = Math.ceil(prediction.daysRemaining / projectionPoints);
    
    return Array.from({ length: projectionPoints + 1 }, (_, i) => {
      const daysFromNow = i * dayInterval;
      const projectedNCTR = stats.totalLocked + (prediction.dailyAverage * daysFromNow);
      return {
        date: format(addDays(today, daysFromNow), 'MMM d'),
        projected: Math.min(projectedNCTR, prediction.nextTier.requirement),
        target: prediction.nextTier.requirement,
      };
    });
  };

  const getConfidenceColor = () => {
    switch (prediction.confidence) {
      case 'high': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-950';
      case 'low': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-950';
    }
  };

  return (
    <div className="space-y-6">
      {/* Predictive Analytics */}
      {prediction.nextTier && prediction.estimatedDate && (
        <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                <Target className="w-6 h-6 text-primary" />
                Next Tier Prediction
              </h3>
              <p className="text-sm text-muted-foreground">
                Based on your locking patterns over the last {history.length} upgrades
              </p>
            </div>
            <Badge className={getConfidenceColor()}>
              {prediction.confidence.toUpperCase()} Confidence
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="w-4 h-4" />
                Target Tier
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: prediction.nextTier.color }}
                />
                <span className="text-2xl font-bold">{prediction.nextTier.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {prediction.nextTier.requirement.toLocaleString()} NCTR required
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Estimated Date
              </div>
              <div className="text-2xl font-bold">
                {format(prediction.estimatedDate, 'MMM d, yyyy')}
              </div>
              <p className="text-sm text-muted-foreground">
                {prediction.daysRemaining} days from now
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="w-4 h-4" />
                Daily Rate
              </div>
              <div className="text-2xl font-bold">
                {prediction.dailyAverage.toFixed(1)} NCTR
              </div>
              <p className="text-sm text-muted-foreground">
                Average locking velocity
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress to {prediction.nextTier.name}</span>
              <span className="font-medium">
                {prediction.nctrNeeded.toLocaleString()} NCTR remaining
              </span>
            </div>
            <Progress 
              value={(stats.totalLocked / prediction.nextTier.requirement) * 100} 
              className="h-3"
            />
          </div>

          {/* Projection Chart */}
          <div className="border-t pt-6">
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Projected Growth Path
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={getProjectionData()}>
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
                  dataKey="projected" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                  name="Projected NCTR"
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Target"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {prediction.confidence === 'low' && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                ℹ️ Low confidence: Predictions improve with more consistent locking activity. 
                Lock NCTR regularly to get more accurate forecasts.
              </p>
            </div>
          )}
        </Card>
      )}

      {!prediction.nextTier && history.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="text-center py-8">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-bold mb-2">Maximum Tier Achieved! 🎉</h3>
            <p className="text-muted-foreground">
              You've reached the highest membership tier. Congratulations!
            </p>
          </div>
        </Card>
      )}

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
