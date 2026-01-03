import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  Clock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

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

interface AdminDashboardProps {
  onNavigate?: (tab: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadActivity();
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

        {/* Needs Attention Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>

        {/* Activity Feed Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24 mt-1" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
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
      title: 'Active This Week',
      value: stats.active_users_7d.toLocaleString(),
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats.revenue_this_month),
      icon: DollarSign,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'All-Time Revenue',
      value: formatCurrency(stats.revenue_all_time),
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
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

      {/* Key Metrics Cards */}
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

      {/* Platform Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stats Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Platform Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Active Rewards</span>
                <span className="font-semibold">{stats.total_rewards}</span>
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