import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Activity, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  FileText, 
  Package, 
  Plus, 
  ClipboardList, 
  ShoppingCart, 
  Gift,
  UserPlus,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Download,
  Flag
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow, subDays, format, startOfDay } from 'date-fns';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DashboardStats {
  total_users: number;
  active_users_7d: number;
  pending_claims: number;
  processing_claims: number;
  pending_submissions: number;
  revenue_this_month: number;
  revenue_all_time: number;
  low_stock_rewards: number;
  total_rewards: number;
}

interface ActivityItem {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  created_at: string;
  metadata: Record<string, any>;
}

interface ClaimsChartData {
  date: string;
  claims: number;
}

interface CategoryChartData {
  name: string;
  value: number;
}

interface AdminDashboardProps {
  onNavigate?: (tab: string) => void;
}

const CATEGORY_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [claimsChartData, setClaimsChartData] = useState<ClaimsChartData[]>([]);
  const [categoryChartData, setCategoryChartData] = useState<CategoryChartData[]>([]);
  const [claimsThisWeek, setClaimsThisWeek] = useState(0);
  const [totalContributors, setTotalContributors] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  
  const { pendingSubmissions, pendingClaims } = useAdminNotifications();

  useEffect(() => {
    loadStats();
    loadActivity();
    loadClaimsChartData();
    loadCategoryChartData();
    loadClaimsThisWeek();
    loadContributors();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats') as { data: unknown; error: any };

      if (error) throw error;

      setStats(data as DashboardStats);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load dashboard stats',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadActivity = async () => {
    try {
      setActivityLoading(true);
      const { data, error } = await supabase.rpc('get_recent_admin_activity', { p_limit: 10 }) as { data: unknown; error: any };

      if (error) throw error;

      setActivity((data as ActivityItem[]) || []);
    } catch (error: any) {
      console.error('Error loading activity:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  const loadClaimsChartData = async () => {
    try {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      const { data, error } = await supabase
        .from('rewards_claims')
        .select('claimed_at')
        .gte('claimed_at', thirtyDaysAgo)
        .order('claimed_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const claimsByDate: Record<string, number> = {};
      
      // Initialize all 30 days with 0
      for (let i = 29; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'MMM dd');
        claimsByDate[date] = 0;
      }

      // Count claims per day
      (data || []).forEach((claim) => {
        const date = format(new Date(claim.claimed_at), 'MMM dd');
        if (claimsByDate[date] !== undefined) {
          claimsByDate[date]++;
        }
      });

      const chartData = Object.entries(claimsByDate).map(([date, claims]) => ({
        date,
        claims,
      }));

      setClaimsChartData(chartData);
    } catch (error) {
      console.error('Error loading claims chart data:', error);
    }
  };

  const loadCategoryChartData = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('category')
        .eq('is_active', true);

      if (error) throw error;

      // Count rewards per category
      const categoryCount: Record<string, number> = {};
      (data || []).forEach((reward) => {
        const category = reward.category || 'Other';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      const chartData = Object.entries(categoryCount)
        .map(([name, value]) => ({
          name: formatCategoryName(name),
          value,
        }))
        .sort((a, b) => b.value - a.value);

      setCategoryChartData(chartData);
    } catch (error) {
      console.error('Error loading category chart data:', error);
    }
  };

  const loadClaimsThisWeek = async () => {
    try {
      const sevenDaysAgo = subDays(startOfDay(new Date()), 7).toISOString();
      
      const { count, error } = await supabase
        .from('rewards_claims')
        .select('*', { count: 'exact', head: true })
        .gte('claimed_at', sevenDaysAgo);

      if (error) throw error;

      setClaimsThisWeek(count || 0);
    } catch (error) {
      console.error('Error loading claims this week:', error);
    }
  };

  const loadContributors = async () => {
    try {
      // Contributors = users who have submitted at least one reward
      const { data, error } = await supabase
        .from('reward_submissions')
        .select('user_id')
        .eq('is_latest_version', true);

      if (error) throw error;

      // Count unique contributors
      const uniqueContributors = new Set((data || []).map(s => s.user_id));
      setTotalContributors(uniqueContributors.size);
    } catch (error) {
      console.error('Error loading contributors:', error);
    }
  };

  const formatCategoryName = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_user':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'purchase':
        return <CreditCard className="w-4 h-4 text-green-500" />;
      case 'claim':
        return <Gift className="w-4 h-4 text-purple-500" />;
      case 'submission_approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'submission_rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'submission_pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  const handleExportData = async () => {
    try {
      // Gather key metrics data
      const [claimsData, rewardsData, usersData, submissionsData] = await Promise.all([
        supabase.from('rewards_claims').select('id, status, claimed_at'),
        supabase.from('rewards').select('id, title, category, cost, is_active'),
        supabase.from('profiles').select('id, created_at, full_name, email'),
        supabase.from('reward_submissions').select('id, status, created_at').eq('is_latest_version', true),
      ]);

      const csvData = [
        '=== Key Metrics Export ===',
        `Export Date: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`,
        '',
        '--- Summary ---',
        `Total Users: ${usersData.data?.length || 0}`,
        `Active Rewards: ${rewardsData.data?.filter(r => r.is_active).length || 0}`,
        `Total Claims: ${claimsData.data?.length || 0}`,
        `Pending Submissions: ${submissionsData.data?.filter(s => s.status === 'pending').length || 0}`,
        '',
        '--- Claims by Status ---',
        `Pending: ${claimsData.data?.filter(c => c.status === 'pending').length || 0}`,
        `Approved: ${claimsData.data?.filter(c => c.status === 'approved').length || 0}`,
        `Processing: ${claimsData.data?.filter(c => c.status === 'processing').length || 0}`,
        `Completed: ${claimsData.data?.filter(c => c.status === 'completed').length || 0}`,
        '',
        '--- Rewards by Category ---',
        ...Object.entries((rewardsData.data || []).reduce((acc, reward) => {
          const category = reward.category || 'Other';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)).map(([cat, count]) => `${cat}: ${count}`),
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `admin-metrics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export Complete',
        description: 'Key metrics have been exported to CSV.',
      });
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export data',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>

        {/* Key Metrics Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-16 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const keyMetrics = [
    {
      title: 'Total Members',
      value: stats.total_users.toLocaleString(),
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Contributors',
      value: totalContributors.toLocaleString(),
      icon: Award,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Active Rewards',
      value: stats.total_rewards.toLocaleString(),
      icon: Gift,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Claims This Week',
      value: claimsThisWeek.toLocaleString(),
      icon: ShoppingCart,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  const needsAttention = [
    {
      show: stats.pending_claims > 0,
      count: stats.pending_claims,
      label: 'Claims Pending',
      description: 'Awaiting review',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-800',
      textColor: 'text-amber-700 dark:text-amber-400',
      icon: ShoppingCart,
      tab: 'claims',
    },
    {
      show: stats.pending_submissions > 0,
      count: stats.pending_submissions,
      label: 'Submissions to Review',
      description: 'New reward proposals',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-700 dark:text-blue-400',
      icon: FileText,
      tab: 'submissions',
    },
    {
      show: stats.low_stock_rewards > 0,
      count: stats.low_stock_rewards,
      label: 'Rewards Low Stock',
      description: 'Less than 5 remaining',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-700 dark:text-red-400',
      icon: Package,
      tab: 'rewards',
    },
  ];

  const showNeedsAttention = needsAttention.some(item => item.show);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's what's happening with your platform.
        </p>
      </div>

      {/* Row 1: Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {keyMetrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleNavigate('submissions')}
            >
              <FileText className="w-4 h-4" />
              Review Submissions
              {pendingSubmissions > 0 && (
                <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs">
                  {pendingSubmissions}
                </Badge>
              )}
            </Button>
            
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleNavigate('claims')}
            >
              <ClipboardList className="w-4 h-4" />
              Manage Claims
              {pendingClaims > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                  {pendingClaims}
                </Badge>
              )}
            </Button>
            
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleNavigate('rewards')}
            >
              <Gift className="w-4 h-4" />
              Manage Rewards
            </Button>
            
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleNavigate('users')}
            >
              <Flag className="w-4 h-4" />
              User Reports
            </Button>
            
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExportData}
            >
              <Download className="w-4 h-4" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Claims Over Last 30 Days - Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Claims Over Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={claimsChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                    tickFormatter={(value, index) => index % 5 === 0 ? value : ''}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    allowDecimals={false}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="claims" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rewards by Category - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Rewards by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {categoryChartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No category data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                    >
                      {categoryChartData.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--popover-foreground))'
                      }}
                      formatter={(value: number) => [`${value} rewards`, 'Count']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Needs Attention Section */}
      {showNeedsAttention && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Needs Attention
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {needsAttention.filter(item => item.show).map((item, index) => (
              <Card 
                key={index} 
                className={`${item.bgColor} border ${item.borderColor} cursor-pointer hover:shadow-md transition-all`}
                onClick={() => handleNavigate(item.tab)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-background/50`}>
                        <item.icon className={`w-5 h-5 ${item.textColor}`} />
                      </div>
                      <div>
                        <p className={`font-semibold ${item.textColor}`}>
                          {item.count} {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => handleNavigate('submissions')}
          >
            <ClipboardList className="w-4 h-4" />
            Review Submissions
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => handleNavigate('claims')}
          >
            <ShoppingCart className="w-4 h-4" />
            Process Claims
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => handleNavigate('rewards')}
          >
            <Plus className="w-4 h-4" />
            Add New Reward
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => handleNavigate('purchases')}
          >
            <CreditCard className="w-4 h-4" />
            View Purchases
          </Button>
        </div>
      </div>

      {/* Platform Overview & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stats Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Platform Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Monthly Revenue</span>
                <span className="font-semibold text-green-600">{formatCurrency(stats.revenue_this_month)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">All-Time Revenue</span>
                <span className="font-semibold">{formatCurrency(stats.revenue_all_time)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Pending Claims</span>
                <span className="font-semibold text-amber-600">{stats.pending_claims}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Processing Claims</span>
                <span className="font-semibold text-blue-600">{stats.processing_claims}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Low Stock Alerts</span>
                <span className={`font-semibold ${stats.low_stock_rewards > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.low_stock_rewards}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                    <div className="p-2 rounded-full bg-muted">
                      {getActivityIcon(item.activity_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
