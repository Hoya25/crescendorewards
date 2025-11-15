import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Star, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Brand {
  id: string;
  name: string;
  description: string;
  category: string;
  base_earning_rate: number;
  logo_emoji: string;
  logo_color: string;
  shop_url: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

const categories = [
  'Retail',
  'Dining',
  'Travel',
  'Entertainment',
  'Wellness',
  'Technology',
  'Lifestyle',
];

const logoColors = [
  { name: 'Blue', value: 'hsl(199 89% 48%)' },
  { name: 'Purple', value: 'hsl(271 91% 65%)' },
  { name: 'Green', value: 'hsl(142 76% 36%)' },
  { name: 'Orange', value: 'hsl(14 100% 57%)' },
  { name: 'Pink', value: 'hsl(328 85% 70%)' },
  { name: 'Yellow', value: 'hsl(43 96% 56%)' },
  { name: 'Cyan', value: 'hsl(180 100% 50%)' },
  { name: 'Gray', value: 'hsl(0 0% 60%)' },
];

export function AdminBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Retail',
    base_earning_rate: 5,
    logo_emoji: '🏪',
    logo_color: 'hsl(199 89% 48%)',
    shop_url: '',
    is_featured: false,
    is_active: true,
  });

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBrands(data || []);
    } catch (error: any) {
      console.error('Error loading brands:', error);
      toast.error('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBrand = async () => {
    try {
      setSubmitting(true);
      
      const { error } = await supabase
        .from('brands')
        .insert([formData]);

      if (error) throw error;

      toast.success('Brand added successfully');
      setShowAddDialog(false);
      resetForm();
      loadBrands();
    } catch (error: any) {
      console.error('Error adding brand:', error);
      toast.error('Failed to add brand');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBrand = async () => {
    if (!selectedBrand) return;

    try {
      setSubmitting(true);
      
      const { error } = await supabase
        .from('brands')
        .update(formData)
        .eq('id', selectedBrand.id);

      if (error) throw error;

      toast.success('Brand updated successfully');
      setShowEditDialog(false);
      setSelectedBrand(null);
      resetForm();
      loadBrands();
    } catch (error: any) {
      console.error('Error updating brand:', error);
      toast.error('Failed to update brand');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBrand = async () => {
    if (!selectedBrand) return;

    try {
      setSubmitting(true);
      
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', selectedBrand.id);

      if (error) throw error;

      toast.success('Brand deleted successfully');
      setShowDeleteDialog(false);
      setSelectedBrand(null);
      loadBrands();
    } catch (error: any) {
      console.error('Error deleting brand:', error);
      toast.error('Failed to delete brand');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFeatured = async (brand: Brand) => {
    try {
      const { error } = await supabase
        .from('brands')
        .update({ is_featured: !brand.is_featured })
        .eq('id', brand.id);

      if (error) throw error;

      toast.success(`Brand ${!brand.is_featured ? 'featured' : 'unfeatured'}`);
      loadBrands();
    } catch (error: any) {
      console.error('Error toggling featured:', error);
      toast.error('Failed to update brand');
    }
  };

  const handleToggleActive = async (brand: Brand) => {
    try {
      const { error } = await supabase
        .from('brands')
        .update({ is_active: !brand.is_active })
        .eq('id', brand.id);

      if (error) throw error;

      toast.success(`Brand ${!brand.is_active ? 'activated' : 'deactivated'}`);
      loadBrands();
    } catch (error: any) {
      console.error('Error toggling active:', error);
      toast.error('Failed to update brand');
    }
  };

  const openEditDialog = (brand: Brand) => {
    setSelectedBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description,
      category: brand.category,
      base_earning_rate: brand.base_earning_rate,
      logo_emoji: brand.logo_emoji,
      logo_color: brand.logo_color,
      shop_url: brand.shop_url,
      is_featured: brand.is_featured,
      is_active: brand.is_active,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (brand: Brand) => {
    setSelectedBrand(brand);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'Retail',
      base_earning_rate: 5,
      logo_emoji: '🏪',
      logo_color: 'hsl(199 89% 48%)',
      shop_url: '',
      is_featured: false,
      is_active: true,
    });
  };

  const BrandFormFields = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Brand Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Apple Store"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the brand"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="earning_rate">Base Earning Rate (NCTR per $1)</Label>
          <Input
            id="earning_rate"
            type="number"
            min="1"
            max="20"
            value={formData.base_earning_rate}
            onChange={(e) => setFormData({ ...formData, base_earning_rate: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="logo_emoji">Logo Emoji</Label>
          <Input
            id="logo_emoji"
            value={formData.logo_emoji}
            onChange={(e) => setFormData({ ...formData, logo_emoji: e.target.value })}
            placeholder="🏪"
            maxLength={10}
          />
        </div>

        <div>
          <Label htmlFor="logo_color">Logo Color</Label>
          <Select
            value={formData.logo_color}
            onValueChange={(value) => setFormData({ ...formData, logo_color: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {logoColors.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: color.value }}
                    />
                    {color.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="shop_url">Shop URL</Label>
        <Input
          id="shop_url"
          type="url"
          value={formData.shop_url}
          onChange={(e) => setFormData({ ...formData, shop_url: e.target.value })}
          placeholder="https://example.com"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="is_featured">Featured Partner</Label>
          <p className="text-sm text-muted-foreground">Show in featured carousel</p>
        </div>
        <Switch
          id="is_featured"
          checked={formData.is_featured}
          onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="is_active">Active Status</Label>
          <p className="text-sm text-muted-foreground">Brand is visible to users</p>
        </div>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Brand Partners</h2>
          <p className="text-muted-foreground">Manage alliance brand partnerships</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Brand
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Brands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands.filter(b => b.is_active).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Featured Brands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands.filter(b => b.is_featured).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(brands.map(b => b.category)).size}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Earning Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                          style={{ backgroundColor: brand.logo_color }}
                        >
                          {brand.logo_emoji}
                        </div>
                        <div>
                          <p className="font-medium">{brand.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {brand.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{brand.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">{brand.base_earning_rate} NCTR/$1</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={brand.is_active}
                          onCheckedChange={() => handleToggleActive(brand)}
                        />
                        <span className="text-sm">
                          {brand.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={brand.is_featured ? 'default' : 'outline'}
                        size="sm"
                        className="gap-2"
                        onClick={() => handleToggleFeatured(brand)}
                      >
                        <Star className={`w-3 h-3 ${brand.is_featured ? 'fill-current' : ''}`} />
                        {brand.is_featured ? 'Featured' : 'Feature'}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(brand.shop_url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(brand)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(brand)}
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add Brand Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Brand</DialogTitle>
            <DialogDescription>
              Add a new brand partner to the alliance
            </DialogDescription>
          </DialogHeader>
          <BrandFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBrand} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Brand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Brand Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
            <DialogDescription>
              Update brand partner information
            </DialogDescription>
          </DialogHeader>
          <BrandFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditBrand} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedBrand?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBrand}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={submitting}
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
