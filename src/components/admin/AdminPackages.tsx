import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Star, DollarSign, Gift, Package, RefreshCw, ExternalLink } from 'lucide-react';
import { PermissionGate } from './PermissionGate';
import { NCTRLogo } from '@/components/NCTRLogo';

interface ClaimPackage {
  id: string;
  name: string;
  description: string | null;
  claims_amount: number;
  price_cents: number;
  bonus_nctr: number;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface PackageFormData {
  name: string;
  description: string;
  claims_amount: number;
  price_cents: number;
  bonus_nctr: number;
  stripe_price_id: string;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

const defaultFormData: PackageFormData = {
  name: '',
  description: '',
  claims_amount: 10,
  price_cents: 5000,
  bonus_nctr: 150,
  stripe_price_id: '',
  is_popular: false,
  is_active: true,
  sort_order: 0,
};

export function AdminPackages() {
  const [packages, setPackages] = useState<ClaimPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ClaimPackage | null>(null);
  const [formData, setFormData] = useState<PackageFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('claim_packages')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      toast.error('Failed to load packages');
      console.error(error);
    } else {
      setPackages(data || []);
    }
    setLoading(false);
  };

  const handleOpenModal = (pkg?: ClaimPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        description: pkg.description || '',
        claims_amount: pkg.claims_amount,
        price_cents: pkg.price_cents,
        bonus_nctr: pkg.bonus_nctr,
        stripe_price_id: pkg.stripe_price_id || '',
        is_popular: pkg.is_popular,
        is_active: pkg.is_active,
        sort_order: pkg.sort_order,
      });
    } else {
      setEditingPackage(null);
      setFormData({
        ...defaultFormData,
        sort_order: packages.length + 1,
        bonus_nctr: Math.floor((5000 / 100) * 3), // Default: 3 NCTR per $1
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPackage(null);
    setFormData(defaultFormData);
  };

  const handleSave = async () => {
    if (!formData.name || formData.claims_amount <= 0 || formData.price_cents <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        claims_amount: formData.claims_amount,
        price_cents: formData.price_cents,
        bonus_nctr: formData.bonus_nctr,
        stripe_price_id: formData.stripe_price_id || null,
        is_popular: formData.is_popular,
        is_active: formData.is_active,
        sort_order: formData.sort_order,
      };

      if (editingPackage) {
        const { error } = await supabase
          .from('claim_packages')
          .update(payload)
          .eq('id', editingPackage.id);

        if (error) throw error;
        toast.success('Package updated successfully');
      } else {
        const { error } = await supabase
          .from('claim_packages')
          .insert(payload);

        if (error) throw error;
        toast.success('Package created successfully');
      }

      handleCloseModal();
      fetchPackages();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save package');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pkg: ClaimPackage) => {
    if (!confirm(`Delete "${pkg.name}"? This cannot be undone.`)) return;

    const { error } = await supabase
      .from('claim_packages')
      .delete()
      .eq('id', pkg.id);

    if (error) {
      toast.error('Failed to delete package');
      console.error(error);
    } else {
      toast.success('Package deleted');
      fetchPackages();
    }
  };

  const handleToggleActive = async (pkg: ClaimPackage) => {
    const { error } = await supabase
      .from('claim_packages')
      .update({ is_active: !pkg.is_active })
      .eq('id', pkg.id);

    if (error) {
      toast.error('Failed to update package');
    } else {
      toast.success(pkg.is_active ? 'Package deactivated' : 'Package activated');
      fetchPackages();
    }
  };

  const handleSyncWithStripe = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-packages-stripe');
      
      if (error) throw error;
      
      toast.success(`Synced ${data?.synced || 0} packages with Stripe`);
      fetchPackages();
    } catch (error) {
      console.error(error);
      toast.error('Failed to sync with Stripe. Check edge function logs.');
    } finally {
      setSyncing(false);
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const calculateBonusFromPrice = (priceCents: number) => Math.floor((priceCents / 100) * 3);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Claim Packages</h2>
          <p className="text-muted-foreground">Manage claim purchase packages and Stripe pricing</p>
        </div>
        <div className="flex gap-2">
          <PermissionGate permission="rewards_edit">
            <Button variant="outline" onClick={handleSyncWithStripe} disabled={syncing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync with Stripe
            </Button>
          </PermissionGate>
          <PermissionGate permission="rewards_create">
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Package
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{packages.length}</p>
                <p className="text-sm text-muted-foreground">Total Packages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{packages.filter(p => p.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{packages.filter(p => p.is_popular).length}</p>
                <p className="text-sm text-muted-foreground">Featured</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Gift className="w-8 h-8 text-violet-500" />
              <div>
                <p className="text-2xl font-bold">{packages.filter(p => p.stripe_price_id).length}</p>
                <p className="text-sm text-muted-foreground">Stripe Synced</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Packages Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Packages</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Claims</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Bonus NCTR</TableHead>
                <TableHead>Stripe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg.id} className={!pkg.is_active ? 'opacity-50' : ''}>
                  <TableCell className="font-mono text-sm">{pkg.sort_order}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{pkg.name}</span>
                      {pkg.is_popular && (
                        <Badge className="bg-gradient-to-r from-violet-600 to-purple-600">
                          <Star className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{pkg.claims_amount}</TableCell>
                  <TableCell>{formatPrice(pkg.price_cents)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span>+{pkg.bonus_nctr}</span>
                      <NCTRLogo size="xs" />
                    </div>
                  </TableCell>
                  <TableCell>
                    {pkg.stripe_price_id ? (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Synced
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        Not synced
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={pkg.is_active}
                      onCheckedChange={() => handleToggleActive(pkg)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <PermissionGate permission="rewards_edit">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenModal(pkg)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="rewards_delete">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(pkg)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </PermissionGate>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPackage ? 'Edit Package' : 'Create Package'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Package Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Starter Pack"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="claims">Claims Amount *</Label>
                <Input
                  id="claims"
                  type="number"
                  min={1}
                  value={formData.claims_amount}
                  onChange={(e) => setFormData({ ...formData, claims_amount: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  min={1}
                  step={0.01}
                  value={(formData.price_cents / 100).toFixed(2)}
                  onChange={(e) => {
                    const cents = Math.round(parseFloat(e.target.value) * 100) || 0;
                    setFormData({
                      ...formData,
                      price_cents: cents,
                      bonus_nctr: calculateBonusFromPrice(cents),
                    });
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bonus">Bonus NCTR (360LOCK)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="bonus"
                    type="number"
                    min={0}
                    value={formData.bonus_nctr}
                    onChange={(e) => setFormData({ ...formData, bonus_nctr: parseInt(e.target.value) || 0 })}
                  />
                  <NCTRLogo size="sm" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Auto: 3 NCTR per $1 = {calculateBonusFromPrice(formData.price_cents)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort">Sort Order</Label>
                <Input
                  id="sort"
                  type="number"
                  min={0}
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stripe">Stripe Price ID</Label>
              <Input
                id="stripe"
                value={formData.stripe_price_id}
                onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value })}
                placeholder="price_..."
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to auto-create via "Sync with Stripe"
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="popular"
                  checked={formData.is_popular}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                />
                <Label htmlFor="popular">Mark as Popular</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingPackage ? 'Update Package' : 'Create Package'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
