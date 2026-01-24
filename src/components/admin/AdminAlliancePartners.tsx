import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Plus, Users, DollarSign, Sparkles, Building2, 
  Edit, Trash2, ExternalLink 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlliancePartner {
  id: string;
  name: string;
  slug: string;
  category: string;
  logo_url: string | null;
  website_url: string | null;
  short_description: string | null;
  description: string | null;
  benefit_title: string;
  benefit_description: string;
  monthly_value: number;
  min_tier: string;
  slot_cost: number | null;
  is_diamond_exclusive: boolean | null;
  activation_type: string;
  activation_instructions: string | null;
  activation_url: string | null;
  is_creator_subscription: boolean | null;
  creator_platform: string | null;
  creator_channel_url: string | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  total_activations: number | null;
  display_order: number | null;
}

type PartnerFormData = Omit<AlliancePartner, 'id' | 'total_activations' | 'display_order'>;

const CATEGORIES = [
  'health', 'fitness', 'entertainment', 'learning', 
  'productivity', 'finance', 'travel', 'outdoor', 'creator', 'exclusive'
];

const TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

const ACTIVATION_TYPES = [
  { value: 'code', label: 'Redemption Code' },
  { value: 'email', label: 'Email Request' },
  { value: 'link', label: 'Direct Link' },
  { value: 'manual', label: 'Manual Process' },
  { value: 'api', label: 'API Integration' },
];

const PLATFORMS = [
  { value: 'twitch', label: 'Twitch', color: 'bg-purple-500' },
  { value: 'patreon', label: 'Patreon', color: 'bg-orange-500' },
  { value: 'youtube', label: 'YouTube', color: 'bg-red-500' },
  { value: 'substack', label: 'Substack', color: 'bg-orange-400' },
];

const TIER_COLORS: Record<string, string> = {
  bronze: 'bg-amber-700 text-white',
  silver: 'bg-slate-400 text-white',
  gold: 'bg-yellow-500 text-black',
  platinum: 'bg-slate-200 text-black',
  diamond: 'bg-cyan-400 text-black',
};

const emptyFormData: PartnerFormData = {
  name: '',
  slug: '',
  category: 'entertainment',
  logo_url: null,
  website_url: null,
  short_description: null,
  description: null,
  benefit_title: '',
  benefit_description: '',
  monthly_value: 10,
  min_tier: 'bronze',
  slot_cost: 1,
  is_diamond_exclusive: false,
  activation_type: 'code',
  activation_instructions: null,
  activation_url: null,
  is_creator_subscription: false,
  creator_platform: null,
  creator_channel_url: null,
  is_active: true,
  is_featured: false,
};

export function AdminAlliancePartners() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<AlliancePartner | null>(null);
  const [formData, setFormData] = useState<PartnerFormData>(emptyFormData);

  // Fetch partners
  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['admin-alliance-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alliance_partners')
        .select('*')
        .order('category')
        .order('display_order');
      
      if (error) throw error;
      return data as AlliancePartner[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: PartnerFormData) => {
      const { error } = await supabase
        .from('alliance_partners')
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-alliance-partners'] });
      toast.success('Partner created successfully');
      closeModal();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create partner: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PartnerFormData> }) => {
      const { error } = await supabase
        .from('alliance_partners')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-alliance-partners'] });
      toast.success('Partner updated successfully');
      closeModal();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update partner: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('alliance_partners')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-alliance-partners'] });
      toast.success('Partner deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete partner: ${error.message}`);
    },
  });

  // Stats calculations
  const stats = useMemo(() => {
    const totalPartners = partners.length;
    const activePartners = partners.filter(p => p.is_active).length;
    const creatorSubs = partners.filter(p => p.is_creator_subscription).length;
    const totalValue = partners.reduce((sum, p) => sum + (p.monthly_value || 0), 0);
    return { totalPartners, activePartners, creatorSubs, totalValue };
  }, [partners]);

  // Group partners by category
  const partnersByCategory = useMemo(() => {
    const grouped: Record<string, AlliancePartner[]> = {};
    partners.forEach(partner => {
      const cat = partner.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(partner);
    });
    return grouped;
  }, [partners]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const openCreateModal = () => {
    setEditingPartner(null);
    setFormData(emptyFormData);
    setIsModalOpen(true);
  };

  const openEditModal = (partner: AlliancePartner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      slug: partner.slug,
      category: partner.category,
      logo_url: partner.logo_url,
      website_url: partner.website_url,
      short_description: partner.short_description,
      description: partner.description,
      benefit_title: partner.benefit_title,
      benefit_description: partner.benefit_description,
      monthly_value: partner.monthly_value,
      min_tier: partner.min_tier,
      slot_cost: partner.slot_cost ?? 1,
      is_diamond_exclusive: partner.is_diamond_exclusive ?? false,
      activation_type: partner.activation_type,
      activation_instructions: partner.activation_instructions,
      activation_url: partner.activation_url,
      is_creator_subscription: partner.is_creator_subscription ?? false,
      creator_platform: partner.creator_platform,
      creator_channel_url: partner.creator_channel_url,
      is_active: partner.is_active ?? true,
      is_featured: partner.is_featured ?? false,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPartner(null);
    setFormData(emptyFormData);
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Partner name is required');
      return;
    }
    if (!formData.slug.trim()) {
      toast.error('URL slug is required');
      return;
    }
    if (!formData.category) {
      toast.error('Category is required');
      return;
    }
    if (!formData.benefit_title.trim()) {
      toast.error('Benefit title is required');
      return;
    }
    if (!formData.monthly_value || formData.monthly_value < 0) {
      toast.error('Valid monthly value is required');
      return;
    }

    if (editingPartner) {
      updateMutation.mutate({ id: editingPartner.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (partner: AlliancePartner) => {
    if (window.confirm(`Are you sure you want to delete "${partner.name}"?`)) {
      deleteMutation.mutate(partner.id);
    }
  };

  const getPlatformBadge = (platform: string | null) => {
    const p = PLATFORMS.find(pl => pl.value === platform);
    if (!p) return null;
    return (
      <Badge className={cn('text-xs text-white', p.color)}>
        {p.label}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Alliance Partners</h2>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Partner
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Partners
            </CardTitle>
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPartners}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Partners
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePartners}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Creator Subs
            </CardTitle>
            <Sparkles className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.creatorSubs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Monthly Value
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Partners Table by Category */}
      {Object.entries(partnersByCategory).map(([category, categoryPartners]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="capitalize">{category}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Benefit</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Min Tier</TableHead>
                  <TableHead>Activations</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryPartners.map(partner => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {partner.logo_url ? (
                          <img 
                            src={partner.logo_url} 
                            alt={partner.name} 
                            className="w-8 h-8 rounded object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {partner.name}
                            {partner.is_creator_subscription && getPlatformBadge(partner.creator_platform)}
                          </div>
                          {partner.short_description && (
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {partner.short_description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{partner.benefit_title}</TableCell>
                    <TableCell>${partner.monthly_value}/mo</TableCell>
                    <TableCell>
                      <Badge className={cn('capitalize', TIER_COLORS[partner.min_tier])}>
                        {partner.min_tier}
                      </Badge>
                    </TableCell>
                    <TableCell>{partner.total_activations || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {partner.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {partner.is_featured && (
                          <Badge variant="outline" className="border-primary text-primary">
                            Featured
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {partner.website_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(partner.website_url!, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(partner)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(partner)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPartner ? 'Edit Partner' : 'Add New Partner'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Basic Info
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Partner Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        name,
                        slug: prev.slug || generateSlug(name),
                      }));
                    }}
                    placeholder="e.g., Spotify Premium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g., spotify-premium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat} className="capitalize">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value || null }))}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  value={formData.website_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value || null }))}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">Short Description</Label>
                <Input
                  id="short_description"
                  value={formData.short_description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value || null }))}
                  placeholder="One-liner for cards"
                />
              </div>
            </div>

            {/* Benefit Details Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Benefit Details
              </h3>

              <div className="space-y-2">
                <Label htmlFor="benefit_title">Benefit Title *</Label>
                <Input
                  id="benefit_title"
                  value={formData.benefit_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, benefit_title: e.target.value }))}
                  placeholder="e.g., Premium Membership"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="benefit_description">Benefit Description</Label>
                <Textarea
                  id="benefit_description"
                  value={formData.benefit_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, benefit_description: e.target.value }))}
                  placeholder="Full description of the benefit..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly_value">Monthly Value ($) *</Label>
                  <Input
                    id="monthly_value"
                    type="number"
                    min={0}
                    value={formData.monthly_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthly_value: Number(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_tier">Minimum Tier *</Label>
                  <Select
                    value={formData.min_tier}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, min_tier: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIERS.map(tier => (
                        <SelectItem key={tier} value={tier} className="capitalize">
                          {tier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slot_cost">Slot Cost</Label>
                  <Select
                    value={String(formData.slot_cost || 1)}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, slot_cost: Number(val) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 slot</SelectItem>
                      <SelectItem value="2">2 slots</SelectItem>
                      <SelectItem value="3">3 slots</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_diamond_exclusive"
                  checked={formData.is_diamond_exclusive || false}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, is_diamond_exclusive: checked === true }))
                  }
                />
                <Label htmlFor="is_diamond_exclusive" className="text-sm">
                  Diamond Exclusive
                </Label>
              </div>
            </div>

            {/* Activation Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Activation
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="activation_type">Activation Type</Label>
                  <Select
                    value={formData.activation_type}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, activation_type: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVATION_TYPES.map(at => (
                        <SelectItem key={at.value} value={at.value}>
                          {at.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activation_url">Activation URL</Label>
                  <Input
                    id="activation_url"
                    value={formData.activation_url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, activation_url: e.target.value || null }))}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activation_instructions">Activation Instructions</Label>
                <Textarea
                  id="activation_instructions"
                  value={formData.activation_instructions || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, activation_instructions: e.target.value || null }))}
                  placeholder="How users activate this benefit..."
                  rows={2}
                />
              </div>
            </div>

            {/* Creator Subscription Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Creator Subscription
              </h3>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_creator_subscription"
                  checked={formData.is_creator_subscription || false}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, is_creator_subscription: checked === true }))
                  }
                />
                <Label htmlFor="is_creator_subscription" className="text-sm">
                  This is a creator subscription
                </Label>
              </div>

              {formData.is_creator_subscription && (
                <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-muted">
                  <div className="space-y-2">
                    <Label htmlFor="creator_platform">Platform</Label>
                    <Select
                      value={formData.creator_platform || ''}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, creator_platform: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map(p => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="creator_channel_url">Channel/Creator URL</Label>
                    <Input
                      id="creator_channel_url"
                      value={formData.creator_channel_url || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, creator_channel_url: e.target.value || null }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Status Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Status
              </h3>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active || false}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, is_active: checked === true }))
                    }
                  />
                  <Label htmlFor="is_active" className="text-sm">Active</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_featured"
                    checked={formData.is_featured || false}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, is_featured: checked === true }))
                    }
                  />
                  <Label htmlFor="is_featured" className="text-sm">Featured</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending 
                ? 'Saving...' 
                : editingPartner ? 'Update Partner' : 'Create Partner'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
