import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Clock, Sparkles, History, Hourglass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Skeleton } from './ui/skeleton';

interface AttentionItem {
  id: string;
  icon: React.ElementType;
  count: number;
  label: string;
  cta: string;
  link: string;
  gradient: string;
  iconColor: string;
}

const LAST_VISIT_KEY = 'crescendo_last_rewards_visit';

export function NeedsAttention() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AttentionItem[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchAttentionItems = async () => {
      setLoading(true);
      const attentionItems: AttentionItem[] = [];

      try {
        // 1. New Rewards (added since last visit)
        const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
        const lastVisitDate = lastVisit ? new Date(lastVisit) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default to 7 days ago
        
        const { count: newRewardsCount } = await supabase
          .from('rewards')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)
          .gte('created_at', lastVisitDate.toISOString());

        if (newRewardsCount && newRewardsCount > 0) {
          attentionItems.push({
            id: 'new-rewards',
            icon: Sparkles,
            count: newRewardsCount,
            label: 'New Rewards',
            cta: 'Browse',
            link: '/rewards?sort=newest',
            gradient: 'from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20',
            iconColor: 'text-violet-500',
          });
        }

        // 2. Claims this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: claimsCount } = await supabase
          .from('rewards_claims')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('claimed_at', startOfMonth.toISOString());

        if (claimsCount !== null) {
          attentionItems.push({
            id: 'claims-history',
            icon: History,
            count: claimsCount,
            label: claimsCount === 1 ? 'claim this month' : 'claims this month',
            cta: 'View history',
            link: '/my-submissions?tab=claims',
            gradient: 'from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20',
            iconColor: 'text-blue-500',
          });
        }

        // 3. Pending submissions (for contributors)
        const { count: pendingSubmissions } = await supabase
          .from('reward_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .eq('is_latest_version', true);

        if (pendingSubmissions && pendingSubmissions > 0) {
          attentionItems.push({
            id: 'pending',
            icon: Hourglass,
            count: pendingSubmissions,
            label: 'Pending Review',
            cta: 'Check status',
            link: '/my-submissions',
            gradient: 'from-amber-500/10 to-yellow-500/10 dark:from-amber-500/20 dark:to-yellow-500/20',
            iconColor: 'text-amber-500',
          });
        }

        // 4. Unlocking Soon (rewards with locks expiring in 7 days)
        // This is a placeholder - would need a locks/staking table to implement properly
        // For now, we'll show wishlist items that might need attention
        const { count: wishlistCount } = await supabase
          .from('reward_wishlists')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (wishlistCount && wishlistCount > 0) {
          attentionItems.push({
            id: 'wishlist',
            icon: Clock,
            count: wishlistCount,
            label: 'Saved to Wishlist',
            cta: 'View',
            link: '/wishlist',
            gradient: 'from-emerald-500/10 to-green-500/10 dark:from-emerald-500/20 dark:to-green-500/20',
            iconColor: 'text-emerald-500',
          });
        }

        setItems(attentionItems);
      } catch (error) {
        console.error('Error fetching attention items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttentionItems();
  }, [user]);

  // Update last visit timestamp when visiting rewards
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Needs Your Attention</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border border-border">
              <CardContent className="p-4">
                <Skeleton className="w-10 h-10 rounded-full mb-3" />
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Don't show section if no items need attention
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Needs Your Attention</h2>
      <div className={`grid grid-cols-2 gap-3 ${items.length <= 2 ? 'md:grid-cols-2' : items.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.id}
              className={`cursor-pointer border border-border hover:border-primary/30 transition-all hover:shadow-md group bg-gradient-to-br ${item.gradient}`}
              onClick={() => navigate(item.link)}
            >
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-full bg-background flex items-center justify-center mb-3 shadow-sm`}>
                  <Icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <div className="text-3xl font-bold text-foreground mb-0.5">
                  {item.count}
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {item.label}
                </div>
                <span className="text-xs font-medium text-primary group-hover:underline">
                  {item.cta} →
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
