import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SponsorContentTab } from './SponsorContentTab';
import { 
  Gift, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Plus, 
  Megaphone, 
  Edit2, 
  Pause, 
  Play, 
  ExternalLink,
  Settings,
  Award,
  Calendar,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useSponsor } from '@/hooks/useSponsor';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { SPONSOR_TIER_CONFIG, CONTRIBUTION_MODEL_CONFIG } from '@/types/sponsorship';
import { format } from 'date-fns';

export function SponsorDashboard() {
  const navigate = useNavigate();
  const { profile } = useUnifiedUser();
  const { 
    sponsor, 
    loading, 
    stats, 
    rewards, 
    campaigns, 
    applications,
    createCampaign,
    updateSponsoredReward,
    refresh 
  } = useSponsor();

  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    campaign_type: 'ongoing' as const,
    budget_total: '',
    start_date: '',
    end_date: '',
  });
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  // Redirect if not a sponsor
  if (!loading && !sponsor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Award className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Become a Sponsor</CardTitle>
            <CardDescription>
              You don't have a sponsor profile yet. Apply to become a sponsor and start contributing rewards to the community.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full" 
              onClick={() => navigate('/become-sponsor')}
            >
              Apply to Become a Sponsor
            </Button>
            {applications.length > 0 && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">
                  You have {applications.length} pending application(s).
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const tierConfig = sponsor?.tier ? SPONSOR_TIER_CONFIG[sponsor.tier] : SPONSOR_TIER_CONFIG.community;

  const handleCreateCampaign = async () => {
    setCreatingCampaign(true);
    const result = await createCampaign({
      name: campaignForm.name,
      description: campaignForm.description,
      campaign_type: campaignForm.campaign_type,
      budget_total: campaignForm.budget_total ? parseFloat(campaignForm.budget_total) : undefined,
      start_date: campaignForm.start_date || undefined,
      end_date: campaignForm.end_date || undefined,
    });
    setCreatingCampaign(false);
    if (result) {
      setShowCampaignDialog(false);
      setCampaignForm({
        name: '',
        description: '',
        campaign_type: 'ongoing',
        budget_total: '',
        start_date: '',
        end_date: '',
      });
    }
  };

  const toggleRewardActive = async (rewardId: string, currentlyActive: boolean) => {
    await updateSponsoredReward(rewardId, { is_active: !currentlyActive } as any);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            {sponsor?.logo_url ? (
              <img 
                src={sponsor.logo_url} 
                alt={sponsor.name} 
                className="w-16 h-16 rounded-lg object-cover border"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <Award className="w-8 h-8 text-primary" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{sponsor?.name}</h1>
                <Badge 
                  variant="secondary"
                  className={`bg-${tierConfig.color}-100 text-${tierConfig.color}-700 dark:bg-${tierConfig.color}-900/30 dark:text-${tierConfig.color}-400`}
                >
                  {tierConfig.label}
                </Badge>
                {sponsor?.is_verified && (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Sponsor Dashboard</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/sponsors/${sponsor?.slug}`)}>
              <ExternalLink className="w-4 h-4 mr-2" />
              View Public Profile
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Rewards</CardTitle>
              <Gift className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rewards.filter(r => r.is_active).length}</div>
              <p className="text-xs text-muted-foreground">
                {rewards.length} total rewards
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_claims || sponsor?.total_claims || 0}</div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.claims_this_month || 0}</div>
              <p className="text-xs text-muted-foreground">
                Claims this month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Value Sponsored</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(stats?.total_value_sponsored || sponsor?.total_sponsored_value || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Estimated value delivered
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/sponsor/rewards/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Reward
          </Button>
          <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Megaphone className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Campaign</DialogTitle>
                <DialogDescription>
                  Group your rewards under a campaign for better organization and tracking.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    placeholder="Summer Promotion 2024"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign-description">Description</Label>
                  <Textarea
                    id="campaign-description"
                    placeholder="Describe your campaign..."
                    value={campaignForm.description}
                    onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign-type">Campaign Type</Label>
                  <Select 
                    value={campaignForm.campaign_type}
                    onValueChange={(value: any) => setCampaignForm({ ...campaignForm, campaign_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="limited_time">Limited Time</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="mission_aligned">Mission Aligned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={campaignForm.start_date}
                      onChange={(e) => setCampaignForm({ ...campaignForm, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={campaignForm.end_date}
                      onChange={(e) => setCampaignForm({ ...campaignForm, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (Optional)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="5000"
                    value={campaignForm.budget_total}
                    onChange={(e) => setCampaignForm({ ...campaignForm, budget_total: e.target.value })}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreateCampaign}
                  disabled={!campaignForm.name || creatingCampaign}
                >
                  {creatingCampaign ? 'Creating...' : 'Create Campaign'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => navigate('/sponsor/analytics')}>
            <BarChart3 className="w-4 h-4 mr-2" />
            View Analytics
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="rewards" className="space-y-4">
          <TabsList>
            <TabsTrigger value="rewards">My Rewards</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="rewards" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Rewards</CardTitle>
                    <CardDescription>
                      Manage the rewards you've contributed to the community
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => navigate('/sponsor/rewards/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Reward
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {rewards.length === 0 ? (
                  <div className="text-center py-12">
                    <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No rewards yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start contributing by adding your first reward
                    </p>
                    <Button onClick={() => navigate('/sponsor/rewards/new')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Reward
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reward</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Claims</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rewards.map((reward) => (
                        <TableRow key={reward.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {reward.image_url ? (
                                <img 
                                  src={reward.image_url} 
                                  alt={reward.title}
                                  className="w-10 h-10 rounded object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                  <Gift className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{reward.title}</p>
                                <p className="text-xs text-muted-foreground">{reward.category}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {CONTRIBUTION_MODEL_CONFIG[reward.contribution_model]?.label || reward.contribution_model}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {(reward as any).claim_count || 0}
                          </TableCell>
                          <TableCell>
                            {reward.is_active ? (
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Paused</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => navigate(`/rewards/${reward.id}`)}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => toggleRewardActive(reward.id, reward.is_active)}
                              >
                                {reward.is_active ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <SponsorContentTab
              sponsorName={sponsor?.name || ''}
              sponsorId={sponsor?.id || ''}
              sponsoredRewards={rewards.map(r => ({ id: r.id, title: r.title }))}
            />
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Campaigns</CardTitle>
                    <CardDescription>
                      Organize your rewards into campaigns for better tracking
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setShowCampaignDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create a campaign to group and track your rewards
                    </p>
                    <Button onClick={() => setShowCampaignDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Campaign
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {campaigns.map((campaign) => (
                      <Card key={campaign.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{campaign.name}</h4>
                                <Badge variant={campaign.is_active ? 'default' : 'secondary'}>
                                  {campaign.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                <Badge variant="outline">{campaign.campaign_type}</Badge>
                              </div>
                              {campaign.description && (
                                <p className="text-sm text-muted-foreground">{campaign.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                {campaign.start_date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(campaign.start_date), 'MMM d, yyyy')}
                                    {campaign.end_date && ` - ${format(new Date(campaign.end_date), 'MMM d, yyyy')}`}
                                  </span>
                                )}
                                {campaign.budget_total && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    ${campaign.budget_spent?.toLocaleString() || 0} / ${campaign.budget_total.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Recent claims and engagement with your rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Activity tracking coming soon</h3>
                  <p className="text-muted-foreground">
                    Detailed claim activity will appear here as members engage with your rewards
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Pending Verification Notice */}
        {sponsor && !sponsor.is_verified && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-200">
                    Verification Pending
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Your sponsor profile is pending verification. New rewards you create will be reviewed before going live.
                    Verified sponsors can publish rewards instantly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default SponsorDashboard;
