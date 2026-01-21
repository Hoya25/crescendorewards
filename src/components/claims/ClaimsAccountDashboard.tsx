import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Ticket, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Gift, 
  ShoppingBag, 
  ArrowRight,
  Sparkles,
  History,
  Send
} from 'lucide-react';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  type: 'purchase' | 'claim' | 'gift_sent' | 'gift_received' | 'admin_credit';
  amount: number;
  description: string;
  timestamp: Date;
  status?: string;
}

export function ClaimsAccountDashboard() {
  const navigate = useNavigate();
  const { profile, refreshUnifiedProfile } = useUnifiedUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPurchased: 0,
    totalSpent: 0,
    totalGifted: 0,
    totalReceived: 0,
  });

  const claimsBalance = profile?.crescendo_data?.claims_balance || 0;
  const isLow = claimsBalance < 10;
  const isEmpty = claimsBalance === 0;

  useEffect(() => {
    const fetchTransactionHistory = async () => {
      if (!profile?.auth_user_id) return;
      
      try {
        setLoading(true);
        const userId = profile.auth_user_id;
        const txns: Transaction[] = [];

        // Fetch purchases
        const { data: purchases } = await supabase
          .from('purchases')
          .select('id, claims_amount, package_name, created_at, status')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(10);

        if (purchases) {
          purchases.forEach(p => {
            txns.push({
              id: `purchase-${p.id}`,
              type: 'purchase',
              amount: p.claims_amount,
              description: p.package_name,
              timestamp: new Date(p.created_at),
            });
          });
        }

        // Fetch claims (spending)
        const { data: claims } = await supabase
          .from('rewards_claims')
          .select('id, claimed_at, status, shipping_info, rewards:reward_id(title, cost)')
          .eq('user_id', userId)
          .order('claimed_at', { ascending: false })
          .limit(10);

        if (claims) {
          claims.forEach((c: any) => {
            const cost = c.shipping_info?.tier_price || c.rewards?.cost || 0;
            txns.push({
              id: `claim-${c.id}`,
              type: 'claim',
              amount: -cost,
              description: c.rewards?.title || 'Reward',
              timestamp: new Date(c.claimed_at),
              status: c.status,
            });
          });
        }

        // Fetch gifts sent
        const { data: giftsSent } = await supabase
          .from('claim_gifts')
          .select('id, claims_amount, recipient_email, created_at, status')
          .eq('sender_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (giftsSent) {
          giftsSent.forEach(g => {
            txns.push({
              id: `gift-sent-${g.id}`,
              type: 'gift_sent',
              amount: -g.claims_amount,
              description: `Gift to ${g.recipient_email || 'recipient'}`,
              timestamp: new Date(g.created_at),
              status: g.status,
            });
          });
        }

        // Fetch gifts received
        const { data: giftsReceived } = await supabase
          .from('claim_gifts')
          .select('id, claims_amount, message, created_at, status, is_admin_gift')
          .eq('recipient_id', profile.id)
          .eq('status', 'claimed')
          .order('created_at', { ascending: false })
          .limit(5);

        if (giftsReceived) {
          giftsReceived.forEach(g => {
            txns.push({
              id: `gift-received-${g.id}`,
              type: g.is_admin_gift ? 'admin_credit' : 'gift_received',
              amount: g.claims_amount,
              description: g.is_admin_gift ? 'Admin Credit' : (g.message || 'Gift received'),
              timestamp: new Date(g.created_at),
            });
          });
        }

        // Sort by timestamp
        txns.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setTransactions(txns.slice(0, 10));

        // Calculate stats
        const totalPurchased = purchases?.reduce((sum, p) => sum + p.claims_amount, 0) || 0;
        const totalSpent = claims?.reduce((sum: number, c: any) => {
          const cost = c.shipping_info?.tier_price || c.rewards?.cost || 0;
          return sum + cost;
        }, 0) || 0;
        const totalGifted = giftsSent?.reduce((sum, g) => sum + g.claims_amount, 0) || 0;
        const totalReceived = giftsReceived?.reduce((sum, g) => sum + g.claims_amount, 0) || 0;

        setStats({ totalPurchased, totalSpent, totalGifted, totalReceived });
      } catch (error) {
        console.error('Error fetching transaction history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionHistory();
  }, [profile]);

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'purchase':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'claim':
        return <ShoppingBag className="w-4 h-4 text-violet-600" />;
      case 'gift_sent':
        return <Send className="w-4 h-4 text-blue-600" />;
      case 'gift_received':
        return <Gift className="w-4 h-4 text-pink-600" />;
      case 'admin_credit':
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      default:
        return <Ticket className="w-4 h-4" />;
    }
  };

  if (loading && !profile) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ticket className="w-5 h-5 text-primary" />
            Claims Account
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => refreshUnifiedProfile()}>
            <History className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Balance Display */}
        <div className={cn(
          "p-6 rounded-xl text-center relative overflow-hidden",
          isEmpty 
            ? "bg-gradient-to-br from-red-500/10 to-red-600/20 border border-red-200 dark:border-red-800"
            : isLow 
              ? "bg-gradient-to-br from-amber-500/10 to-orange-500/20 border border-amber-200 dark:border-amber-800"
              : "bg-gradient-to-br from-violet-500/10 to-purple-500/20 border border-violet-200 dark:border-violet-800"
        )}>
          <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
          <div className="flex items-center justify-center gap-3">
            <Ticket className={cn(
              "w-8 h-8",
              isEmpty ? "text-red-500" : isLow ? "text-amber-500" : "text-violet-500"
            )} />
            <span className={cn(
              "text-5xl font-bold tabular-nums",
              isEmpty ? "text-red-600" : isLow ? "text-amber-600" : "text-foreground"
            )}>
              {claimsBalance.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Claims</p>
          
          {isLow && (
            <Badge 
              variant={isEmpty ? "destructive" : "secondary"}
              className="mt-3"
            >
              {isEmpty ? "No claims available" : "Low balance"}
            </Badge>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              Total Purchased
            </div>
            <p className="text-lg font-semibold text-green-600">+{stats.totalPurchased.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-violet-500" />
              Total Claimed
            </div>
            <p className="text-lg font-semibold text-violet-600">-{stats.totalSpent.toLocaleString()}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={() => navigate('/buy-claims')}
            className={cn(
              "gap-2",
              isLow 
                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                : "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            )}
          >
            <Plus className="w-4 h-4" />
            Get Claims
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/gift-claims')}
            className="gap-2"
          >
            <Gift className="w-4 h-4" />
            Send Gift
          </Button>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-muted-foreground">Recent Activity</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs gap-1 h-7"
              onClick={() => navigate('/claims')}
            >
              View All <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Ticket className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No transactions yet</p>
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => navigate('/buy-claims')}
                className="mt-1"
              >
                Get your first claims
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 5).map(txn => (
                <div 
                  key={txn.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {getTransactionIcon(txn.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{txn.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(txn.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                  <div className={cn(
                    "text-sm font-semibold tabular-nums",
                    txn.amount > 0 ? "text-green-600" : "text-muted-foreground"
                  )}>
                    {txn.amount > 0 ? '+' : ''}{txn.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
