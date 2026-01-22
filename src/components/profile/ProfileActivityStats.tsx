import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { 
  Gift, 
  ShoppingCart, 
  TrendingUp, 
  Clock, 
  Crown,
  Activity,
  Star,
  Heart
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  amount: number;
  created_at: string;
  metadata?: unknown;
}

interface Stats {
  total_claims: number;
  total_purchases: number;
  total_wishlisted: number;
  tier_changes: number;
  member_since: string | null;
}

export function ProfileActivityStats() {
  const { profile, tier, loading: userLoading } = useUnifiedUser();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_claims: 0,
    total_purchases: 0,
    total_wishlisted: 0,
    tier_changes: 0,
    member_since: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchActivityAndStats();
    }
  }, [profile?.id]);

  const fetchActivityAndStats = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    try {
      // Fetch user activity
      const { data: activityData, error: activityError } = await supabase
        .rpc('get_user_activity', { p_user_id: profile.id, p_limit: 5 });
      
      if (activityError) {
        console.error('Error fetching activity:', activityError);
      } else {
        setActivities((activityData || []) as ActivityItem[]);
      }

      // Fetch stats in parallel
      const [claimsResult, purchasesResult, wishlistResult, historyResult] = await Promise.all([
        supabase
          .from('rewards_claims')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id),
        supabase
          .from('purchases')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('status', 'completed'),
        supabase
          .from('reward_wishlists')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id),
        supabase
          .from('membership_history')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id),
      ]);

      setStats({
        total_claims: claimsResult.count || 0,
        total_purchases: purchasesResult.count || 0,
        total_wishlisted: wishlistResult.count || 0,
        tier_changes: historyResult.count || 0,
        member_since: profile.created_at || null,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'claim':
        return <Gift className="w-4 h-4 text-primary" />;
      case 'purchase':
        return <ShoppingCart className="w-4 h-4 text-accent-foreground" />;
      case 'tier_change':
        return <Crown className="w-4 h-4 text-primary" />;
      case 'wishlist':
        return <Heart className="w-4 h-4 text-destructive" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (userLoading || loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity & Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Activity & Stats
            </CardTitle>
            <CardDescription>Your Crescendo journey at a glance</CardDescription>
          </div>
          {tier && (
            <Badge 
              variant="outline" 
              className="gap-1"
              style={{ borderColor: tier.badge_color, color: tier.badge_color }}
            >
              {tier.badge_emoji} {tier.display_name}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary">Rewards Claimed</span>
            </div>
            <p className="text-2xl font-bold">{stats.total_claims}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-accent border border-accent">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="w-4 h-4 text-accent-foreground" />
              <span className="text-xs font-medium text-accent-foreground">Purchases</span>
            </div>
            <p className="text-2xl font-bold">{stats.total_purchases}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-secondary border border-secondary">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-secondary-foreground" />
              <span className="text-xs font-medium text-secondary-foreground">Wishlisted</span>
            </div>
            <p className="text-2xl font-bold">{stats.total_wishlisted}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-muted border border-border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-foreground" />
              <span className="text-xs font-medium text-foreground">Tier Upgrades</span>
            </div>
            <p className="text-2xl font-bold">{stats.tier_changes}</p>
          </div>
        </div>

        {/* Member Since */}
        {stats.member_since && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-lg bg-muted/50">
            <Star className="w-4 h-4" />
            <span>
              Member since {formatDistanceToNow(new Date(stats.member_since), { addSuffix: true })}
            </span>
          </div>
        )}

        {/* Recent Activity */}
        {activities.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Recent Activity
            </h4>
            <div className="space-y-2">
              {activities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activities.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity yet</p>
            <p className="text-xs">Start claiming rewards to see your activity here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
