import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { Search, Bell, BellOff, Filter, User, Mail, AlertCircle, CheckCircle, Info, RefreshCw, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendNotificationModal } from './SendNotificationModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata: Record<string, any> | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export function AdminUserNotifications() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch all notifications with user info
  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['admin-all-notifications', search, typeFilter, statusFilter],
    queryFn: async () => {
      // First get notifications
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      if (statusFilter === 'unread') {
        query = query.eq('is_read', false);
      } else if (statusFilter === 'read') {
        query = query.eq('is_read', true);
      }

      const { data: notifs, error } = await query;
      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set((notifs || []).map(n => n.user_id))];

      // Fetch user profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // Combine data
      const enrichedNotifications = (notifs || []).map(n => ({
        ...n,
        user_email: profileMap.get(n.user_id)?.email || 'Unknown',
        user_name: profileMap.get(n.user_id)?.full_name || 'Unknown User',
      }));

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        return enrichedNotifications.filter(n => 
          n.title.toLowerCase().includes(searchLower) ||
          n.message.toLowerCase().includes(searchLower) ||
          n.user_email?.toLowerCase().includes(searchLower) ||
          n.user_name?.toLowerCase().includes(searchLower)
        );
      }

      return enrichedNotifications as Notification[];
    },
  });

  // Get notification type counts
  const { data: typeCounts } = useQuery({
    queryKey: ['admin-notification-type-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('type, is_read');

      if (error) throw error;

      const counts = {
        total: data?.length || 0,
        unread: data?.filter(n => !n.is_read).length || 0,
        byType: {} as Record<string, number>,
      };

      (data || []).forEach(n => {
        counts.byType[n.type] = (counts.byType[n.type] || 0) + 1;
      });

      return counts;
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'claim_approved':
      case 'submission_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'claim_rejected':
      case 'submission_rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'gift_received':
        return <Mail className="h-4 w-4 text-purple-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      claim_approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      claim_rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      submission_approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      submission_rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
      gift_received: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      purchase_complete: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };

    return (
      <Badge className={colors[type] || 'bg-muted text-muted-foreground'}>
        {type.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const uniqueTypes = Object.keys(typeCounts?.byType || {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Notifications</h2>
          <p className="text-muted-foreground">View and send notifications to users</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setSendModalOpen(true)}>
            <Send className="h-4 w-4 mr-2" />
            Send Notification
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{typeCounts?.total || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unread</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BellOff className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{typeCounts?.unread || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Notification Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">{uniqueTypes.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, message, or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {uniqueTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type.replace(/_/g, ' ')} ({typeCounts?.byType[type]})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))
            ) : notifications?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No notifications found
                </TableCell>
              </TableRow>
            ) : (
              notifications?.map((notif) => (
                <TableRow key={notif.id} className={!notif.is_read ? 'bg-muted/30' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{notif.user_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{notif.user_email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(notif.type)}
                      {getTypeBadge(notif.type)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {notif.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[250px] truncate">
                    {notif.message}
                  </TableCell>
                  <TableCell>
                    <Badge variant={notif.is_read ? 'secondary' : 'default'}>
                      {notif.is_read ? 'Read' : 'Unread'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SendNotificationModal
        open={sendModalOpen}
        onOpenChange={setSendModalOpen}
      />
    </div>
  );
}
