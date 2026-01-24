import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Sparkles, Calendar, RefreshCw, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';

interface TierPromotion {
  id: string;
  promo_name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  multiplier_bonus: number;
  claims_bonus: number;
  discount_bonus: number;
  applies_to_tiers: string[];
  is_active: boolean;
  created_at: string;
}

export function TierPromotions() {
  const { profile } = useUnifiedUser();
  const [promotions, setPromotions] = useState<TierPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<TierPromotion | null>(null);
  const [formData, setFormData] = useState({
    promo_name: '',
    description: '',
    start_date: '',
    end_date: '',
    multiplier_bonus: 0,
    claims_bonus: 0,
    discount_bonus: 0,
    applies_to_tiers: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    is_active: true
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tier_promotions')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingPromo(null);
    setFormData({
      promo_name: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      multiplier_bonus: 0,
      claims_bonus: 0,
      discount_bonus: 0,
      applies_to_tiers: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
      is_active: true
    });
    setDialogOpen(true);
  };

  const openEditDialog = (promo: TierPromotion) => {
    setEditingPromo(promo);
    setFormData({
      promo_name: promo.promo_name,
      description: promo.description || '',
      start_date: promo.start_date.split('T')[0],
      end_date: promo.end_date.split('T')[0],
      multiplier_bonus: promo.multiplier_bonus || 0,
      claims_bonus: promo.claims_bonus || 0,
      discount_bonus: promo.discount_bonus || 0,
      applies_to_tiers: promo.applies_to_tiers || [],
      is_active: promo.is_active
    });
    setDialogOpen(true);
  };

  const savePromotion = async () => {
    try {
      if (!formData.promo_name || !formData.start_date || !formData.end_date) {
        toast.error('Please fill in all required fields');
        return;
      }

      const promoData = {
        promo_name: formData.promo_name,
        description: formData.description || null,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        multiplier_bonus: formData.multiplier_bonus,
        claims_bonus: formData.claims_bonus,
        discount_bonus: formData.discount_bonus,
        applies_to_tiers: formData.applies_to_tiers,
        is_active: formData.is_active,
        created_by: profile?.id
      };

      if (editingPromo) {
        const { error } = await supabase
          .from('tier_promotions')
          .update(promoData)
          .eq('id', editingPromo.id);
        
        if (error) throw error;
        toast.success('Promotion updated');
      } else {
        const { error } = await supabase
          .from('tier_promotions')
          .insert(promoData);
        
        if (error) throw error;
        toast.success('Promotion created');
      }

      setDialogOpen(false);
      fetchPromotions();
    } catch (error) {
      console.error('Error saving promotion:', error);
      toast.error('Failed to save promotion');
    }
  };

  const deletePromotion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;
    
    try {
      const { error } = await supabase
        .from('tier_promotions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Promotion deleted');
      fetchPromotions();
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast.error('Failed to delete promotion');
    }
  };

  const isActive = (promo: TierPromotion) => {
    const now = new Date();
    const start = new Date(promo.start_date);
    const end = new Date(promo.end_date);
    return promo.is_active && now >= start && now <= end;
  };

  const toggleTier = (tier: string) => {
    setFormData(prev => ({
      ...prev,
      applies_to_tiers: prev.applies_to_tiers.includes(tier)
        ? prev.applies_to_tiers.filter(t => t !== tier)
        : [...prev.applies_to_tiers, tier]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Seasonal Promotions
            </CardTitle>
            <CardDescription>
              Create temporary benefit boosts for special occasions
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            New Promotion
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {promotions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No promotions yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Promotion</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Bonuses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map(promo => (
                <TableRow key={promo.id}>
                  <TableCell>
                    <div className="font-medium">{promo.promo_name}</div>
                    {promo.description && (
                      <div className="text-xs text-muted-foreground">{promo.description}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(promo.start_date), 'MMM d')} - {format(new Date(promo.end_date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {promo.multiplier_bonus > 0 && (
                        <Badge variant="outline">+{promo.multiplier_bonus}x</Badge>
                      )}
                      {promo.claims_bonus > 0 && (
                        <Badge variant="outline">+{promo.claims_bonus} claims</Badge>
                      )}
                      {promo.discount_bonus > 0 && (
                        <Badge variant="outline">+{promo.discount_bonus}%</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isActive(promo) ? (
                      <Badge className="bg-success text-success-foreground">Active</Badge>
                    ) : promo.is_active ? (
                      <Badge variant="secondary">Scheduled</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(promo)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deletePromotion(promo.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPromo ? 'Edit Promotion' : 'Create Promotion'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Promotion Name *</Label>
              <Input
                value={formData.promo_name}
                onChange={e => setFormData(p => ({ ...p, promo_name: e.target.value }))}
                placeholder="e.g., Holiday Bonus 2026"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="All tiers get bonus multiplier through the holidays!"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Multiplier Bonus</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.multiplier_bonus}
                  onChange={e => setFormData(p => ({ ...p, multiplier_bonus: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Claims Bonus</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.claims_bonus}
                  onChange={e => setFormData(p => ({ ...p, claims_bonus: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Discount Bonus %</Label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.discount_bonus}
                  onChange={e => setFormData(p => ({ ...p, discount_bonus: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Applies to Tiers</Label>
              <div className="flex flex-wrap gap-2">
                {['bronze', 'silver', 'gold', 'platinum', 'diamond'].map(tier => (
                  <Badge
                    key={tier}
                    variant={formData.applies_to_tiers.includes(tier) ? 'default' : 'outline'}
                    className="cursor-pointer capitalize"
                    onClick={() => toggleTier(tier)}
                  >
                    {tier}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={checked => setFormData(p => ({ ...p, is_active: checked }))}
              />
              <Label>Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={savePromotion}>
              {editingPromo ? 'Update' : 'Create'} Promotion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
