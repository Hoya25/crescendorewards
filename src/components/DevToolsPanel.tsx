import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { supabase, SUPABASE_URL } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Bug,
  ChevronUp,
  ChevronDown,
  User,
  Database,
  Shield,
  Wallet,
  RefreshCw,
  Copy,
  Check,
  X,
  Loader2,
  Server,
  Clock,
  Layers
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface DatabaseStats {
  total_rewards: number;
  active_rewards: number;
  total_users: number;
  total_claims: number;
  unified_profiles_count: number;
  status_tiers_count: number;
}

export function DevToolsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'user' | 'session' | 'database' | 'unified'>('user');
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { user, session, loading: authLoading, isAuthenticated } = useAuthContext();
  const { 
    profile: unifiedProfile, 
    tier, 
    portfolio, 
    allTiers,
    total360Locked,
    progressToNextTier,
    nextTier,
    loading: unifiedLoading,
    refreshUnifiedProfile
  } = useUnifiedUser();

  const isExternalDb = SUPABASE_URL.includes('rndivcsonsojgelzewkb');

  // Keyboard shortcut handler (Ctrl+Shift+D)
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      setIsOpen(prev => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const fetchDbStats = async () => {
    setLoadingStats(true);
    try {
      const [rewards, unifiedProfiles, claims, tiers] = await Promise.all([
        supabase.from('rewards').select('id, is_active', { count: 'exact' }),
        supabase.from('unified_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('rewards_claims').select('id', { count: 'exact', head: true }),
        supabase.from('status_tiers').select('id', { count: 'exact', head: true }),
      ]);

      const activeRewards = rewards.data?.filter(r => r.is_active).length || 0;

      setDbStats({
        total_rewards: rewards.count || 0,
        active_rewards: activeRewards,
        total_users: unifiedProfiles.count || 0,
        total_claims: claims.count || 0,
        unified_profiles_count: unifiedProfiles.count || 0,
        status_tiers_count: tiers.count || 0,
      });
    } catch (error) {
      console.error('Error fetching db stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'database') {
      fetchDbStats();
    }
  }, [isOpen, activeTab]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0"
      onClick={() => copyToClipboard(text, field)}
    >
      {copiedField === field ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );

  const StatusDot = ({ status }: { status: boolean }) => (
    <span className={`inline-block w-2 h-2 rounded-full ${status ? 'bg-green-500' : 'bg-red-500'}`} />
  );

  const tabs = [
    { id: 'user', label: 'User', icon: User },
    { id: 'session', label: 'Session', icon: Shield },
    { id: 'unified', label: 'Unified', icon: Layers },
    { id: 'database', label: 'Database', icon: Database },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="absolute bottom-4 left-4 gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border shadow-lg"
            title="Toggle DevTools (Ctrl+Shift+D)"
          >
            <Bug className="h-4 w-4" />
            DevTools
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="rounded-none border-x-0 border-b-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Developer Tools
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={isExternalDb ? 'default' : 'secondary'} className="text-xs">
                      <Server className="h-3 w-3 mr-1" />
                      {isExternalDb ? 'The Garden' : 'Lovable Cloud'}
                    </Badge>
                    <Badge variant={isAuthenticated ? 'default' : 'outline'} className="text-xs">
                      <StatusDot status={isAuthenticated} />
                      <span className="ml-1">{isAuthenticated ? 'Authenticated' : 'Guest'}</span>
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {tabs.map((tab) => (
                      <Button
                        key={tab.id}
                        variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <tab.icon className="h-3 w-3" />
                        {tab.label}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setIsOpen(false)}
                    title="Close DevTools"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-4">
              <ScrollArea className="h-[200px]">
                {activeTab === 'user' && (
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-muted-foreground mb-2">Auth User</h4>
                        {authLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading...
                          </div>
                        ) : user ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">ID:</span>
                              <div className="flex items-center gap-1">
                                <code className="text-xs bg-muted px-1 rounded">{user.id.slice(0, 8)}...</code>
                                <CopyButton text={user.id} field="userId" />
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Email:</span>
                              <span>{user.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Provider:</span>
                              <Badge variant="outline" className="text-xs">
                                {user.app_metadata?.provider || 'email'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Created:</span>
                              <span className="text-xs">
                                {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-muted-foreground flex items-center gap-2">
                            <X className="h-4 w-4" />
                            Not authenticated
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-muted-foreground mb-2">Unified Profile Data</h4>
                        {unifiedProfile ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Name:</span>
                              <span>{unifiedProfile.display_name || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Claims:</span>
                              <span>{unifiedProfile.crescendo_data?.claims_balance || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Wallet:</span>
                              <span className="text-xs">
                                {unifiedProfile.wallet_address 
                                  ? `${unifiedProfile.wallet_address.slice(0, 6)}...${unifiedProfile.wallet_address.slice(-4)}`
                                  : 'Not connected'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-muted-foreground flex items-center gap-2">
                            <X className="h-4 w-4" />
                            No profile
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'session' && (
                  <div className="space-y-3 text-sm">
                    {session ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-muted-foreground mb-2">Session Info</h4>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Access Token:</span>
                                <div className="flex items-center gap-1">
                                  <code className="text-xs bg-muted px-1 rounded">
                                    {session.access_token.slice(0, 20)}...
                                  </code>
                                  <CopyButton text={session.access_token} field="accessToken" />
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Token Type:</span>
                                <Badge variant="outline" className="text-xs">{session.token_type}</Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Expires In:</span>
                                <span>{session.expires_in}s</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-muted-foreground mb-2">Expiry</h4>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Expires At:</span>
                                <span className="text-xs">
                                  {session.expires_at 
                                    ? formatDistanceToNow(new Date(session.expires_at * 1000), { addSuffix: true })
                                    : 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Refresh Token:</span>
                                <div className="flex items-center gap-1">
                                  <code className="text-xs bg-muted px-1 rounded">
                                    {session.refresh_token?.slice(0, 12)}...
                                  </code>
                                  <CopyButton text={session.refresh_token || ''} field="refreshToken" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground flex items-center gap-2">
                        <X className="h-4 w-4" />
                        No active session
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'unified' && (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-muted-foreground">Unified Profile System</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => refreshUnifiedProfile()}
                        disabled={unifiedLoading}
                      >
                        <RefreshCw className={`h-3 w-3 ${unifiedLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium text-muted-foreground mb-2">Unified Profile</h4>
                        {unifiedLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading...
                          </div>
                        ) : unifiedProfile ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">ID:</span>
                              <code className="text-xs bg-muted px-1 rounded">{unifiedProfile.id.slice(0, 8)}...</code>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Display:</span>
                              <span>{unifiedProfile.display_name || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Crescendo:</span>
                              <Badge variant="secondary" className="text-xs">
                                {unifiedProfile.crescendo_data?.role || 'member'}
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <div className="text-muted-foreground flex items-center gap-2">
                            <X className="h-4 w-4" />
                            Not created
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-medium text-muted-foreground mb-2">Current Tier</h4>
                        {tier ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{tier.badge_emoji}</span>
                              <span className="font-medium">{tier.display_name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Min 360LOCK:</span>
                              <span>{tier.min_nctr_360_locked.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Your 360LOCK:</span>
                              <span className="font-medium">{total360Locked.toLocaleString()}</span>
                            </div>
                            {nextTier && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">To {nextTier.display_name}:</span>
                                <span>{progressToNextTier.toFixed(1)}%</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-muted-foreground flex items-center gap-2">
                            <X className="h-4 w-4" />
                            No tier
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-medium text-muted-foreground mb-2">Wallets ({portfolio?.length || 0})</h4>
                        {portfolio && portfolio.length > 0 ? (
                          <div className="space-y-1">
                            {portfolio.map((w, i) => (
                              <div key={i} className="text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono">{w.wallet_address.slice(0, 6)}...{w.wallet_address.slice(-4)}</span>
                                  <span>{w.nctr_balance?.toLocaleString() || 0} NCTR</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted-foreground flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            No wallets
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div>
                      <h4 className="font-medium text-muted-foreground mb-2">All Tiers ({allTiers.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {allTiers.map((t) => (
                          <Badge 
                            key={t.id} 
                            variant={tier?.id === t.id ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {t.badge_emoji} {t.display_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'database' && (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-muted-foreground">Database Statistics</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={fetchDbStats}
                        disabled={loadingStats}
                      >
                        <RefreshCw className={`h-3 w-3 ${loadingStats ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-muted-foreground mb-2">Connection</h4>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Database:</span>
                            <Badge variant={isExternalDb ? 'default' : 'secondary'} className="text-xs">
                              {isExternalDb ? 'The Garden (External)' : 'Lovable Cloud'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Project ID:</span>
                            <code className="text-xs bg-muted px-1 rounded">
                              {isExternalDb ? 'rndivcsonsojgelzewkb' : 'yhwcaodofmbusjurawhp'}
                            </code>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-muted-foreground mb-2">Counts</h4>
                        {loadingStats ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading...
                          </div>
                        ) : dbStats ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Rewards:</span>
                              <span>{dbStats.active_rewards} / {dbStats.total_rewards}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Users:</span>
                              <span>{dbStats.total_users}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Claims:</span>
                              <span>{dbStats.total_claims}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Unified Profiles:</span>
                              <span>{dbStats.unified_profiles_count}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Status Tiers:</span>
                              <span>{dbStats.status_tiers_count}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-muted-foreground">No data</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
