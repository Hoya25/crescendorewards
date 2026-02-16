import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClickableUsername } from '@/components/ClickableUsername';
import { formatDistanceToNow, subDays, startOfDay, endOfDay, format } from 'date-fns';
import {
  Users, Eye, MousePointerClick, LogIn, Activity, Monitor, Smartphone, Search, RefreshCw, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DatePreset = 'today' | 'yesterday' | 'week' | 'month';

const EVENT_CONFIG: Record<string, { label: string; color: string; bgClass: string }> = {
  session_start: { label: 'Logged In', color: 'text-emerald-400', bgClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  page_view: { label: 'Viewed', color: 'text-blue-400', bgClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  click: { label: 'Clicked', color: 'text-orange-400', bgClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  action: { label: 'Action', color: 'text-purple-400', bgClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

function getDateRange(preset: DatePreset): { from: Date; to: Date } {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'yesterday':
      return { from: startOfDay(subDays(now, 1)), to: endOfDay(subDays(now, 1)) };
    case 'week':
      return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
    case 'month':
      return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
  }
}

export function AdminUserActivity() {
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const range = getDateRange(datePreset);

  // Stats query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-user-activity-stats'],
    queryFn: async () => {
      const todayStart = startOfDay(new Date()).toISOString();
      const weekStart = startOfDay(subDays(new Date(), 7)).toISOString();

      const [activeToday, activeWeek, sessionsToday, viewsToday] = await Promise.all([
        supabase.from('user_activity').select('user_id', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabase.from('user_activity').select('user_id', { count: 'exact', head: true }).gte('created_at', weekStart),
        supabase.from('user_activity').select('id', { count: 'exact', head: true }).eq('event_type', 'session_start').gte('created_at', todayStart),
        supabase.from('user_activity').select('id', { count: 'exact', head: true }).eq('event_type', 'page_view').gte('created_at', todayStart),
      ]);

      // For unique users we need a different approach since count doesn't deduplicate
      const { data: uniqueToday } = await supabase
        .from('user_activity')
        .select('user_id')
        .gte('created_at', todayStart);
      const { data: uniqueWeek } = await supabase
        .from('user_activity')
        .select('user_id')
        .gte('created_at', weekStart);

      return {
        activeToday: new Set(uniqueToday?.map(r => r.user_id)).size,
        activeWeek: new Set(uniqueWeek?.map(r => r.user_id)).size,
        sessionsToday: sessionsToday.count ?? 0,
        viewsToday: viewsToday.count ?? 0,
      };
    },
    refetchInterval: 30000,
  });

  // Main feed query
  const { data: feed, isLoading: feedLoading, refetch: refetchFeed } = useQuery({
    queryKey: ['admin-user-activity-feed', datePreset, eventFilter, selectedUserId],
    queryFn: async () => {
      let query = supabase
        .from('user_activity')
        .select('*')
        .gte('created_at', range.from.toISOString())
        .lte('created_at', range.to.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventFilter !== 'all') {
        query = query.eq('event_type', eventFilter);
      }
      if (selectedUserId) {
        query = query.eq('user_id', selectedUserId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch user profiles for all user_ids
      const userIds = [...new Set((data || []).map(e => e.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('unified_profiles')
        .select('auth_user_id, display_name, email, avatar_url')
        .in('auth_user_id', userIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.auth_user_id, p])
      );

      return (data || []).map(event => ({
        ...event,
        profile: profileMap.get(event.user_id) || null,
      }));
    },
    refetchInterval: 30000,
  });

  // Active users sidebar (last 24 hours)
  const { data: activeUsers } = useQuery({
    queryKey: ['admin-active-users-sidebar'],
    queryFn: async () => {
      const dayAgo = subDays(new Date(), 1).toISOString();
      const todayStart = startOfDay(new Date()).toISOString();

      const { data: recentActivity } = await supabase
        .from('user_activity')
        .select('user_id, created_at, event_type')
        .gte('created_at', dayAgo)
        .order('created_at', { ascending: false });

      if (!recentActivity?.length) return [];

      // Group by user
      const userMap = new Map<string, { lastSeen: string; viewsToday: number }>();
      for (const event of recentActivity) {
        if (!event.user_id) continue;
        const existing = userMap.get(event.user_id);
        if (!existing) {
          userMap.set(event.user_id, {
            lastSeen: event.created_at,
            viewsToday: event.event_type === 'page_view' && event.created_at >= todayStart ? 1 : 0,
          });
        } else {
          if (event.event_type === 'page_view' && event.created_at >= todayStart) {
            existing.viewsToday++;
          }
        }
      }

      const userIds = [...userMap.keys()];
      const { data: profiles } = await supabase
        .from('unified_profiles')
        .select('auth_user_id, display_name, email, avatar_url')
        .in('auth_user_id', userIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.auth_user_id, p])
      );

      return userIds.map(uid => {
        const info = userMap.get(uid)!;
        const profile = profileMap.get(uid);
        const fiveMinAgo = subDays(new Date(), 0);
        fiveMinAgo.setMinutes(fiveMinAgo.getMinutes() - 5);
        return {
          userId: uid,
          displayName: profile?.display_name || 'Unknown',
          email: profile?.email || '',
          avatarUrl: profile?.avatar_url || '',
          lastSeen: info.lastSeen,
          viewsToday: info.viewsToday,
          isOnline: new Date(info.lastSeen) > fiveMinAgo,
        };
      }).sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
    },
    refetchInterval: 30000,
  });

  const filteredActiveUsers = useMemo(() => {
    if (!activeUsers) return [];
    if (!userSearch) return activeUsers;
    const q = userSearch.toLowerCase();
    return activeUsers.filter(u =>
      u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [activeUsers, userSearch]);

  const getEventDetail = (event: any) => {
    if (event.event_type === 'page_view') return event.page_path || event.page_title || '—';
    if (event.event_type === 'click') return event.element_text || event.element_id || '—';
    return event.event_name || event.page_path || '—';
  };

  const statCards = [
    { label: 'Active Today', value: stats?.activeToday ?? 0, icon: Users, color: 'text-[#E2FF6D]' },
    { label: 'Active This Week', value: stats?.activeWeek ?? 0, icon: Activity, color: 'text-blue-400' },
    { label: 'Sessions Today', value: stats?.sessionsToday ?? 0, icon: LogIn, color: 'text-emerald-400' },
    { label: 'Page Views Today', value: stats?.viewsToday ?? 0, icon: Eye, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">User Activity</h2>
          <p className="text-muted-foreground mt-1">Real-time user activity across Crescendo</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchFeed()}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <Card key={s.label} className="border-border/50" style={{ background: '#323232' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
                  )}
                </div>
                <s.icon className={cn('w-8 h-8 opacity-40', s.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="session_start">Logins Only</SelectItem>
            <SelectItem value="page_view">Page Views</SelectItem>
            <SelectItem value="click">Clicks</SelectItem>
            <SelectItem value="action">Actions</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {selectedUserId && (
          <Button variant="ghost" size="sm" onClick={() => setSelectedUserId(null)} className="text-[#E2FF6D]">
            <X className="w-4 h-4 mr-1" /> Clear user filter
          </Button>
        )}
      </div>

      {/* Main content: Feed + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Live Feed */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#E2FF6D]" />
              Live Activity Feed
              <span className="text-xs font-normal text-muted-foreground ml-auto">Auto-refreshes every 30s</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {feedLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : !feed?.length ? (
              <div className="text-center py-12 text-muted-foreground">No activity found for this period.</div>
            ) : (
              <ScrollArea className="max-h-[600px]">
                <div className="divide-y divide-border/40">
                  {feed.map(event => {
                    const cfg = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.action;
                    const displayName = event.profile?.display_name || 'Unknown';
                    const initials = displayName.slice(0, 2).toUpperCase();
                    return (
                      <div key={event.id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors">
                        {/* User */}
                        <div className="shrink-0">
                          <ClickableUsername
                            userId={event.user_id}
                            displayName={displayName}
                            email={event.profile?.email}
                            avatarUrl={event.profile?.avatar_url}
                            showAvatar
                            avatarSize="sm"
                          />
                        </div>

                        {/* Event badge */}
                        <Badge variant="outline" className={cn('shrink-0 text-[10px] px-2 py-0.5 border', cfg.bgClass)}>
                          {cfg.label}
                        </Badge>

                        {/* Detail */}
                        <span className="text-sm text-muted-foreground truncate flex-1 min-w-0">
                          {getEventDetail(event)}
                        </span>

                        {/* Timestamp */}
                        <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                        </span>

                        {/* Device */}
                        <span className="shrink-0">
                          {event.device_type === 'mobile' ? (
                            <Smartphone className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Monitor className="w-4 h-4 text-muted-foreground" />
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Active Users Sidebar */}
        <Card className="border-border/50 h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Active Users (24h)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[560px]">
              <div className="divide-y divide-border/40">
                {!activeUsers?.length ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">No active users</div>
                ) : (
                  filteredActiveUsers.map(user => (
                    <button
                      key={user.userId}
                      onClick={() => setSelectedUserId(prev => prev === user.userId ? null : user.userId)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors',
                        selectedUserId === user.userId && 'bg-accent/50'
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatarUrl} />
                          <AvatarFallback className="text-xs">{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {user.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background" style={{ background: '#E2FF6D' }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true })}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.viewsToday} views</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
