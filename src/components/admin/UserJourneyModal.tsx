import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, Clock, MousePointer, Eye, Gift, Users, 
  Monitor, Smartphone, Tablet, Globe, Calendar, TrendingUp,
  ExternalLink, Play, Square, Zap, Lock
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Link } from 'react-router-dom';

interface UserJourneyModalProps {
  userId: string;
  displayName: string;
  email?: string;
  onClose: () => void;
}

interface UserActivity {
  id: string;
  session_id: string;
  event_type: string;
  event_name: string | null;
  page_path: string | null;
  page_title: string | null;
  element_id: string | null;
  element_text: string | null;
  metadata: Record<string, unknown> | null;
  referrer: string | null;
  device_type: string | null;
  browser: string | null;
  created_at: string;
}

interface UserSession {
  id: string;
  session_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  page_views: number;
  clicks: number;
  actions: number;
  entry_page: string | null;
  exit_page: string | null;
  device_type: string | null;
  browser: string | null;
}

export function UserJourneyModal({ userId, displayName, email, onClose }: UserJourneyModalProps) {
  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-journey-profile', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('unified_profiles')
        .select(`
          *,
          status_tier:status_tiers(tier_name, badge_emoji, badge_color)
        `)
        .eq('id', userId)
        .single();
      return data;
    }
  });

  // Fetch journey stats using RPC
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-journey-stats', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_journey_stats', { p_user_id: userId });
      if (error) throw error;
      return data as {
        total_sessions: number;
        total_page_views: number;
        total_clicks: number;
        total_actions: number;
        avg_session_duration: number;
        total_time_seconds: number;
        first_seen: string | null;
        last_seen: string | null;
        rewards_claimed: number;
        referrals_made: number;
      };
    }
  });

  // Fetch recent sessions
  const { data: sessions } = useQuery({
    queryKey: ['user-journey-sessions', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(10);
      return (data || []) as UserSession[];
    }
  });

  // Fetch latest session activity
  const { data: latestActivity } = useQuery({
    queryKey: ['user-journey-latest', userId],
    queryFn: async () => {
      // Get latest session
      const { data: latestSession } = await supabase
        .from('user_sessions')
        .select('session_id')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (!latestSession) return [];

      // Get activity for that session
      const { data } = await supabase
        .from('user_activity')
        .select('*')
        .eq('session_id', latestSession.session_id)
        .order('created_at', { ascending: true });

      return (data || []) as UserActivity[];
    }
  });

  // Fetch all activity for timeline
  const { data: allActivity } = useQuery({
    queryKey: ['user-journey-all-activity', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);
      return (data || []) as UserActivity[];
    }
  });

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0s';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'page_view': return <Eye className="w-3.5 h-3.5 text-blue-500" />;
      case 'click': return <MousePointer className="w-3.5 h-3.5 text-green-500" />;
      case 'action': return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case 'session_start': return <Play className="w-3.5 h-3.5 text-emerald-500" />;
      case 'session_end': return <Square className="w-3.5 h-3.5 text-red-500" />;
      default: return <Globe className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-3.5 h-3.5" />;
      case 'tablet': return <Tablet className="w-3.5 h-3.5" />;
      default: return <Monitor className="w-3.5 h-3.5" />;
    }
  };

  const getEventLabel = (event: UserActivity) => {
    switch (event.event_type) {
      case 'page_view':
        return `Viewed ${event.page_path || 'unknown page'}`;
      case 'click':
        return `Clicked "${event.element_text || event.element_id || 'element'}"`;
      case 'action':
        return event.event_name?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Action';
      case 'session_start':
        return 'Session started';
      case 'session_end':
        return 'Session ended';
      default:
        return event.event_name || event.event_type;
    }
  };

  const initials = displayName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{displayName}</span>
                {profile?.status_tier && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{ 
                      backgroundColor: profile.status_tier.badge_color ? `${profile.status_tier.badge_color}20` : undefined,
                      color: profile.status_tier.badge_color || undefined
                    }}
                  >
                    {profile.status_tier.badge_emoji} {profile.status_tier.tier_name}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-3 py-4">
          <Card className="p-3">
            <CardContent className="p-0 text-center">
              <div className="text-2xl font-bold text-primary">{stats?.total_sessions || 0}</div>
              <div className="text-xs text-muted-foreground">Sessions</div>
            </CardContent>
          </Card>
          <Card className="p-3">
            <CardContent className="p-0 text-center">
              <div className="text-2xl font-bold text-primary">
                {formatDuration(stats?.avg_session_duration || 0)}
              </div>
              <div className="text-xs text-muted-foreground">Avg Session</div>
            </CardContent>
          </Card>
          <Card className="p-3">
            <CardContent className="p-0 text-center">
              <div className="text-2xl font-bold text-primary">{stats?.rewards_claimed || 0}</div>
              <div className="text-xs text-muted-foreground">Claims</div>
            </CardContent>
          </Card>
          <Card className="p-3">
            <CardContent className="p-0 text-center">
              <div className="text-2xl font-bold text-primary">{stats?.referrals_made || 0}</div>
              <div className="text-xs text-muted-foreground">Referrals</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="latest" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="latest">Latest Session</TabsTrigger>
            <TabsTrigger value="timeline">Full Timeline</TabsTrigger>
            <TabsTrigger value="sessions">All Sessions</TabsTrigger>
          </TabsList>

          {/* Latest Session Tab */}
          <TabsContent value="latest" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-[300px] pr-4">
              {latestActivity && latestActivity.length > 0 ? (
                <div className="space-y-3">
                  {sessions?.[0] && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{format(new Date(sessions[0].started_at), 'PPpp')}</span>
                        {sessions[0].duration_seconds && (
                          <Badge variant="outline" className="text-xs">
                            {formatDuration(sessions[0].duration_seconds)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {getDeviceIcon(sessions[0].device_type)}
                          {sessions[0].device_type}
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5" />
                          {sessions[0].browser}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Activity timeline */}
                  <div className="relative pl-6 border-l-2 border-muted space-y-4">
                    {latestActivity.map((event) => (
                      <div key={event.id} className="relative flex items-start gap-3">
                        <div className="absolute -left-[25px] p-1 bg-background border-2 border-muted rounded-full">
                          {getEventIcon(event.event_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{getEventLabel(event)}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(event.created_at), 'p')}
                            </span>
                          </div>
                          {event.metadata && Object.keys(event.metadata).length > 0 && (
                            <pre className="mt-1 text-xs text-muted-foreground bg-muted/50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No activity recorded yet
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Full Timeline Tab */}
          <TabsContent value="timeline" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="relative pl-6 border-l-2 border-muted space-y-3">
                {allActivity?.map((event) => (
                  <div key={event.id} className="relative flex items-start gap-3">
                    <div className="absolute -left-[25px] p-1 bg-background border-2 border-muted rounded-full">
                      {getEventIcon(event.event_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{getEventLabel(event)}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.created_at), 'MMM d, p')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{event.page_path}</p>
                    </div>
                  </div>
                ))}
                {(!allActivity || allActivity.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">
                    No activity recorded
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* All Sessions Tab */}
          <TabsContent value="sessions" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {sessions?.map((session) => (
                  <Card key={session.id} className="p-3">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {format(new Date(session.started_at), 'PPp')}
                            </span>
                            {!session.ended_at && (
                              <Badge variant="default" className="text-xs bg-green-500">
                                Active
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {session.entry_page} → {session.exit_page || '(active)'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">
                            {session.duration_seconds 
                              ? formatDuration(session.duration_seconds)
                              : 'Active'
                            }
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {session.page_views}
                            </span>
                            <span className="flex items-center gap-1">
                              <MousePointer className="w-3 h-3" />
                              {session.clicks}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!sessions || sessions.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">
                    No sessions recorded
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t text-sm">
          <Link 
            to={`/admin/users`} 
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            View full user profile <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5" />
            Admin only
            {profile?.created_at && (
              <span>• User since {format(new Date(profile.created_at), 'PP')}</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
