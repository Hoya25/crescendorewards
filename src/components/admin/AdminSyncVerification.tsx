import { useState, useEffect } from 'react';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Database,
  User,
  Layers,
  Play,
  Eye,
  Diff
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ProfileData {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  level: number;
  locked_nctr: number;
  available_nctr: number;
  claim_balance: number;
  bio: string | null;
  referral_code: string | null;
  created_at: string;
  updated_at: string;
}

interface UnifiedProfileData {
  id: string;
  auth_user_id: string | null;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  crescendo_data: any;
  garden_data: any;
  current_tier_id: string | null;
  created_at: string;
  updated_at: string;
}

interface SyncResult {
  success: boolean;
  summary?: {
    created: number;
    updated: number;
    errors: number;
  };
  error?: string;
  timestamp: string;
}

export function AdminSyncVerification() {
  const { user, session } = useAuthContext();
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [unifiedProfiles, setUnifiedProfiles] = useState<UnifiedProfileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testingReverse, setTestingReverse] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [reverseTestResult, setReverseTestResult] = useState<{success: boolean; message: string} | null>(null);
  const [testDisplayName, setTestDisplayName] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profilesRes, unifiedRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('unified_profiles').select('*').order('created_at', { ascending: false }).limit(20),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (unifiedRes.error) throw unifiedRes.error;

      setProfiles(profilesRes.data || []);
      setUnifiedProfiles(unifiedRes.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runForwardSync = async () => {
    if (!session?.access_token) {
      toast({
        title: 'Error',
        description: 'You must be logged in to run sync',
        variant: 'destructive',
      });
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/sync-crescendo-profiles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Sync failed');
      }

      setSyncResult({
        success: true,
        summary: result.summary,
        timestamp: new Date().toISOString(),
      });

      toast({
        title: 'Forward Sync Complete',
        description: `Created: ${result.summary.created}, Updated: ${result.summary.updated}, Errors: ${result.summary.errors}`,
      });

      // Refresh data
      await fetchData();
    } catch (error: any) {
      console.error('Error running forward sync:', error);
      setSyncResult({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      toast({
        title: 'Sync Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const testReverseSync = async () => {
    if (!selectedProfileId) {
      toast({
        title: 'Error',
        description: 'Please select a profile to test',
        variant: 'destructive',
      });
      return;
    }

    if (!testDisplayName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a test display name',
        variant: 'destructive',
      });
      return;
    }

    setTestingReverse(true);
    setReverseTestResult(null);

    try {
      // Find the unified profile for this user
      const profile = profiles.find(p => p.id === selectedProfileId);
      if (!profile) throw new Error('Profile not found');

      // Find or check if unified profile exists
      const { data: unifiedProfile, error: findError } = await supabase
        .from('unified_profiles')
        .select('*')
        .eq('auth_user_id', selectedProfileId)
        .maybeSingle();

      if (findError) throw findError;

      if (!unifiedProfile) {
        // Create unified profile first
        const { error: createError } = await supabase
          .from('unified_profiles')
          .insert({
            auth_user_id: selectedProfileId,
            email: profile.email,
            display_name: profile.full_name,
            avatar_url: profile.avatar_url,
            wallet_address: profile.wallet_address,
            crescendo_data: {
              level: profile.level,
              locked_nctr: profile.locked_nctr,
              available_nctr: profile.available_nctr,
              claim_balance: profile.claim_balance,
              bio: profile.bio,
              referral_code: profile.referral_code,
            },
          });

        if (createError) throw createError;
      }

      // Now update the unified profile to trigger reverse sync
      const { error: updateError } = await supabase
        .from('unified_profiles')
        .update({
          display_name: testDisplayName,
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', selectedProfileId);

      if (updateError) throw updateError;

      // Wait a moment for the trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if the profiles table was updated
      const { data: updatedProfile, error: checkError } = await supabase
        .from('profiles')
        .select('full_name, updated_at')
        .eq('id', selectedProfileId)
        .single();

      if (checkError) throw checkError;

      const wasUpdated = updatedProfile.full_name === testDisplayName;

      setReverseTestResult({
        success: wasUpdated,
        message: wasUpdated 
          ? `Reverse sync successful! Profile full_name updated to "${testDisplayName}"`
          : `Reverse sync may have failed. Profile full_name is "${updatedProfile.full_name}"`,
      });

      if (wasUpdated) {
        toast({
          title: 'Reverse Sync Test Passed',
          description: 'The database trigger successfully updated the legacy profile',
        });
      } else {
        toast({
          title: 'Reverse Sync Test Warning',
          description: 'Profile may not have been updated - check the trigger',
          variant: 'destructive',
        });
      }

      // Refresh data
      await fetchData();
    } catch (error: any) {
      console.error('Error testing reverse sync:', error);
      setReverseTestResult({
        success: false,
        message: error.message,
      });
      toast({
        title: 'Test Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setTestingReverse(false);
    }
  };

  const getMatchingUnifiedProfile = (profileId: string) => {
    return unifiedProfiles.find(up => up.auth_user_id === profileId);
  };

  const getFieldComparison = (profile: ProfileData, unified: UnifiedProfileData | undefined) => {
    if (!unified) return [];
    
    const crescendoData = unified.crescendo_data || {};
    
    return [
      { field: 'Email', profile: profile.email, unified: unified.email, match: profile.email === unified.email },
      { field: 'Name', profile: profile.full_name, unified: unified.display_name, match: profile.full_name === unified.display_name },
      { field: 'Avatar', profile: profile.avatar_url?.slice(0, 30), unified: unified.avatar_url?.slice(0, 30), match: profile.avatar_url === unified.avatar_url },
      { field: 'Wallet', profile: profile.wallet_address?.slice(0, 10), unified: unified.wallet_address?.slice(0, 10), match: profile.wallet_address === unified.wallet_address },
      { field: 'Level', profile: profile.level, unified: crescendoData.level, match: profile.level === crescendoData.level },
      { field: 'Locked NCTR', profile: profile.locked_nctr, unified: crescendoData.locked_nctr, match: profile.locked_nctr === crescendoData.locked_nctr },
      { field: 'Claim Balance', profile: profile.claim_balance, unified: crescendoData.claim_balance, match: profile.claim_balance === crescendoData.claim_balance },
    ];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Sync Verification</h2>
          <p className="text-muted-foreground mt-1">
            Test and verify the profile synchronization between Crescendo and The Garden
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Sync Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forward Sync */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-primary" />
              Forward Sync
            </CardTitle>
            <CardDescription>
              Sync data from Crescendo profiles → unified_profiles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Database className="h-4 w-4" />
                <span>profiles</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 text-sm">
                <Layers className="h-4 w-4" />
                <span>unified_profiles</span>
              </div>
            </div>
            
            <Button 
              onClick={runForwardSync} 
              disabled={syncing}
              className="w-full"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {syncing ? 'Running Sync...' : 'Run Forward Sync'}
            </Button>

            {syncResult && (
              <div className={`p-3 rounded-lg ${syncResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-destructive/10 border border-destructive/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {syncResult.success ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-destructive" />
                  )}
                  <span className="font-medium text-sm">
                    {syncResult.success ? 'Sync Successful' : 'Sync Failed'}
                  </span>
                </div>
                {syncResult.summary && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Created: {syncResult.summary.created}</p>
                    <p>Updated: {syncResult.summary.updated}</p>
                    <p>Errors: {syncResult.summary.errors}</p>
                  </div>
                )}
                {syncResult.error && (
                  <p className="text-sm text-destructive">{syncResult.error}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(syncResult.timestamp), 'PPpp')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reverse Sync Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5 text-primary" />
              Reverse Sync Test
            </CardTitle>
            <CardDescription>
              Test trigger: unified_profiles → profiles (via database trigger)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Layers className="h-4 w-4" />
                <span>unified_profiles</span>
              </div>
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 text-sm">
                <Database className="h-4 w-4" />
                <span>profiles</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="profile-select">Select Profile to Test</Label>
                <select
                  id="profile-select"
                  className="w-full h-10 px-3 rounded-md border bg-background"
                  value={selectedProfileId || ''}
                  onChange={(e) => setSelectedProfileId(e.target.value || null)}
                >
                  <option value="">Choose a profile...</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.email || p.full_name || p.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-name">New Display Name</Label>
                <Input
                  id="test-name"
                  placeholder="Enter test display name..."
                  value={testDisplayName}
                  onChange={(e) => setTestDisplayName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This will update unified_profiles.display_name and should trigger an update to profiles.full_name
                </p>
              </div>
            </div>

            <Button 
              onClick={testReverseSync} 
              disabled={testingReverse || !selectedProfileId || !testDisplayName.trim()}
              className="w-full"
              variant="secondary"
            >
              {testingReverse ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {testingReverse ? 'Testing...' : 'Test Reverse Sync'}
            </Button>

            {reverseTestResult && (
              <div className={`p-3 rounded-lg ${reverseTestResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                <div className="flex items-center gap-2">
                  {reverseTestResult.success ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-sm">{reverseTestResult.message}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Diff className="h-5 w-5" />
            Profile Comparison
          </CardTitle>
          <CardDescription>
            Compare data between profiles and unified_profiles tables
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {profiles.map((profile) => {
                  const unified = getMatchingUnifiedProfile(profile.id);
                  const comparisons = getFieldComparison(profile, unified);
                  
                  return (
                    <div key={profile.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{profile.email || profile.full_name || 'Unknown'}</span>
                          <Badge variant="outline" className="text-xs font-mono">
                            {profile.id.slice(0, 8)}...
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {unified ? (
                            <Badge variant="default" className="text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Unified Exists
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <X className="h-3 w-3 mr-1" />
                              No Unified Profile
                            </Badge>
                          )}
                        </div>
                      </div>

                      {unified && (
                        <div className="grid grid-cols-7 gap-2 text-xs">
                          <div className="font-medium text-muted-foreground">Field</div>
                          <div className="col-span-2 font-medium text-muted-foreground">Profile Value</div>
                          <div className="col-span-2 font-medium text-muted-foreground">Unified Value</div>
                          <div className="col-span-2 font-medium text-muted-foreground">Status</div>
                          
                          {comparisons.map((comp) => (
                            <>
                              <div key={`${comp.field}-field`} className="truncate">{comp.field}</div>
                              <div key={`${comp.field}-profile`} className="col-span-2 truncate text-muted-foreground">
                                {comp.profile?.toString() || 'null'}
                              </div>
                              <div key={`${comp.field}-unified`} className="col-span-2 truncate text-muted-foreground">
                                {comp.unified?.toString() || 'null'}
                              </div>
                              <div key={`${comp.field}-status`} className="col-span-2">
                                {comp.match ? (
                                  <span className="text-green-500 flex items-center gap-1">
                                    <Check className="h-3 w-3" /> Match
                                  </span>
                                ) : (
                                  <span className="text-amber-500 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" /> Mismatch
                                  </span>
                                )}
                              </div>
                            </>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {profiles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No profiles found
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{profiles.length}</div>
            <p className="text-sm text-muted-foreground">Legacy Profiles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{unifiedProfiles.length}</div>
            <p className="text-sm text-muted-foreground">Unified Profiles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">
              {profiles.filter(p => getMatchingUnifiedProfile(p.id)).length}
            </div>
            <p className="text-sm text-muted-foreground">Linked Profiles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-500">
              {profiles.filter(p => !getMatchingUnifiedProfile(p.id)).length}
            </div>
            <p className="text-sm text-muted-foreground">Unlinked Profiles</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
