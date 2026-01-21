import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminActivityLog as ActivityLog } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';
import { format, formatDistanceToNow, startOfDay, endOfDay } from 'date-fns';
import { 
  Search, 
  CalendarIcon, 
  ChevronDown,
  ChevronRight,
  Activity,
  UserPlus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Gift,
  ShoppingBag,
  User,
  Shield,
  Settings,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface EnrichedActivityLog extends ActivityLog {
  admin_user?: {
    user?: {
      display_name: string;
      avatar_url?: string;
    };
  };
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'Invited new admin': <UserPlus className="w-4 h-4 text-emerald-500" />,
  'Updated admin': <Pencil className="w-4 h-4 text-blue-500" />,
  'Deactivated admin': <XCircle className="w-4 h-4 text-amber-500" />,
  'Activated admin': <CheckCircle className="w-4 h-4 text-emerald-500" />,
  'Removed admin': <Trash2 className="w-4 h-4 text-red-500" />,
  'Created reward': <Gift className="w-4 h-4 text-purple-500" />,
  'Edited reward': <Pencil className="w-4 h-4 text-blue-500" />,
  'Deleted reward': <Trash2 className="w-4 h-4 text-red-500" />,
  'Processed claim': <ShoppingBag className="w-4 h-4 text-blue-500" />,
  'Approved submission': <CheckCircle className="w-4 h-4 text-emerald-500" />,
  'Rejected submission': <XCircle className="w-4 h-4 text-red-500" />,
  'Edited user': <User className="w-4 h-4 text-blue-500" />,
  'Banned user': <XCircle className="w-4 h-4 text-red-500" />,
  'Updated permissions': <Shield className="w-4 h-4 text-purple-500" />,
  'Changed settings': <Settings className="w-4 h-4 text-blue-500" />,
};

const ACTION_TYPES = [
  'All Actions',
  'Invited new admin',
  'Updated admin',
  'Deactivated admin',
  'Activated admin',
  'Removed admin',
  'Created reward',
  'Edited reward',
  'Processed claim',
  'Approved submission',
  'Rejected submission',
];

export function AdminActivityLog() {
  const [logs, setLogs] = useState<EnrichedActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All Actions');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 50;

  useEffect(() => {
    loadLogs();
  }, [dateRange, actionFilter]);

  const loadLogs = async (reset = true) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(0);
      }

      let query = supabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .range(reset ? 0 : page * pageSize, (reset ? 0 : page) * pageSize + pageSize - 1);

      if (dateRange?.from) {
        query = query.gte('created_at', startOfDay(dateRange.from).toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('created_at', endOfDay(dateRange.to).toISOString());
      }
      if (actionFilter !== 'All Actions') {
        query = query.eq('action', actionFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch admin user details
      const enrichedLogs = await Promise.all(
        (data || []).map(async (log) => {
          const { data: adminData } = await supabase
            .from('admin_users')
            .select('user_id')
            .eq('id', log.admin_user_id)
            .single();

          let userData = null;
          if (adminData?.user_id) {
            const { data: user } = await supabase
              .from('unified_profiles')
              .select('display_name, avatar_url')
              .eq('id', adminData.user_id)
              .single();
            userData = user;
          }

          return {
            ...log,
            admin_user: { user: userData },
          } as EnrichedActivityLog;
        })
      );

      if (reset) {
        setLogs(enrichedLogs);
      } else {
        setLogs(prev => [...prev, ...enrichedLogs]);
      }
      setHasMore((data?.length || 0) === pageSize);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load activity logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
    loadLogs(false);
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.admin_user?.user?.display_name?.toLowerCase().includes(query) ||
      JSON.stringify(log.details).toLowerCase().includes(query)
    );
  });

  const getActionIcon = (action: string) => {
    for (const [key, icon] of Object.entries(ACTION_ICONS)) {
      if (action.toLowerCase().includes(key.toLowerCase())) {
        return icon;
      }
    }
    return <Activity className="w-4 h-4 text-muted-foreground" />;
  };

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Activity Log</h2>
          <p className="text-muted-foreground mt-1">Track all admin actions and changes</p>
        </div>
        <Button variant="outline" onClick={() => loadLogs()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Action Type" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPES.map((action) => (
              <SelectItem key={action} value={action}>
                {action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-48 justify-start">
              <CalendarIcon className="w-4 h-4 mr-2" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                  </>
                ) : (
                  format(dateRange.from, 'MMM d, yyyy')
                )
              ) : (
                'Date Range'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        {dateRange && (
          <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)}>
            Clear
          </Button>
        )}
      </div>

      {/* Log Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No activity logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <Collapsible key={log.id} asChild>
                  <>
                    <TableRow className="cursor-pointer hover:bg-accent/50">
                      <TableCell>
                        <CollapsibleTrigger asChild onClick={() => toggleRow(log.id)}>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            {expandedRows.has(log.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={log.admin_user?.user?.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {log.admin_user?.user?.display_name?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {log.admin_user?.user?.display_name || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span>{log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.target_type && (
                          <Badge variant="outline" className="text-xs">
                            {log.target_type}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                    <CollapsibleContent asChild>
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={5} className="p-0">
                          <div className="p-4 space-y-2">
                            <div className="text-sm font-medium">Details</div>
                            <pre className="text-xs bg-background p-3 rounded-md overflow-x-auto">
                              {JSON.stringify(log.details, null, 2) || 'No additional details'}
                            </pre>
                            {log.target_id && (
                              <div className="text-xs text-muted-foreground">
                                Target ID: {log.target_id}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))
            )}
          </TableBody>
        </Table>

        {hasMore && (
          <div className="p-4 flex justify-center">
            <Button variant="outline" onClick={loadMore} disabled={loading}>
              Load More
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
