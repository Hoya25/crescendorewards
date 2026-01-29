import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, MapPin, AlertCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GroundballPageLayout } from '@/components/groundball/GroundballPageLayout';

interface GearVaultItem {
  id: string;
  item_type: string;
  brand: string;
  model: string | null;
  condition: string | null;
  description: string | null;
  image_url: string | null;
  location_city: string | null;
  location_state: string | null;
  status: string | null;
  contributor_reward_groundball: number | null;
  contributor_reward_nctr: number | null;
}

interface GearVaultConfig {
  id: string;
  item_type: string;
  contributor_groundball: number | null;
  contributor_nctr: number | null;
  is_active: boolean | null;
}

const statusHierarchy = ['any', 'bronze', 'silver', 'gold'];

const meetsRequirement = (userStatus: string, required: string) => {
  return statusHierarchy.indexOf(userStatus) >= statusHierarchy.indexOf(required);
};

const getItemEmoji = (itemType: string) => {
  const emojis: Record<string, string> = {
    'Complete Stick': '🥍',
    'Helmet': '⛑️',
    'Gloves': '🧤',
    'Pads': '🛡️',
    'Cleats': '👟',
    'Goalie Gear': '🥅',
    'Full Starter Kit': '🎁',
  };
  return emojis[itemType] || '📦';
};

const getConditionColor = (condition: string | null) => {
  switch (condition?.toLowerCase()) {
    case 'new': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'like new': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'good': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'fair': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
};

export default function GearVaultPage() {
  const { profile } = useUnifiedUser();
  const [activeTab, setActiveTab] = useState<'claim' | 'contribute'>('claim');

  const crescendoData = profile?.crescendo_data as { status_tier?: string } | null;
  const userStatus = crescendoData?.status_tier?.toLowerCase() || 'any';
  const canClaimGear = meetsRequirement(userStatus, 'bronze');

  // Fetch available gear items
  const { data: gearItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['gear-vault-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gear_vault_items')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as GearVaultItem[];
    },
  });

  // Fetch gear config for contribution rewards
  const { data: gearConfig, isLoading: configLoading } = useQuery({
    queryKey: ['gear-vault-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gear_vault_config')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data as GearVaultConfig[];
    },
  });

  const isLoading = itemsLoading || configLoading;

  return (
    <GroundballPageLayout 
      title="Gear Vault" 
      subtitle="Community equipment sharing"
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-emerald-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 py-8 relative">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Give Gear. Get Gear.
            </h2>
            <p className="text-slate-400">
              Contribute your old equipment to help others, or claim gear you need.
            </p>
            
            {/* Quick Stats */}
            <div className="flex justify-center gap-6 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{gearItems?.length || 0}</div>
                <div className="text-xs text-slate-400">Items Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">{gearConfig?.length || 0}</div>
                <div className="text-xs text-slate-400">Item Types</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'claim' | 'contribute')}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-slate-800/50">
            <TabsTrigger value="claim" className="data-[state=active]:bg-emerald-500">
              🎁 Claim Gear
            </TabsTrigger>
            <TabsTrigger value="contribute" className="data-[state=active]:bg-emerald-500">
              🥍 Contribute
            </TabsTrigger>
          </TabsList>

          {/* Claim Tab */}
          <TabsContent value="claim" className="mt-6">
            {/* Access Banner */}
            <div className={cn(
              'mb-6 p-4 rounded-xl border flex items-center gap-3',
              canClaimGear 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-amber-500/10 border-amber-500/30'
            )}>
              {canClaimGear ? (
                <>
                  <span className="text-2xl">🥉</span>
                  <div>
                    <p className="font-medium text-emerald-400">Bronze Status members can claim available gear</p>
                    <p className="text-sm text-slate-400">You have access to the Gear Vault</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-amber-400" />
                  <div>
                    <p className="font-medium text-amber-400">Reach Bronze Status to access Gear Vault</p>
                    <p className="text-sm text-slate-400">Lock NCTR to reach Bronze Status and unlock Gear Vault access</p>
                  </div>
                </>
              )}
            </div>

            {/* Gear Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="bg-slate-900/50 border-slate-700">
                    <Skeleton className="h-32 rounded-t-lg" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (gearItems?.length || 0) === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-white mb-2">No gear available</h3>
                <p className="text-slate-400">Check back soon or contribute your own gear!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gearItems?.map((item) => (
                  <Card
                    key={item.id}
                    className="group bg-slate-900/50 border-slate-700 hover:border-emerald-500/50 transition-all"
                  >
                    <div className="h-24 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                      <span className="text-4xl">{getItemEmoji(item.item_type)}</span>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-white">{item.brand}</h3>
                          {item.model && (
                            <p className="text-sm text-slate-400">{item.model}</p>
                          )}
                        </div>
                        <Badge className={getConditionColor(item.condition)}>
                          {item.condition || 'Unknown'}
                        </Badge>
                      </div>
                      
                      <Badge variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-600">
                        {item.item_type}
                      </Badge>
                      
                      {(item.location_city || item.location_state) && (
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          <MapPin className="h-3 w-3" />
                          {[item.location_city, item.location_state].filter(Boolean).join(', ')}
                        </div>
                      )}
                      
                      {item.description && (
                        <p className="text-sm text-slate-400 line-clamp-2">{item.description}</p>
                      )}
                      
                      <Button
                        className={cn(
                          'w-full rounded-full',
                          canClaimGear 
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            : 'bg-slate-600 text-slate-300 cursor-not-allowed'
                        )}
                        disabled={!canClaimGear}
                      >
                        {canClaimGear ? 'Claim' : 'Reach Bronze to Claim'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Contribute Tab */}
          <TabsContent value="contribute" className="mt-6">
            {/* Info Banner */}
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <p className="font-medium text-emerald-400 mb-1">Anyone can contribute gear!</p>
              <p className="text-sm text-slate-400">
                Donate your old equipment and earn GROUNDBALL + NCTR rewards.
              </p>
            </div>

            {/* Reward Rates */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {configLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="bg-slate-900/50 border-slate-700">
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                gearConfig?.map((config) => (
                  <Card
                    key={config.id}
                    className="bg-slate-900/50 border-slate-700 hover:border-emerald-500/50 transition-all"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{getItemEmoji(config.item_type)}</span>
                        <h3 className="font-semibold text-white">{config.item_type}</h3>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">GROUNDBALL Reward</span>
                          <span className="font-semibold text-emerald-400">
                            +{config.contributor_groundball || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">NCTR Reward</span>
                          <span className="font-semibold text-amber-400">
                            +{config.contributor_nctr || 0}
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        className="w-full mt-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        Contribute
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </GroundballPageLayout>
  );
}