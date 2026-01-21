import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Ticket, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Gift, 
  ShoppingBag, 
  ArrowLeft,
  Sparkles,
  Search,
  Send,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { supabase } from '@/lib/supabase';
import { format, formatDistanceToNow, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { SEO } from '@/components/SEO';

interface Transaction {
  id: string;
  type: 'purchase' | 'claim' | 'gift_sent' | 'gift_received' | 'admin_credit';
  amount: number;
  description: string;
  timestamp: Date;
  status?: string;
  metadata?: Record<string, any>;
}

type DateRangeFilter = 'all' | '7days' | '30days' | '90days';
type TypeFilter = 'all' | 'purchase' | 'claim' | 'gift_sent' | 'gift_received' | 'admin_credit';

export function ClaimsPage() {
  const navigate = useNavigate();
  const { profile, refreshUnifiedProfile } = useUnifiedUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('all');
  const [stats, setStats] = useState({
    totalPurchased: 0,
    totalSpent: 0,
    totalGifted: 0,
    totalReceived: 0,
  });

  const claimsBalance = profile?.crescendo_data?.claims_balance || 0;
  const isLow = claimsBalance < 10;
  const isEmpty = claimsBalance === 0;

  const fetchTransactionHistory = async (showRefreshing = false) => {
    if (!profile?.auth_user_id) return;
    
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      
      const userId = profile.auth_user_id;
      const txns: Transaction[] = [];

      // Fetch ALL purchases (no limit for full history)
      const { data: purchases } = await supabase
        .from('purchases')
        .select('id, claims_amount, package_name, amount_paid, created_at, status')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (purchases) {
        purchases.forEach(p => {
          txns.push({
            id: `purchase-${p.id}`,
            type: 'purchase',
            amount: p.claims_amount,
            description: p.package_name,
            timestamp: new Date(p.created_at),
            metadata: { amount_paid: p.amount_paid },
          });
        });
      }

      // Fetch ALL claims (spending)
      const { data: claims } = await supabase
        .from('rewards_claims')
        .select('id, claimed_at, status, delivery_status, shipping_info, rewards:reward_id(title, cost)')
        .eq('user_id', userId)
        .order('claimed_at', { ascending: false });

      if (claims) {
        claims.forEach((c: any) => {
          const cost = c.shipping_info?.tier_price || c.rewards?.cost || 0;
          txns.push({
            id: `claim-${c.id}`,
            type: 'claim',
            amount: -cost,
            description: c.rewards?.title || 'Reward',
            timestamp: new Date(c.claimed_at),
            status: c.delivery_status || c.status,
          });
        });
      }

      // Fetch ALL gifts sent
      const { data: giftsSent } = await supabase
        .from('claim_gifts')
        .select('id, claims_amount, recipient_email, message, created_at, status')
        .eq('sender_id', profile.id)
        .order('created_at', { ascending: false });

      if (giftsSent) {
        giftsSent.forEach(g => {
          txns.push({
            id: `gift-sent-${g.id}`,
            type: 'gift_sent',
            amount: -g.claims_amount,
            description: `Gift to ${g.recipient_email || 'recipient'}`,
            timestamp: new Date(g.created_at),
            status: g.status,
            metadata: { message: g.message },
          });
        });
      }

      // Fetch ALL gifts received (including admin credits)
      const { data: giftsReceived } = await supabase
        .from('claim_gifts')
        .select('id, claims_amount, message, admin_notes, created_at, status, is_admin_gift')
        .eq('recipient_id', profile.id)
        .eq('status', 'claimed')
        .order('created_at', { ascending: false });

      if (giftsReceived) {
        giftsReceived.forEach(g => {
          txns.push({
            id: `gift-received-${g.id}`,
            type: g.is_admin_gift ? 'admin_credit' : 'gift_received',
            amount: g.claims_amount,
            description: g.is_admin_gift 
              ? (g.admin_notes || 'Admin Credit') 
              : (g.message || 'Gift received'),
            timestamp: new Date(g.created_at),
          });
        });
      }

      // Sort by timestamp
      txns.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setTransactions(txns);

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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactionHistory();
  }, [profile]);

  const handleRefresh = () => {
    fetchTransactionHistory(true);
    refreshUnifiedProfile();
  };

  // Filter transactions based on search, type, and date
  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!txn.description.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'all' && txn.type !== typeFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const daysMap: Record<DateRangeFilter, number> = {
          '7days': 7,
          '30days': 30,
          '90days': 90,
          'all': 0,
        };
        const days = daysMap[dateFilter];
        const startDate = startOfDay(subDays(new Date(), days));
        const endDate = endOfDay(new Date());
        
        if (!isWithinInterval(txn.timestamp, { start: startDate, end: endDate })) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, searchQuery, typeFilter, dateFilter]);

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

  const getTypeBadge = (type: Transaction['type']) => {
    const variants: Record<Transaction['type'], { label: string; className: string }> = {
      purchase: { label: 'Purchase', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      claim: { label: 'Redemption', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
      gift_sent: { label: 'Gift Sent', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      gift_received: { label: 'Gift Received', className: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
      admin_credit: { label: 'Admin Credit', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    };
    const variant = variants[type];
    return <Badge className={cn("font-medium", variant.className)}>{variant.label}</Badge>;
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      approved: { label: 'Approved', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      shipped: { label: 'Shipped', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
      delivered: { label: 'Delivered', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      claimed: { label: 'Claimed', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    };
    
    const statusInfo = statusMap[status.toLowerCase()] || { label: status, className: 'bg-muted text-muted-foreground' };
    return <Badge variant="outline" className={cn("text-xs", statusInfo.className)}>{statusInfo.label}</Badge>;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Status'];
    const rows = filteredTransactions.map(txn => [
      format(txn.timestamp, 'yyyy-MM-dd HH:mm'),
      txn.type,
      txn.description,
      txn.amount.toString(),
      txn.status || '',
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claims-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <SEO 
        title="Claims Account" 
        description="View your claims balance and transaction history"
      />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
                <SidebarTrigger className="-ml-1" />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/dashboard')}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Dashboard
                </Button>
                <div className="flex-1" />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="gap-2"
                >
                  <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </header>

            <main className="flex-1 p-4 lg:p-6 space-y-6">
              {/* Balance Card */}
              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Balance Display */}
                    <div className={cn(
                      "flex-1 p-6 rounded-xl text-center relative overflow-hidden",
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

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 lg:w-80">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                          Purchased
                        </div>
                        <p className="text-xl font-semibold text-green-600">+{stats.totalPurchased.toLocaleString()}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <TrendingDown className="w-3.5 h-3.5 text-violet-500" />
                          Redeemed
                        </div>
                        <p className="text-xl font-semibold text-violet-600">-{stats.totalSpent.toLocaleString()}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Send className="w-3.5 h-3.5 text-blue-500" />
                          Gifted
                        </div>
                        <p className="text-xl font-semibold text-blue-600">-{stats.totalGifted.toLocaleString()}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Gift className="w-3.5 h-3.5 text-pink-500" />
                          Received
                        </div>
                        <p className="text-xl font-semibold text-pink-600">+{stats.totalReceived.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 lg:w-40">
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
                  </div>
                </CardContent>
              </Card>

              {/* Transaction History */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-primary" />
                      Transaction History
                    </CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={exportToCSV}
                      disabled={filteredTransactions.length === 0}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </Button>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
                      <SelectTrigger className="w-full sm:w-44">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="purchase">Purchases</SelectItem>
                        <SelectItem value="claim">Redemptions</SelectItem>
                        <SelectItem value="gift_sent">Gifts Sent</SelectItem>
                        <SelectItem value="gift_received">Gifts Received</SelectItem>
                        <SelectItem value="admin_credit">Admin Credits</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateRangeFilter)}>
                      <SelectTrigger className="w-full sm:w-40">
                        <Calendar className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Date Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="7days">Last 7 Days</SelectItem>
                        <SelectItem value="30days">Last 30 Days</SelectItem>
                        <SelectItem value="90days">Last 90 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No transactions found</p>
                      <p className="text-sm mt-1">
                        {searchQuery || typeFilter !== 'all' || dateFilter !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Your transaction history will appear here'}
                      </p>
                      {transactions.length === 0 && (
                        <Button 
                          variant="link" 
                          onClick={() => navigate('/buy-claims')}
                          className="mt-4"
                        >
                          Get your first claims
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12"></TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredTransactions.map(txn => (
                              <TableRow key={txn.id}>
                                <TableCell>
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    {getTransactionIcon(txn.type)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{format(txn.timestamp, 'MMM d, yyyy')}</p>
                                    <p className="text-xs text-muted-foreground">{format(txn.timestamp, 'h:mm a')}</p>
                                  </div>
                                </TableCell>
                                <TableCell>{getTypeBadge(txn.type)}</TableCell>
                                <TableCell>
                                  <p className="truncate max-w-[200px]" title={txn.description}>
                                    {txn.description}
                                  </p>
                                </TableCell>
                                <TableCell>{getStatusBadge(txn.status)}</TableCell>
                                <TableCell className="text-right">
                                  <span className={cn(
                                    "text-sm font-semibold tabular-nums",
                                    txn.amount > 0 ? "text-green-600" : "text-muted-foreground"
                                  )}>
                                    {txn.amount > 0 ? '+' : ''}{txn.amount.toLocaleString()}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-3">
                        {filteredTransactions.map(txn => (
                          <div 
                            key={txn.id}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                              {getTransactionIcon(txn.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {getTypeBadge(txn.type)}
                                {getStatusBadge(txn.status)}
                              </div>
                              <p className="text-sm font-medium truncate">{txn.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(txn.timestamp, { addSuffix: true })}
                              </p>
                            </div>
                            <div className={cn(
                              "text-lg font-bold tabular-nums shrink-0",
                              txn.amount > 0 ? "text-green-600" : "text-muted-foreground"
                            )}>
                              {txn.amount > 0 ? '+' : ''}{txn.amount.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="mt-6 pt-4 border-t flex justify-between items-center text-sm text-muted-foreground">
                        <span>Showing {filteredTransactions.length} of {transactions.length} transactions</span>
                        <span>
                          Net: <span className={cn(
                            "font-semibold",
                            filteredTransactions.reduce((sum, t) => sum + t.amount, 0) >= 0 
                              ? "text-green-600" 
                              : "text-red-600"
                          )}>
                            {filteredTransactions.reduce((sum, t) => sum + t.amount, 0) >= 0 ? '+' : ''}
                            {filteredTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                          </span>
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}

export default ClaimsPage;
