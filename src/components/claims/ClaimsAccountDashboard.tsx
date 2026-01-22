import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ShoppingBag, 
  ArrowRight,
  Clock,
  CheckCircle2,
  Truck,
  Package
} from 'lucide-react';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface RecentClaim {
  id: string;
  rewardTitle: string;
  rewardImage: string | null;
  claimedAt: Date;
  status: string;
  cost: number;
}

export function ClaimsAccountDashboard() {
  const navigate = useNavigate();
  const { profile } = useUnifiedUser();
  const [recentClaims, setRecentClaims] = useState<RecentClaim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentClaims = async () => {
      if (!profile?.auth_user_id) return;
      
      try {
        setLoading(true);
        const userId = profile.auth_user_id;

        // Fetch last 3 claims
        const { data: claims, error } = await supabase
          .from('rewards_claims')
          .select('id, claimed_at, status, shipping_info, rewards:reward_id(title, cost, image_url)')
          .eq('user_id', userId)
          .order('claimed_at', { ascending: false })
          .limit(3);

        if (error) {
          console.error('Error fetching claims:', error);
          return;
        }

        if (claims) {
          const mapped: RecentClaim[] = claims.map((c: any) => ({
            id: c.id,
            rewardTitle: c.rewards?.title || 'Reward',
            rewardImage: c.rewards?.image_url || null,
            claimedAt: new Date(c.claimed_at),
            status: c.status,
            cost: c.shipping_info?.tier_price || c.rewards?.cost || 0,
          }));
          setRecentClaims(mapped);
        }
      } catch (error) {
        console.error('Error fetching recent claims:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentClaims();
  }, [profile]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3.5 h-3.5 text-amber-500" />;
      case 'approved':
      case 'processing':
        return <Package className="w-3.5 h-3.5 text-blue-500" />;
      case 'shipped':
        return <Truck className="w-3.5 h-3.5 text-violet-500" />;
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'approved':
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'completed':
        return 'Delivered';
      default:
        return status;
    }
  };

  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Recent Claims
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs gap-1 h-7"
            onClick={() => navigate('/claims')}
          >
            View All <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : recentClaims.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground mb-1">No claims yet</p>
            <p className="text-xs text-muted-foreground/70 mb-4">
              Your claimed rewards will appear here
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/rewards')}
              className="gap-2"
            >
              Browse Rewards
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentClaims.map(claim => (
              <div 
                key={claim.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate('/claims')}
              >
                {/* Reward Image */}
                <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                  {claim.rewardImage ? (
                    <img 
                      src={claim.rewardImage} 
                      alt={claim.rewardTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                {/* Claim Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{claim.rewardTitle}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(claim.claimedAt, { addSuffix: true })}
                    </span>
                  </div>
                </div>
                
                {/* Status Badge */}
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs gap-1 shrink-0",
                    claim.status === 'completed' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                    claim.status === 'shipped' && "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
                    claim.status === 'pending' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  )}
                >
                  {getStatusIcon(claim.status)}
                  {getStatusLabel(claim.status)}
                </Badge>
              </div>
            ))}
            
            {/* Quick action if user has claims */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2 gap-2"
              onClick={() => navigate('/rewards')}
            >
              <ShoppingBag className="w-4 h-4" />
              Claim More Rewards
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
