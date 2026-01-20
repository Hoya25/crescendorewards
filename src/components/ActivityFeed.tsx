import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { ScrollArea } from './ui/scroll-area';
import { 
  CheckCircle2, Gift, Clock, TrendingUp, ShoppingBag, 
  Sparkles, AlertTriangle, FileCheck, Coins, ChevronRight,
  Bell, Package, Trophy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'claim_approved' | 'claim_pending' | 'new_reward' | 'low_stock' | 'purchase' | 'tier_change' | 'submission_approved' | 'submission_pending' | 'reward_claimed';
  icon: React.ElementType;
  iconColor: string;
  message: string;
  timestamp: Date;
  link?: string;
}

interface ActivityFeedProps {
  className?: string;
  maxItems?: number;
}

export function ActivityFeed({ className = '', maxItems = 10 }: ActivityFeedProps) {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchActivities();
    
    // Set up real-time subscriptions for relevant tables
    const claimsChannel = supabase
      .channel('activity-claims')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rewards_claims',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchActivities())
      .subscribe();

    const submissionsChannel = supabase
      .channel('activity-submissions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reward_submissions',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchActivities())
      .subscribe();

    const rewardsChannel = supabase
      .channel('activity-rewards')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rewards',
      }, () => fetchActivities())
      .subscribe();

    return () => {
      supabase.removeChannel(claimsChannel);
      supabase.removeChannel(submissionsChannel);
      supabase.removeChannel(rewardsChannel);
    };
  }, [user]);

  const fetchActivities = async () => {
    if (!user) return;
    
    setLoading(true);
    const activityItems: ActivityItem[] = [];

    try {
      // 1. Fetch user's claims with status
      const { data: claims } = await supabase
        .from('rewards_claims')
        .select('id, status, claimed_at, reward_id, rewards:reward_id(title)')
        .eq('user_id', user.id)
        .order('claimed_at', { ascending: false })
        .limit(5);

      if (claims) {
        claims.forEach((claim: any) => {
          const rewardTitle = claim.rewards?.title || 'Reward';
          if (claim.status === 'approved' || claim.status === 'completed') {
            activityItems.push({
              id: `claim-approved-${claim.id}`,
              type: 'claim_approved',
              icon: CheckCircle2,
              iconColor: 'text-green-500',
              message: `Your claim for "${rewardTitle}" was approved`,
              timestamp: new Date(claim.claimed_at),
              link: '/my-submissions?tab=claims',
            });
          } else if (claim.status === 'pending') {
            activityItems.push({
              id: `claim-pending-${claim.id}`,
              type: 'claim_pending',
              icon: Clock,
              iconColor: 'text-amber-500',
              message: `Your claim for "${rewardTitle}" is pending review`,
              timestamp: new Date(claim.claimed_at),
              link: '/my-submissions?tab=claims',
            });
          } else if (claim.status === 'shipped') {
            activityItems.push({
              id: `claim-shipped-${claim.id}`,
              type: 'claim_approved',
              icon: Package,
              iconColor: 'text-blue-500',
              message: `"${rewardTitle}" has been shipped!`,
              timestamp: new Date(claim.claimed_at),
              link: '/my-submissions?tab=claims',
            });
          }
        });
      }

      // 2. Fetch user's submission statuses
      const { data: submissions } = await supabase
        .from('reward_submissions')
        .select('id, title, status, updated_at, created_at')
        .eq('user_id', user.id)
        .eq('is_latest_version', true)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (submissions) {
        submissions.forEach((submission) => {
          if (submission.status === 'approved') {
            activityItems.push({
              id: `submission-approved-${submission.id}`,
              type: 'submission_approved',
              icon: FileCheck,
              iconColor: 'text-green-500',
              message: `Your submission "${submission.title}" was approved`,
              timestamp: new Date(submission.updated_at),
              link: '/my-submissions',
            });
          } else if (submission.status === 'pending') {
            activityItems.push({
              id: `submission-pending-${submission.id}`,
              type: 'submission_pending',
              icon: Clock,
              iconColor: 'text-amber-500',
              message: `"${submission.title}" is awaiting review`,
              timestamp: new Date(submission.created_at),
              link: '/my-submissions',
            });
          }
        });
      }

      // 3. Fetch recent new rewards (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: newRewards } = await supabase
        .from('rewards')
        .select('id, title, created_at')
        .eq('is_active', true)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      if (newRewards) {
        newRewards.forEach((reward) => {
          activityItems.push({
            id: `new-reward-${reward.id}`,
            type: 'new_reward',
            icon: Sparkles,
            iconColor: 'text-violet-500',
            message: `New reward added: "${reward.title}"`,
            timestamp: new Date(reward.created_at),
            link: `/rewards/${reward.id}`,
          });
        });
      }

      // 4. Fetch low stock rewards from user's wishlist
      const { data: wishlistLowStock } = await supabase
        .from('reward_wishlists')
        .select('reward_id, rewards:reward_id(id, title, stock_quantity)')
        .eq('user_id', user.id);

      if (wishlistLowStock) {
        wishlistLowStock.forEach((item: any) => {
          if (item.rewards?.stock_quantity !== null && 
              item.rewards?.stock_quantity > 0 && 
              item.rewards?.stock_quantity <= 5) {
            activityItems.push({
              id: `low-stock-${item.rewards.id}`,
              type: 'low_stock',
              icon: AlertTriangle,
              iconColor: 'text-orange-500',
              message: `"${item.rewards.title}" is almost out - only ${item.rewards.stock_quantity} left!`,
              timestamp: new Date(), // Current time as it's a status
              link: `/rewards/${item.rewards.id}`,
            });
          }
        });
      }

      // 5. Fetch recent purchases
      const { data: purchases } = await supabase
        .from('purchases')
        .select('id, claims_amount, package_name, created_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(3);

      if (purchases) {
        purchases.forEach((purchase) => {
          activityItems.push({
            id: `purchase-${purchase.id}`,
            type: 'purchase',
            icon: Coins,
            iconColor: 'text-emerald-500',
            message: `You purchased ${purchase.claims_amount} Claims (${purchase.package_name})`,
            timestamp: new Date(purchase.created_at),
            link: '/purchase-history',
          });
        });
      }

      // 6. Fetch membership history
      const { data: tierChanges } = await supabase
        .from('membership_history')
        .select('id, tier_name, previous_tier_name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2);

      if (tierChanges) {
        tierChanges.forEach((change) => {
          activityItems.push({
            id: `tier-${change.id}`,
            type: 'tier_change',
            icon: Trophy,
            iconColor: 'text-amber-500',
            message: change.previous_tier_name 
              ? `You upgraded from ${change.previous_tier_name} to ${change.tier_name}!`
              : `You reached ${change.tier_name} status!`,
            timestamp: new Date(change.created_at),
            link: '/membership',
          });
        });
      }

      // Sort by timestamp and limit
      activityItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setActivities(activityItems.slice(0, maxItems));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Gift className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs mt-1">Start by browsing rewards!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Recent Activity
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-auto max-h-[400px]">
          <div className="px-6 pb-4">
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id}>
                  <button
                    onClick={() => activity.link && navigate(activity.link)}
                    className="w-full flex items-start gap-3 py-3 text-left hover:bg-muted/50 rounded-lg transition-colors px-2 -mx-2 group"
                  >
                    <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 ${activity.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug group-hover:text-primary transition-colors">
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                    {activity.link && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                    )}
                  </button>
                  {index < activities.length - 1 && (
                    <div className="border-b border-border/50 mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <div className="px-6 pb-4 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/my-submissions')}
          >
            View All Activity
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
