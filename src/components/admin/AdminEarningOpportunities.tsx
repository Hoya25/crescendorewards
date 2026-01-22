import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ExternalLink, Loader2, RefreshCw,
  Leaf, ShoppingBag, Zap, Target, Users, Rocket, Gift, TrendingUp, Coins, Store, Smartphone, Handshake, Star
} from 'lucide-react';

const iconOptions = [
  { value: 'Leaf', label: 'Leaf', icon: Leaf },
  { value: 'ShoppingBag', label: 'Shopping Bag', icon: ShoppingBag },
  { value: 'Zap', label: 'Zap', icon: Zap },
  { value: 'Target', label: 'Target', icon: Target },
  { value: 'Users', label: 'Users', icon: Users },
  { value: 'Rocket', label: 'Rocket', icon: Rocket },
  { value: 'Gift', label: 'Gift', icon: Gift },
  { value: 'TrendingUp', label: 'Trending Up', icon: TrendingUp },
  { value: 'Coins', label: 'Coins', icon: Coins },
  { value: 'Store', label: 'Store', icon: Store },
  { value: 'Smartphone', label: 'Smartphone', icon: Smartphone },
  { value: 'Handshake', label: 'Handshake', icon: Handshake },
  { value: 'Star', label: 'Star', icon: Star },
];

const categoryOptions = [
  { value: 'shopping', label: 'Shopping' },
  { value: 'apps', label: 'Apps' },
  { value: 'partners', label: 'Partners' },
  { value: 'community', label: 'Community' },
  { value: 'impact', label: 'Impact' },
];

const earnTypeOptions = [
  { value: 'nctr', label: 'NCTR' },
  { value: 'task', label: 'Task' },
  { value: 'referral', label: 'Referral' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'activity', label: 'Activity' },
];

interface EarningOpportunityRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string | null;
  icon_name: string;
  icon_url: string | null;
  background_color: string;
  category: string;
  earn_type: string;
  earn_potential: string | null;
  cta_text: string;
  cta_url: string | null;
  opens_in_new_tab: boolean;
  is_featured: boolean;
  is_active: boolean;
  is_coming_soon: boolean;
  sort_order: number;
}

const defaultFormData = {
  name: '',
  slug: '',
  description: '',
  short_description: '',
  icon_name: 'Gift',
  icon_url: '',
  background_color: '#8B5CF6',
  category: 'shopping',
  earn_type: 'nctr',
  earn_potential: '',
  cta_text: 'Start Earning',
  cta_url: '',
  opens_in_new_tab: true,
  is_featured: false,
  is_active: true,
  is_coming_soon: false,
  sort_order: 0,
};

export function AdminEarningOpportunities() {
  const [opportunities, setOpportunities] = useState<EarningOpportunityRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  async function fetchOpportunities() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('earning_opportunities')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      toast.error('Failed to load opportunities');
      console.error(error);
    } else {
      setOpportunities(data || []);
    }
    setIsLoading(false);
  }

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function handleNameChange(name: string) {
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : generateSlug(name)
    }));
  }

  function openEditDialog(opp: EarningOpportunityRow) {
    setEditingId(opp.id);
    setFormData({
      name: opp.name,
      slug: opp.slug,
      description: opp.description,
      short_description: opp.short_description || '',
      icon_name: opp.icon_name,
      icon_url: opp.icon_url || '',
      background_color: opp.background_color,
      category: opp.category,
      earn_type: opp.earn_type,
      earn_potential: opp.earn_potential || '',
      cta_text: opp.cta_text,
      cta_url: opp.cta_url || '',
      opens_in_new_tab: opp.opens_in_new_tab,
      is_featured: opp.is_featured,
      is_active: opp.is_active,
      is_coming_soon: opp.is_coming_soon,
      sort_order: opp.sort_order,
    });
    setIsDialogOpen(true);
  }

  function openCreateDialog() {
    setEditingId(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.name || !formData.slug || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);

    const payload = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      short_description: formData.short_description || null,
      icon_name: formData.icon_name,
      icon_url: formData.icon_url || null,
      background_color: formData.background_color,
      category: formData.category,
      earn_type: formData.earn_type,
      earn_potential: formData.earn_potential || null,
      cta_text: formData.cta_text,
      cta_url: formData.cta_url || null,
      opens_in_new_tab: formData.opens_in_new_tab,
      is_featured: formData.is_featured,
      is_active: formData.is_active,
      is_coming_soon: formData.is_coming_soon,
      sort_order: formData.sort_order,
    };

    if (editingId) {
      const { error } = await supabase
        .from('earning_opportunities')
        .update(payload)
        .eq('id', editingId);

      if (error) {
        toast.error('Failed to update opportunity');
        console.error(error);
      } else {
        toast.success('Opportunity updated');
        setIsDialogOpen(false);
        fetchOpportunities();
      }
    } else {
      const { error } = await supabase
        .from('earning_opportunities')
        .insert(payload);

      if (error) {
        toast.error('Failed to create opportunity');
        console.error(error);
      } else {
        toast.success('Opportunity created');
        setIsDialogOpen(false);
        fetchOpportunities();
      }
    }

    setIsSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;

    const { error } = await supabase
      .from('earning_opportunities')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete opportunity');
      console.error(error);
    } else {
      toast.success('Opportunity deleted');
      fetchOpportunities();
    }
  }

  async function toggleFeatured(id: string, current: boolean) {
    const { error } = await supabase
      .from('earning_opportunities')
      .update({ is_featured: !current })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update');
    } else {
      fetchOpportunities();
    }
  }

  async function toggleActive(id: string, current: boolean) {
    const { error } = await supabase
      .from('earning_opportunities')
      .update({ is_active: !current })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update');
    } else {
      fetchOpportunities();
    }
  }

  const IconPreview = iconOptions.find(i => i.value === formData.icon_name)?.icon || Gift;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Earning Opportunities</h2>
          <p className="text-muted-foreground">Manage ways for users to earn NCTR</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchOpportunities} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Opportunity
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : opportunities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No earning opportunities yet
                </TableCell>
              </TableRow>
            ) : (
              opportunities.map(opp => {
                const IconComp = iconOptions.find(i => i.value === opp.icon_name)?.icon || Gift;
                return (
                  <TableRow key={opp.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
                          style={{ backgroundColor: opp.icon_url ? 'transparent' : opp.background_color }}
                        >
                          {opp.icon_url ? (
                            <img src={opp.icon_url} alt={opp.name} className="w-full h-full object-contain" />
                          ) : (
                            <IconComp className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className="font-medium">{opp.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{opp.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{opp.earn_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {opp.is_active ? (
                          <Badge className="bg-primary text-primary-foreground">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {opp.is_coming_soon && (
                          <Badge variant="outline">Soon</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={opp.is_featured}
                        onCheckedChange={() => toggleFeatured(opp.id, opp.is_featured)}
                      />
                    </TableCell>
                    <TableCell>{opp.sort_order}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {opp.cta_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(opp.cta_url!, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(opp)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(opp.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Earning Opportunity' : 'Add Earning Opportunity'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="The Garden"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input
                  value={formData.slug}
                  onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="the-garden"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Short Description</Label>
              <Input
                value={formData.short_description}
                onChange={e => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                placeholder="Brief tagline for cards"
              />
            </div>

            <div className="space-y-2">
              <Label>Full Description *</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of how to earn..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Logo Image URL (optional - overrides icon)</Label>
              <Input
                value={formData.icon_url}
                onChange={e => setFormData(prev => ({ ...prev, icon_url: e.target.value }))}
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-muted-foreground">
                Upload logos to Storage then paste the URL here. If set, this overrides the icon below.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Fallback Icon</Label>
                <Select 
                  value={formData.icon_name}
                  onValueChange={v => setFormData(prev => ({ ...prev, icon_name: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.icon className="w-4 h-4" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.background_color}
                    onChange={e => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={formData.background_color}
                    onChange={e => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                    placeholder="#8B5CF6"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preview</Label>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: formData.icon_url ? 'transparent' : formData.background_color }}
                >
                  {formData.icon_url ? (
                    <img src={formData.icon_url} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <IconPreview className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={formData.category}
                  onValueChange={v => setFormData(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Earn Type</Label>
                <Select 
                  value={formData.earn_type}
                  onValueChange={v => setFormData(prev => ({ ...prev, earn_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {earnTypeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Earn Potential</Label>
              <Input
                value={formData.earn_potential}
                onChange={e => setFormData(prev => ({ ...prev, earn_potential: e.target.value }))}
                placeholder="Up to 15% back in NCTR"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CTA Text</Label>
                <Input
                  value={formData.cta_text}
                  onChange={e => setFormData(prev => ({ ...prev, cta_text: e.target.value }))}
                  placeholder="Start Earning"
                />
              </div>
              <div className="space-y-2">
                <Label>CTA URL</Label>
                <Input
                  value={formData.cta_url}
                  onChange={e => setFormData(prev => ({ ...prev, cta_url: e.target.value }))}
                  placeholder="https://... or /path"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={e => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Opens in New Tab</Label>
                  <p className="text-xs text-muted-foreground">For external links</p>
                </div>
                <Switch 
                  checked={formData.opens_in_new_tab}
                  onCheckedChange={v => setFormData(prev => ({ ...prev, opens_in_new_tab: v }))}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Featured</Label>
                  <p className="text-xs text-muted-foreground">Show prominently</p>
                </div>
                <Switch 
                  checked={formData.is_featured}
                  onCheckedChange={v => setFormData(prev => ({ ...prev, is_featured: v }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Active</Label>
                  <p className="text-xs text-muted-foreground">Visible to users</p>
                </div>
                <Switch 
                  checked={formData.is_active}
                  onCheckedChange={v => setFormData(prev => ({ ...prev, is_active: v }))}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Coming Soon</Label>
                  <p className="text-xs text-muted-foreground">Show as upcoming</p>
                </div>
                <Switch 
                  checked={formData.is_coming_soon}
                  onCheckedChange={v => setFormData(prev => ({ ...prev, is_coming_soon: v }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
