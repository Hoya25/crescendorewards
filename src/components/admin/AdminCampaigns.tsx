import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Megaphone, Calendar, Gift, Eye } from 'lucide-react';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { compressImage } from '@/lib/image-compression';

interface Campaign {
  id: string;
  campaign_name: string;
  sponsor_name: string;
  sponsor_logo_url: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean | null;
  display_priority: number | null;
  created_at: string | null;
  rewards_count?: number;
  total_claims?: number;
}

interface CampaignFormData {
  campaign_name: string;
  sponsor_name: string;
  sponsor_logo_url: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  display_priority: number;
}

const initialFormData: CampaignFormData = {
  campaign_name: '',
  sponsor_name: '',
  sponsor_logo_url: '',
  start_date: '',
  end_date: '',
  is_active: true,
  display_priority: 50,
};

export function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      // Get campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('sponsored_campaigns')
        .select('*')
        .order('display_priority', { ascending: false });

      if (campaignsError) throw campaignsError;

      // Get rewards count per campaign
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('campaign_id')
        .not('campaign_id', 'is', null);

      if (rewardsError) throw rewardsError;

      // Get claims count per campaign
      const { data: claimsData, error: claimsError } = await supabase
        .from('rewards_claims')
        .select('reward_id, rewards!inner(campaign_id)')
        .not('rewards.campaign_id', 'is', null);

      if (claimsError) throw claimsError;

      // Count rewards and claims per campaign
      const rewardsCounts: Record<string, number> = {};
      const claimsCounts: Record<string, number> = {};

      rewardsData?.forEach((r) => {
        if (r.campaign_id) {
          rewardsCounts[r.campaign_id] = (rewardsCounts[r.campaign_id] || 0) + 1;
        }
      });

      claimsData?.forEach((c: { reward_id: string; rewards: { campaign_id: string | null } }) => {
        const campaignId = c.rewards?.campaign_id;
        if (campaignId) {
          claimsCounts[campaignId] = (claimsCounts[campaignId] || 0) + 1;
        }
      });

      const enrichedCampaigns = (campaignsData || []).map((campaign) => ({
        ...campaign,
        rewards_count: rewardsCounts[campaign.id] || 0,
        total_claims: claimsCounts[campaign.id] || 0,
      }));

      setCampaigns(enrichedCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const getCampaignStatus = (campaign: Campaign): 'active' | 'scheduled' | 'ended' | 'paused' => {
    if (!campaign.is_active) return 'paused';
    
    const now = new Date();
    const startDate = campaign.start_date ? new Date(campaign.start_date) : null;
    const endDate = campaign.end_date ? new Date(campaign.end_date) : null;

    if (startDate && now < startDate) return 'scheduled';
    if (endDate && now > endDate) return 'ended';
    return 'active';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'ended':
        return <Badge variant="outline" className="text-muted-foreground">Ended</Badge>;
      case 'paused':
        return <Badge variant="destructive">Paused</Badge>;
      default:
        return null;
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      campaign_name: campaign.campaign_name,
      sponsor_name: campaign.sponsor_name,
      sponsor_logo_url: campaign.sponsor_logo_url || '',
      start_date: campaign.start_date ? campaign.start_date.split('T')[0] : '',
      end_date: campaign.end_date ? campaign.end_date.split('T')[0] : '',
      is_active: campaign.is_active ?? true,
      display_priority: campaign.display_priority ?? 50,
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingCampaign(null);
    setFormData(initialFormData);
    setShowForm(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const compressed = await compressImage(file);
      const fileName = `campaign-logos/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('rewards')
        .upload(fileName, compressed);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('rewards')
        .getPublicUrl(fileName);

      setFormData({ ...formData, sponsor_logo_url: urlData.publicUrl });
      toast.success('Logo uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!formData.campaign_name || !formData.sponsor_name) {
      toast.error('Campaign name and sponsor name are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        campaign_name: formData.campaign_name,
        sponsor_name: formData.sponsor_name,
        sponsor_logo_url: formData.sponsor_logo_url || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_active: formData.is_active,
        display_priority: formData.display_priority,
      };

      if (editingCampaign) {
        const { error } = await supabase
          .from('sponsored_campaigns')
          .update(payload)
          .eq('id', editingCampaign.id);
        if (error) throw error;
        toast.success('Campaign updated');
      } else {
        const { error } = await supabase
          .from('sponsored_campaigns')
          .insert(payload);
        if (error) throw error;
        toast.success('Campaign created');
      }

      setShowForm(false);
      loadCampaigns();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (campaign: Campaign) => {
    if (!confirm(`Delete campaign "${campaign.campaign_name}"? This will unlink all associated rewards.`)) {
      return;
    }

    try {
      // Unlink rewards first
      await supabase
        .from('rewards')
        .update({ campaign_id: null })
        .eq('campaign_id', campaign.id);

      const { error } = await supabase
        .from('sponsored_campaigns')
        .delete()
        .eq('id', campaign.id);

      if (error) throw error;
      toast.success('Campaign deleted');
      loadCampaigns();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete campaign');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString();
  };

  // Stats
  const activeCampaigns = campaigns.filter(c => getCampaignStatus(c) === 'active').length;
  const totalRewards = campaigns.reduce((sum, c) => sum + (c.rewards_count || 0), 0);
  const totalClaims = campaigns.reduce((sum, c) => sum + (c.total_claims || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campaigns</h2>
          <p className="text-muted-foreground">Manage sponsored reward campaigns</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{campaigns.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Now</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{activeCampaigns}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalRewards}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalClaims}</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Cards */}
      {campaigns.length === 0 ? (
        <Card className="p-12 text-center">
          <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Campaigns Yet</h3>
          <p className="text-muted-foreground mb-4">Create your first campaign to group sponsored rewards</p>
          <Button onClick={handleAdd}>Create Campaign</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => {
            const status = getCampaignStatus(campaign);
            return (
              <Card key={campaign.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {campaign.sponsor_logo_url ? (
                        <ImageWithFallback
                          src={campaign.sponsor_logo_url}
                          alt={campaign.sponsor_name}
                          className="w-12 h-12 object-contain rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Megaphone className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base">{campaign.campaign_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{campaign.sponsor_name}</p>
                      </div>
                    </div>
                    {getStatusBadge(status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-muted-foreground" />
                      <span>{campaign.rewards_count} rewards</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Priority: {campaign.display_priority}</span>
                    <span className="text-muted-foreground">{campaign.total_claims} claims</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(campaign)}>
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(campaign)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Campaign Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? 'Edit Campaign' : 'New Campaign'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Campaign Name *</Label>
              <Input
                value={formData.campaign_name}
                onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                placeholder="Summer 2026 Promo"
              />
            </div>
            <div className="space-y-2">
              <Label>Sponsor Name *</Label>
              <Input
                value={formData.sponsor_name}
                onChange={(e) => setFormData({ ...formData, sponsor_name: e.target.value })}
                placeholder="NCTR Alliance"
              />
            </div>
            <div className="space-y-2">
              <Label>Sponsor Logo</Label>
              <div className="flex items-center gap-4">
                {formData.sponsor_logo_url && (
                  <ImageWithFallback
                    src={formData.sponsor_logo_url}
                    alt="Logo preview"
                    className="w-16 h-16 object-contain rounded border"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Display Priority (1-100)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={formData.display_priority}
                onChange={(e) => setFormData({ ...formData, display_priority: parseInt(e.target.value) || 50 })}
              />
              <p className="text-xs text-muted-foreground">Higher priority campaigns appear first</p>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingCampaign ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
