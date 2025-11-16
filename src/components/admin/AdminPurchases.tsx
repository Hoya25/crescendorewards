import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth, startOfDay, endOfDay, subDays, subMonths, startOfQuarter, endOfQuarter } from 'date-fns';
import { DollarSign, Package, TrendingUp, Users, CalendarIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Purchase {
  id: string;
  user_id: string;
  package_id: string;
  package_name: string;
  claims_amount: number;
  amount_paid: number;
  currency: string;
  status: string;
  created_at: string;
  profiles: {
    email: string;
    full_name: string;
  };
}

type DateRange = 'week' | 'month' | 'last7' | 'last30' | 'quarter' | 'all' | 'custom';

interface DateRangeSelection {
  from: Date | undefined;
  to: Date | undefined;
}

export function AdminPurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRangeSelection>({
    from: undefined,
    to: undefined
  });

  useEffect(() => {
    fetchPurchases();
  }, [dateRange, customDateRange]);

  const getDateRangeFilter = () => {
    const now = new Date();
    
    switch (dateRange) {
      case 'week':
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 })
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'last7':
        return {
          start: startOfDay(subDays(now, 7)),
          end: endOfDay(now)
        };
      case 'last30':
        return {
          start: startOfDay(subDays(now, 30)),
          end: endOfDay(now)
        };
      case 'quarter':
        return {
          start: startOfQuarter(now),
          end: endOfQuarter(now)
        };
      case 'custom':
        if (customDateRange.from && customDateRange.to) {
          return {
            start: startOfDay(customDateRange.from),
            end: endOfDay(customDateRange.to)
          };
        }
        return null;
      case 'all':
        return null;
    }
  };

  const fetchPurchases = async () => {
    try {
      let query = supabase
        .from('purchases')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply date range filter
      const dateFilter = getDateRangeFilter();
      if (dateFilter) {
        query = query
          .gte('created_at', dateFilter.start.toISOString())
          .lte('created_at', dateFilter.end.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch profile data separately for each purchase
      const purchasesWithProfiles = await Promise.all(
        (data || []).map(async (purchase) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', purchase.user_id)
            .single();

          return {
            ...purchase,
            profiles: profile || { email: 'Unknown', full_name: 'Unknown' }
          };
        })
      );

      setPurchases(purchasesWithProfiles);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getTotalRevenue = () => {
    return purchases.reduce((sum, purchase) => sum + purchase.amount_paid, 0);
  };

  const getTotalClaims = () => {
    return purchases.reduce((sum, purchase) => sum + purchase.claims_amount, 0);
  };

  const getUniqueCustomers = () => {
    return new Set(purchases.map(p => p.user_id)).size;
  };

  const getAverageOrderValue = () => {
    if (purchases.length === 0) return 0;
    return getTotalRevenue() / purchases.length;
  };

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'last7':
        return 'Last 7 Days';
      case 'last30':
        return 'Last 30 Days';
      case 'quarter':
        return 'This Quarter';
      case 'custom':
        if (customDateRange.from && customDateRange.to) {
          return `${format(customDateRange.from, 'MMM d')} - ${format(customDateRange.to, 'MMM d, yyyy')}`;
        }
        return 'Custom Range';
      case 'all':
        return 'All Time';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Purchase Management</h2>
            <p className="text-muted-foreground">Track all user purchases and revenue</p>
          </div>
          <div className="flex flex-col gap-2">
            <Tabs value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)} className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="last7">Last 7d</TabsTrigger>
                <TabsTrigger value="last30">Last 30d</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
                <TabsTrigger value="quarter">Quarter</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2">
              <Button
                variant={dateRange === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('week')}
              >
                This Week
              </Button>
              <Button
                variant={dateRange === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('all')}
              >
                All Time
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateRange === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !customDateRange.from && dateRange === 'custom' && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange === 'custom' && customDateRange.from && customDateRange.to ? (
                      `${format(customDateRange.from, 'MMM d')} - ${format(customDateRange.to, 'MMM d')}`
                    ) : (
                      <span>Custom</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={{
                      from: customDateRange.from,
                      to: customDateRange.to
                    }}
                    onSelect={(range) => {
                      setCustomDateRange({
                        from: range?.from,
                        to: range?.to
                      });
                      if (range?.from && range?.to) {
                        setDateRange('custom');
                      }
                    }}
                    numberOfMonths={2}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Purchase Management</h2>
        <p className="text-muted-foreground">Track all user purchases and revenue</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(getTotalRevenue(), 'usd')}
            </div>
            <p className="text-xs text-muted-foreground">
              From {purchases.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchases.length}</div>
            <p className="text-xs text-muted-foreground">
              All time transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getUniqueCustomers()}</div>
            <p className="text-xs text-muted-foreground">
              Active buyers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(getAverageOrderValue(), 'usd')}
            </div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Purchases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Purchases</CardTitle>
          <CardDescription>
            Showing purchases for: {getDateRangeLabel()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No purchases found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead className="text-right">Claims</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(purchase.created_at), 'MMM d, yyyy')}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(purchase.created_at), 'h:mm a')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {purchase.profiles?.full_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {purchase.profiles?.email || 'No email'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{purchase.package_name}</div>
                        <div className="text-xs text-muted-foreground">
                          ID: {purchase.package_id}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Package className="h-3 w-3" />
                          {purchase.claims_amount}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(purchase.amount_paid, purchase.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={purchase.status === 'completed' ? 'default' : 'secondary'}>
                          {purchase.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
