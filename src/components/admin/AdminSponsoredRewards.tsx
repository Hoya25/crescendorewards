import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { SponsoredRewardForm } from './SponsoredRewardForm';
import { 
  Plus, Search, MoreHorizontal, Pencil, Trash2, Pause, Play,
  Sparkles, TrendingUp, DollarSign, Target, Filter, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SponsoredReward {
  id: string;
  title: string;
  description: string;
  category: string;
  cost: number;
  stock_quantity: number | null;
  is_active: boolean;
  is_featured: boolean;
  image_url: string | null;
  is_sponsored: boolean;
  sponsor_name: string | null;
  sponsor_logo: string | null;
  sponsor_start_date: string | null;
  sponsor_end_date: string | null;
  campaign_id: string | null;
  min_status_tier: string | null;
  status_tier_claims_cost: Record<string, number> | null;
  created_at: string;
  claim_count?: number;
  campaign?: {
    campaign_name: string;
  } | null;
}

interface Campaign {
  id: string;
  campaign_name: string;
}

interface Stats {
  totalActive: number;
  totalClaimsThisMonth: number;
  activeCampaigns: number;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'ended', label: 'Ended' },
  { value: 'scheduled', label: 'Scheduled' },
];

const TIER_OPTIONS = [
  { value: 'all', label: 'All Tiers' },
  { value: 'bronze', label: '🥉 Bronze' },
  { value: 'silver', label: '🥈 Silver' },
  { value: 'gold', label: '🥇 Gold' },
  { value: 'platinum', label: '💎 Platinum' },
  { value: 'diamond', label: '👑 Diamond' },
];

export function AdminSponsoredRewards() {
  const [rewards, setRewards] = useState<SponsoredReward[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ totalActive: 0, totalClaimsThisMonth: 0, activeCampaigns: 0 });
  
  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingReward, setEditingReward] = useState<SponsoredReward | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load sponsored rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select(`
          *,
          campaign:sponsored_campaigns(campaign_name)
        `)
        .eq('is_sponsored', true)
        .order('created_at', { ascending: false });

      if (rewardsError) throw rewardsError;

      // Load claim counts
      const { data: claimsData } = await supabase
        .from('rewards_claims')
        .select('reward_id');

      const claimCounts = (claimsData || []).reduce((acc, claim) => {
        acc[claim.reward_id] = (acc[claim.reward_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const enrichedRewards = (rewardsData || []).map(reward => ({
        ...reward,
        status_tier_claims_cost: reward.status_tier_claims_cost as Record<string, number> | null,
        claim_count: claimCounts[reward.id] || 0,
      }));

      setRewards(enrichedRewards);

      // Load campaigns
      const { data: campaignsData } = await supabase
        .from('sponsored_campaigns')
        .select('id, campaign_name')
        .order('campaign_name');
      setCampaigns(campaignsData || []);

      // Calculate stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const { count: claimsThisMonth } = await supabase
        .from('rewards_claims')
        .select('*', { count: 'exact', head: true })
        .in('reward_id', enrichedRewards.map(r => r.id))
        .gte('claimed_at', startOfMonth.toISOString());

      const { count: activeCampaigns } = await supabase
        .from('sponsored_campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      setStats({
        totalActive: enrichedRewards.filter(r => r.is_active && getRewardStatus(r as SponsoredReward) === 'active').length,
        totalClaimsThisMonth: claimsThisMonth || 0,
        activeCampaigns: activeCampaigns || 0,
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getRewardStatus = (reward: SponsoredReward): 'active' | 'paused' | 'ended' | 'scheduled' => {
    if (!reward.is_active) return 'paused';
    
    const now = new Date();
    if (reward.sponsor_start_date && new Date(reward.sponsor_start_date) > now) return 'scheduled';
    if (reward.sponsor_end_date && new Date(reward.sponsor_end_date) < now) return 'ended';
    
    return 'active';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-500/10 text-green-600 border-green-200',
      paused: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
      ended: 'bg-red-500/10 text-red-600 border-red-200',
      scheduled: 'bg-blue-500/10 text-blue-600 border-blue-200',
    };
    return <Badge variant="outline" className={cn('capitalize', styles[status])}>{status}</Badge>;
  };

  const filteredRewards = useMemo(() => {
    return rewards.filter(reward => {
      if (searchTerm && !reward.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !reward.sponsor_name?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      if (statusFilter !== 'all' && getRewardStatus(reward) !== statusFilter) return false;
      if (campaignFilter !== 'all' && reward.campaign_id !== campaignFilter) return false;
      if (tierFilter !== 'all' && reward.min_status_tier !== tierFilter) return false;
      
      return true;
    });
  }, [rewards, searchTerm, statusFilter, campaignFilter, tierFilter]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(filteredRewards.map(r => r.id)) : new Set());
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const handleEdit = (reward: SponsoredReward) => {
    setEditingReward(reward);
    setShowForm(true);
  };

  const handleTogglePause = async (reward: SponsoredReward) => {
    try {
      const { error } = await supabase
        .from('rewards')
        .update({ is_active: !reward.is_active })
        .eq('id', reward.id);
      
      if (error) throw error;
      toast({ title: reward.is_active ? 'Paused' : 'Activated' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (reward: SponsoredReward) => {
    if (!confirm(`Delete "${reward.title}"? This cannot be undone.`)) return;
    
    try {
      const { error } = await supabase.from('rewards').delete().eq('id', reward.id);
      if (error) throw error;
      toast({ title: 'Deleted' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleBulkAction = async (action: 'activate' | 'pause' | 'delete') => {
    if (selectedIds.size === 0) return;
    
    try {
      if (action === 'delete') {
        if (!confirm(`Delete ${selectedIds.size} rewards? This cannot be undone.`)) return;
        const { error } = await supabase.from('rewards').delete().in('id', Array.from(selectedIds));
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('rewards')
          .update({ is_active: action === 'activate' })
          .in('id', Array.from(selectedIds));
        if (error) throw error;
      }
      
      toast({ title: 'Success', description: `Updated ${selectedIds.size} rewards` });
      setSelectedIds(new Set());
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const renderTierPricing = (reward: SponsoredReward) => {
    const pricing = reward.status_tier_claims_cost;
    if (!pricing) return <span className="text-muted-foreground">Base: {reward.cost}</span>;
    
    return (
      <div className="flex gap-1">
        {['bronze', 'silver', 'gold', 'platinum', 'diamond'].map((tier) => {
          const price = pricing[tier] ?? reward.cost;
          const isFree = price === 0;
          return (
            <div 
              key={tier} 
              className={cn(
                'text-xs px-1.5 py-0.5 rounded text-center min-w-[32px]',
                isFree ? 'bg-green-500/20 text-green-600' : 'bg-muted'
              )}
              title={`${tier}: ${isFree ? 'FREE' : price}`}
            >
              {isFree ? '✓' : price}
            </div>
          );
        })}
      </div>
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCampaignFilter('all');
    setTierFilter('all');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || campaignFilter !== 'all' || tierFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            Sponsored Rewards
          </h2>
          <p className="text-muted-foreground mt-1">Manage sponsored rewards with tier-based pricing</p>
        </div>
        <Button onClick={() => { setEditingReward(null); setShowForm(true); }} size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Add Sponsored Reward
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Sponsored</p>
                <p className="text-2xl font-bold">{stats.totalActive}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Claims This Month</p>
                <p className="text-2xl font-bold">{stats.totalClaimsThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
                <p className="text-2xl font-bold">{stats.activeCampaigns}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sponsored</p>
                <p className="text-2xl font-bold">{rewards.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or sponsor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>{campaign.campaign_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
                Activate
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('pause')}>
                Pause
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedIds.size === filteredRewards.length && filteredRewards.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                </TableHead>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Title / Sponsor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tier Pricing</TableHead>
                <TableHead className="text-center">Claims</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-12 w-12 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  </TableRow>
                ))
              ) : filteredRewards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No sponsored rewards found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRewards.map((reward) => {
                  const status = getRewardStatus(reward);
                  return (
                    <TableRow key={reward.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(reward.id)}
                          onCheckedChange={(checked) => handleSelectOne(reward.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell>
                        {reward.image_url ? (
                          <img 
                            src={reward.image_url} 
                            alt={reward.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{reward.title}</p>
                          {reward.sponsor_name && (
                            <p className="text-sm text-muted-foreground">by {reward.sponsor_name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(status)}</TableCell>
                      <TableCell>{renderTierPricing(reward)}</TableCell>
                      <TableCell className="text-center">{reward.claim_count || 0}</TableCell>
                      <TableCell>
                        {reward.campaign?.campaign_name ? (
                          <Badge variant="outline">{reward.campaign.campaign_name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(reward)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTogglePause(reward)}>
                              {reward.is_active ? (
                                <>
                                  <Pause className="w-4 h-4 mr-2" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(reward)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <SponsoredRewardForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingReward(null); }}
        reward={editingReward}
        onSave={loadData}
      />
    </div>
  );
}
