import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format, formatDistanceToNow, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { History, TrendingUp, TrendingDown, ArrowRightLeft, Download, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const TIER_EMOJIS: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  diamond: '👑',
};

interface NCTRHistoryPanelProps {
  userId?: string;
  showFilters?: boolean;
  limit?: number;
}

export function NCTRHistoryPanel({ userId, showFilters = true, limit = 50 }: NCTRHistoryPanelProps) {
  const [adjustmentTypeFilter, setAdjustmentTypeFilter] = useState<string>('all');
  const [adminFilter, setAdminFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(new Date()),
  });

  // Fetch adjustments
  const { data: adjustments, isLoading } = useQuery({
    queryKey: ['nctr-adjustments-history', userId, adjustmentTypeFilter, adminFilter, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('admin_nctr_adjustments')
        .select(`
          *,
          admin:admin_id (
            display_name,
            email
          ),
          user:user_id (
            display_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (adjustmentTypeFilter !== 'all') {
        query = query.eq('adjustment_type', adjustmentTypeFilter);
      }

      if (dateRange.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch unique admins for filter
  const { data: admins } = useQuery({
    queryKey: ['adjustment-admins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_nctr_adjustments')
        .select('admin_id, admin:admin_id(display_name, email)')
        .limit(100);
      if (error) throw error;
      
      // Dedupe by admin_id
      const uniqueAdmins = new Map();
      data?.forEach((item: any) => {
        if (item.admin_id && item.admin) {
          uniqueAdmins.set(item.admin_id, item.admin);
        }
      });
      return Array.from(uniqueAdmins.entries());
    },
    enabled: showFilters,
  });

  // Calculate summary stats
  const stats = adjustments?.reduce(
    (acc, adj) => {
      if (adj.adjustment_type === 'add') {
        acc.totalAdded += Number(adj.amount);
        acc.addCount++;
      } else if (adj.adjustment_type === 'subtract') {
        acc.totalSubtracted += Number(adj.amount);
        acc.subtractCount++;
      }
      acc.total++;
      return acc;
    },
    { totalAdded: 0, totalSubtracted: 0, addCount: 0, subtractCount: 0, total: 0 }
  ) || { totalAdded: 0, totalSubtracted: 0, addCount: 0, subtractCount: 0, total: 0 };

  const netChange = stats.totalAdded - stats.totalSubtracted;

  const exportToCSV = () => {
    if (!adjustments?.length) return;

    const headers = ['Date', 'User', 'Type', 'Amount', 'Previous Balance', 'New Balance', 'Previous Tier', 'New Tier', 'Reason', 'Admin'];
    const rows = adjustments.map((adj: any) => [
      format(new Date(adj.created_at), 'yyyy-MM-dd HH:mm'),
      adj.user?.display_name || adj.user?.email || adj.user_id,
      adj.adjustment_type,
      adj.amount,
      adj.previous_balance,
      adj.new_balance,
      adj.previous_tier || '',
      adj.new_tier || '',
      adj.reason,
      adj.admin?.display_name || adj.admin?.email || adj.admin_id,
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nctr-adjustments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Total Added</span>
            </div>
            <p className="text-2xl font-bold text-green-600">+{stats.totalAdded.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{stats.addCount} adjustments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Total Subtracted</span>
            </div>
            <p className="text-2xl font-bold text-red-600">-{stats.totalSubtracted.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{stats.subtractCount} adjustments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Net Change</span>
            </div>
            <p className={cn('text-2xl font-bold', netChange >= 0 ? 'text-green-600' : 'text-red-600')}>
              {netChange >= 0 ? '+' : ''}{netChange.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Adjustments</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 items-center">
          <Select value={adjustmentTypeFilter} onValueChange={setAdjustmentTypeFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="add">Add</SelectItem>
              <SelectItem value="subtract">Subtract</SelectItem>
              <SelectItem value="set">Set</SelectItem>
            </SelectContent>
          </Select>

          {admins && admins.length > 0 && (
            <Select value={adminFilter} onValueChange={setAdminFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Admin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
                {admins.map(([id, admin]: any) => (
                  <SelectItem key={id} value={id}>
                    {admin.display_name || admin.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-64 justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd, y')} -{' '}
                      {format(dateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" onClick={exportToCSV} disabled={!adjustments?.length}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      )}

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Adjustment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : adjustments && adjustments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    {!userId && <TableHead>User</TableHead>}
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustments.map((adj: any) => (
                    <TableRow key={adj.id}>
                      <TableCell className="text-sm">
                        <div>{format(new Date(adj.created_at), 'MMM d, yyyy')}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(adj.created_at), { addSuffix: true })}
                        </div>
                      </TableCell>
                      {!userId && (
                        <TableCell>
                          <div className="text-sm font-medium">{adj.user?.display_name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{adj.user?.email}</div>
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge 
                          variant={
                            adj.adjustment_type === 'add' ? 'default' : 
                            adj.adjustment_type === 'subtract' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {adj.adjustment_type}
                        </Badge>
                        {adj.notification_sent && (
                          <Badge variant="outline" className="ml-1 text-xs">📧</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono">
                        <span className={adj.adjustment_type === 'add' ? 'text-green-600' : adj.adjustment_type === 'subtract' ? 'text-red-600' : ''}>
                          {adj.adjustment_type === 'add' ? '+' : adj.adjustment_type === 'subtract' ? '-' : '='}
                          {Number(adj.amount).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {Number(adj.previous_balance).toLocaleString()} → {Number(adj.new_balance).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {adj.previous_tier !== adj.new_tier ? (
                          <span className="text-sm">
                            {TIER_EMOJIS[adj.previous_tier] || ''} → {TIER_EMOJIS[adj.new_tier] || ''}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate text-sm" title={adj.reason}>
                          {adj.reason}
                        </div>
                        {adj.admin_note && (
                          <div className="text-xs text-muted-foreground truncate" title={adj.admin_note}>
                            📝 {adj.admin_note}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {adj.admin?.display_name || adj.admin?.email || 'System'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <History className="h-8 w-8 mb-2 opacity-50" />
                <p>No adjustments found</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
