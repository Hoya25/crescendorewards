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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Edit, Trash2, ExternalLink, User, EyeOff, Eye, Check, X, Pencil 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MemberActivation {
  id: string;
  user_id: string;
  partner_id: string;
  status: string;
  activated_at: string | null;
  selected_creator_name: string | null;
  selected_creator_url: string | null;
  selected_creator_platform: string | null;
  partner?: {
    name: string;
    benefit_title: string;
    is_creator_subscription: boolean;
    creator_platform: string | null;
  };
  user?: {
    display_name: string | null;
    email: string | null;
  };
}

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
  hide_value: boolean | null;
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
  { value: 'kick', label: 'Kick', color: 'bg-green-500' },
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
  hide_value: false,
};

export function AdminAlliancePartners() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<AlliancePartner | null>(null);
  const [formData, setFormData] = useState<PartnerFormData>(emptyFormData);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<number>(0);

  // Fetch partners
  const { data: partners = [], isLoading, refetch } = useQuery({
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

  // Filter partners based on status and category
  const filteredPartners = useMemo(() => {
    return partners.filter(partner => {
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && partner.is_active) ||
        (statusFilter === 'inactive' && !partner.is_active);
      
      const matchesCategory = 
        categoryFilter === 'all' || 
        partner.category === categoryFilter;
      
      return matchesStatus && matchesCategory;
    });
  }, [partners, statusFilter, categoryFilter]);

  // Fetch member activations (for creator subscriptions)
  const { data: memberActivations = [] } = useQuery({
    queryKey: ['admin-member-activations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_active_benefits')
        .select(`
          id,
          user_id,
          partner_id,
          status,
          activated_at,
          selected_creator_name,
          selected_creator_url,
          selected_creator_platform,
          partner:alliance_partners(name, benefit_title, is_creator_subscription, creator_platform),
          user:unified_profiles(display_name, email)
        `)
        .eq('status', 'active')
        .order('activated_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as MemberActivation[];
    },
  });

  // Filter to just creator subscriptions with selected creators
  const creatorActivations = useMemo(() => {
    return memberActivations.filter(
      a => a.partner?.is_creator_subscription && a.selected_creator_name
    );
  }, [memberActivations]);

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

  // Toggle active status handler
  const handleToggleActive = async (partnerId: string, partnerName: string, isActive: boolean) => {
    const { error } = await supabase
      .from('alliance_partners')
      .update({ is_active: isActive })
      .eq('id', partnerId);
    
    if (error) {
      toast.error('Failed to update status');
      return;
    }
    
    toast.success(`${partnerName} is now ${isActive ? 'active' : 'inactive'}`);
    refetch();
  };

  // Bulk update status handler
  const bulkUpdateStatus = async (isActive: boolean) => {
    if (selectedPartners.length === 0) return;

    const { error } = await supabase
      .from('alliance_partners')
      .update({ is_active: isActive })
      .in('id', selectedPartners);
    
    if (error) {
      toast.error('Failed to update partners');
      return;
    }
    
    toast.success(`${selectedPartners.length} partners ${isActive ? 'activated' : 'deactivated'}`);
    setSelectedPartners([]);
    refetch();
  };

  // Toggle hide value handler
  const toggleHideValue = async (partnerId: string, hideValue: boolean) => {
    const { error } = await supabase
      .from('alliance_partners')
      .update({ hide_value: hideValue })
      .eq('id', partnerId);
    
    if (error) {
      toast.error('Failed to update');
      return;
    }
    
    toast.success(hideValue ? 'Value hidden from members' : 'Value now visible to members');
    refetch();
  };

  // Save inline value edit
  const saveValueEdit = async (partnerId: string) => {
    const { error } = await supabase
      .from('alliance_partners')
      .update({ monthly_value: editingValue })
      .eq('id', partnerId);
    
    if (error) {
      toast.error('Failed to update value');
      return;
    }
    
    toast.success('Value updated successfully');
    setEditingValueId(null);
    refetch();
  };

  // Handle select all for current filtered view
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPartners(filteredPartners.map(p => p.id));
    } else {
      setSelectedPartners([]);
    }
  };

  // Handle individual selection
  const handleSelectPartner = (partnerId: string, checked: boolean) => {
    if (checked) {
      setSelectedPartners(prev => [...prev, partnerId]);
    } else {
      setSelectedPartners(prev => prev.filter(id => id !== partnerId));
    }
  };

  // Stats calculations
  const stats = useMemo(() => {
    const totalPartners = partners.length;
    const activePartners = partners.filter(p => p.is_active).length;
    const creatorSubs = partners.filter(p => p.is_creator_subscription).length;
    const totalValue = partners.reduce((sum, p) => sum + (p.monthly_value || 0), 0);
    return { totalPartners, activePartners, creatorSubs, totalValue };
  }, [partners]);

  // Group filtered partners by category
  const partnersByCategory = useMemo(() => {
    const grouped: Record<string, AlliancePartner[]> = {};
    filteredPartners.forEach(partner => {
      const cat = partner.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(partner);
    });
    return grouped;
  }, [filteredPartners]);

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
      hide_value: partner.hide_value ?? false,
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

      {/* Tabs for Partners vs Member Activations */}
      <Tabs defaultValue="partners" className="space-y-4">
        <TabsList>
          <TabsTrigger value="partners">Partner Catalog</TabsTrigger>
          <TabsTrigger value="activations">
            Member Activations
            {creatorActivations.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {creatorActivations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Partners" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Partners</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat} className="capitalize">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions Bar */}
          {selectedPartners.length > 0 && (
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedPartners.length} selected
              </span>
              <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus(true)}>
                Activate All
              </Button>
              <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus(false)}>
                Deactivate All
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedPartners([])}>
                Clear Selection
              </Button>
            </div>
          )}

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
                      <TableHead className="w-10">
                        <Checkbox
                          checked={categoryPartners.every(p => selectedPartners.includes(p.id))}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPartners(prev => [
                                ...prev,
                                ...categoryPartners.filter(p => !prev.includes(p.id)).map(p => p.id)
                              ]);
                            } else {
                              setSelectedPartners(prev => 
                                prev.filter(id => !categoryPartners.find(p => p.id === id))
                              );
                            }
                          }}
                        />
                      </TableHead>
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
                      <TableRow 
                        key={partner.id}
                        className={cn('group', !partner.is_active && 'opacity-60')}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedPartners.includes(partner.id)}
                            onCheckedChange={(checked) => handleSelectPartner(partner.id, !!checked)}
                          />
                        </TableCell>
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
                        <TableCell>
                          {editingValueId === partner.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                className="w-20 h-8"
                                value={editingValue}
                                onChange={(e) => setEditingValue(Number(e.target.value))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveValueEdit(partner.id);
                                  if (e.key === 'Escape') setEditingValueId(null);
                                }}
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => saveValueEdit(partner.id)}>
                                <Check className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingValueId(null)}>
                                <X className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div 
                                className="flex items-center gap-1 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2"
                                onClick={() => {
                                  setEditingValueId(partner.id);
                                  setEditingValue(partner.monthly_value);
                                }}
                              >
                                <span className={cn(partner.hide_value && 'text-muted-foreground line-through')}>
                                  ${partner.monthly_value}/mo
                                </span>
                                <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => toggleHideValue(partner.id, !partner.hide_value)}
                                title={partner.hide_value ? 'Show value to members' : 'Hide value from members'}
                              >
                                {partner.hide_value ? (
                                  <EyeOff className="w-3 h-3 text-muted-foreground" />
                                ) : (
                                  <Eye className="w-3 h-3 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('capitalize', TIER_COLORS[partner.min_tier])}>
                            {partner.min_tier}
                          </Badge>
                        </TableCell>
                        <TableCell>{partner.total_activations || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={partner.is_active ?? false}
                              onCheckedChange={(checked) => handleToggleActive(partner.id, partner.name, checked)}
                            />
                            <span className={partner.is_active ? 'text-green-600' : 'text-muted-foreground'}>
                              {partner.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {partner.is_featured && (
                              <Badge variant="outline" className="border-primary text-primary ml-1">
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
        </TabsContent>

        <TabsContent value="activations">
          <Card>
            <CardHeader>
              <CardTitle>Member Creator Subscriptions</CardTitle>
              <p className="text-sm text-muted-foreground">
                View which creators members have selected for their subscription benefits
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {creatorActivations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No creator subscription activations yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Benefit Type</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Selected Creator</TableHead>
                      <TableHead>Activated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creatorActivations.map(activation => (
                      <TableRow key={activation.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {activation.user?.display_name || 'Unknown User'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {activation.user?.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {activation.partner?.benefit_title || 'Creator Subscription'}
                        </TableCell>
                        <TableCell>
                          {getPlatformBadge(activation.selected_creator_platform || activation.partner?.creator_platform || null)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{activation.selected_creator_name}</div>
                          {activation.selected_creator_url && (
                            <a 
                              href={activation.selected_creator_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              View Channel
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </TableCell>
                        <TableCell>
                          {activation.activated_at 
                            ? format(new Date(activation.activated_at), 'MMM d, yyyy')
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          {activation.selected_creator_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(activation.selected_creator_url!, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

              <div className="space-y-3">
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

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="hideValue"
                    checked={formData.hide_value || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, hide_value: !!checked })}
                  />
                  <Label htmlFor="hideValue">Hide dollar value from members</Label>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  When checked, the "$X/mo value" badge won't appear on the member benefits page
                </p>
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
