import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Save, 
  RefreshCw, 
  Trophy, 
  Zap, 
  Gift, 
  Tag, 
  Shield,
  Clock,
  Sparkles,
  Truck,
  Headphones,
  Star,
  Plus,
  X,
  AlertCircle,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

interface StatusTier {
  id: string;
  tier_name: string;
  display_name: string;
  badge_emoji: string;
  badge_color: string;
  min_nctr_360_locked: number;
  max_nctr_360_locked: number | null;
  description: string | null;
  earning_multiplier: number;
  claims_per_month: number;
  claims_per_year: number;
  unlimited_claims: boolean;
  discount_percent: number;
  priority_support: boolean;
  early_access: boolean;
  vip_events: boolean;
  concierge_service: boolean;
  free_shipping: boolean;
  custom_benefits: string[];
  benefits: string[];
  sort_order: number;
  is_active: boolean;
}

export function AdminStatusTiers() {
  const [tiers, setTiers] = useState<StatusTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTier, setSelectedTier] = useState<StatusTier | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newCustomBenefit, setNewCustomBenefit] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('status_tiers')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      
      // Parse custom_benefits from JSONB
      const parsedTiers = (data || []).map(tier => ({
        ...tier,
        custom_benefits: Array.isArray(tier.custom_benefits) 
          ? tier.custom_benefits.map(String)
          : typeof tier.custom_benefits === 'string'
            ? JSON.parse(tier.custom_benefits || '[]')
            : [],
        benefits: Array.isArray(tier.benefits)
          ? tier.benefits.map(String)
          : typeof tier.benefits === 'string'
            ? JSON.parse(tier.benefits || '[]')
            : []
      }));
      
      setTiers(parsedTiers);
    } catch (error) {
      console.error('Error fetching tiers:', error);
      toast.error('Failed to load status tiers');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (tier: StatusTier) => {
    setSelectedTier({ ...tier });
    setHasChanges(false);
    setEditDialogOpen(true);
  };

  const handleTierChange = (field: keyof StatusTier, value: any) => {
    if (!selectedTier) return;
    setSelectedTier({ ...selectedTier, [field]: value });
    setHasChanges(true);
  };

  const addCustomBenefit = () => {
    if (!selectedTier || !newCustomBenefit.trim()) return;
    const updated = [...(selectedTier.custom_benefits || []), newCustomBenefit.trim()];
    handleTierChange('custom_benefits', updated);
    setNewCustomBenefit('');
  };

  const removeCustomBenefit = (index: number) => {
    if (!selectedTier) return;
    const updated = selectedTier.custom_benefits.filter((_, i) => i !== index);
    handleTierChange('custom_benefits', updated);
  };

  const generateBenefitsArray = (tier: StatusTier): string[] => {
    const benefits: string[] = [];
    
    // Catalog access
    benefits.push(`Access to ${tier.display_name.toLowerCase()} reward catalog`);
    
    // Claims
    if (tier.unlimited_claims) {
      benefits.push('Unlimited reward claims');
    } else if (tier.claims_per_month > 0) {
      benefits.push(`${tier.claims_per_month} reward claim${tier.claims_per_month > 1 ? 's' : ''} per month`);
    } else if (tier.claims_per_year > 0) {
      benefits.push(`${tier.claims_per_year} reward claim${tier.claims_per_year > 1 ? 's' : ''} per year`);
    }
    
    // Multiplier
    if (tier.earning_multiplier > 1) {
      benefits.push(`Earn ${tier.earning_multiplier}x NCTR on all activities`);
    }
    
    // Discount
    if (tier.discount_percent > 0) {
      benefits.push(`${tier.discount_percent}% discount on partner brands`);
    }
    
    // Boolean perks
    if (tier.priority_support) benefits.push('Priority customer support');
    if (tier.early_access) benefits.push('Early access to new rewards');
    if (tier.vip_events) benefits.push('VIP event invitations');
    if (tier.concierge_service) benefits.push('Personal concierge service');
    if (tier.free_shipping) benefits.push('Free expedited shipping');
    
    // Custom benefits
    if (tier.custom_benefits && tier.custom_benefits.length > 0) {
      benefits.push(...tier.custom_benefits);
    }
    
    return benefits;
  };

  const saveTier = async () => {
    if (!selectedTier) return;
    
    setSaving(true);
    try {
      // Generate the benefits array from structured data
      const generatedBenefits = generateBenefitsArray(selectedTier);
      
      const { error } = await supabase
        .from('status_tiers')
        .update({
          display_name: selectedTier.display_name,
          badge_emoji: selectedTier.badge_emoji,
          badge_color: selectedTier.badge_color,
          description: selectedTier.description,
          min_nctr_360_locked: selectedTier.min_nctr_360_locked,
          max_nctr_360_locked: selectedTier.max_nctr_360_locked,
          earning_multiplier: selectedTier.earning_multiplier,
          claims_per_month: selectedTier.claims_per_month,
          claims_per_year: selectedTier.claims_per_year,
          unlimited_claims: selectedTier.unlimited_claims,
          discount_percent: selectedTier.discount_percent,
          priority_support: selectedTier.priority_support,
          early_access: selectedTier.early_access,
          vip_events: selectedTier.vip_events,
          concierge_service: selectedTier.concierge_service,
          free_shipping: selectedTier.free_shipping,
          custom_benefits: selectedTier.custom_benefits,
          benefits: generatedBenefits,
          is_active: selectedTier.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTier.id);

      if (error) throw error;
      
      toast.success(`${selectedTier.display_name} tier updated successfully`);
      setEditDialogOpen(false);
      fetchTiers();
    } catch (error) {
      console.error('Error saving tier:', error);
      toast.error('Failed to save tier');
    } finally {
      setSaving(false);
    }
  };

  const getTierColor = (color: string) => {
    // Return the color as-is for inline styles
    return color;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Status Tier Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure tier thresholds, benefits, and display settings
          </p>
        </div>
        <Button variant="outline" onClick={fetchTiers} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {tiers.map((tier) => (
          <Card 
            key={tier.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2"
            style={{ borderColor: tier.badge_color }}
            onClick={() => openEditDialog(tier)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{tier.badge_emoji}</span>
                  <CardTitle className="text-lg">{tier.display_name}</CardTitle>
                </div>
                {!tier.is_active && (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                {tier.min_nctr_360_locked.toLocaleString()} - {tier.max_nctr_360_locked?.toLocaleString() || '∞'} NCTR
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Key Stats */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-warning" />
                  <span className="font-medium">{tier.earning_multiplier}x</span>
                </div>
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-success" />
                  <span className="font-medium">{tier.discount_percent}%</span>
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <Gift className="w-3 h-3 text-primary" />
                  <span className="text-xs">
                    {tier.unlimited_claims 
                      ? 'Unlimited claims' 
                      : tier.claims_per_month > 0 
                        ? `${tier.claims_per_month}/mo` 
                        : `${tier.claims_per_year}/yr`
                    }
                  </span>
                </div>
              </div>

              {/* Quick Perk Badges */}
              <div className="flex flex-wrap gap-1">
                {tier.priority_support && (
                  <Badge variant="outline" className="text-xs py-0">
                    <Headphones className="w-3 h-3 mr-1" />
                    Support
                  </Badge>
                )}
                {tier.early_access && (
                  <Badge variant="outline" className="text-xs py-0">
                    <Clock className="w-3 h-3 mr-1" />
                    Early
                  </Badge>
                )}
                {tier.vip_events && (
                  <Badge variant="outline" className="text-xs py-0">
                    <Star className="w-3 h-3 mr-1" />
                    VIP
                  </Badge>
                )}
                {tier.free_shipping && (
                  <Badge variant="outline" className="text-xs py-0">
                    <Truck className="w-3 h-3 mr-1" />
                    Ship
                  </Badge>
                )}
              </div>

              <Button variant="ghost" size="sm" className="w-full mt-2">
                Edit Tier
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedTier?.badge_emoji}</span>
              Edit {selectedTier?.display_name} Tier
            </DialogTitle>
            <DialogDescription>
              Update tier settings, thresholds, and benefits
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            {selectedTier && (
              <div className="space-y-6 py-4">
                {/* Display Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Display Settings
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Display Name</Label>
                      <Input
                        value={selectedTier.display_name}
                        onChange={(e) => handleTierChange('display_name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Badge Emoji</Label>
                      <Input
                        value={selectedTier.badge_emoji}
                        onChange={(e) => handleTierChange('badge_emoji', e.target.value)}
                        className="text-center text-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Badge Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={selectedTier.badge_color}
                          onChange={(e) => handleTierChange('badge_color', e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={selectedTier.badge_color}
                          onChange={(e) => handleTierChange('badge_color', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Active Status</Label>
                      <div className="flex items-center gap-2 pt-2">
                        <Switch
                          checked={selectedTier.is_active}
                          onCheckedChange={(checked) => handleTierChange('is_active', checked)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {selectedTier.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={selectedTier.description || ''}
                      onChange={(e) => handleTierChange('description', e.target.value)}
                      placeholder="Short description of this tier..."
                      rows={2}
                    />
                  </div>
                </div>

                <Separator />

                {/* Thresholds */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    NCTR Requirements
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Minimum 360LOCK NCTR</Label>
                      <Input
                        type="number"
                        value={selectedTier.min_nctr_360_locked}
                        onChange={(e) => handleTierChange('min_nctr_360_locked', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Maximum 360LOCK NCTR</Label>
                      <Input
                        type="number"
                        value={selectedTier.max_nctr_360_locked ?? ''}
                        onChange={(e) => handleTierChange('max_nctr_360_locked', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="Leave empty for unlimited"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Core Benefits */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Core Benefits
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Earning Multiplier</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.05"
                          min="1"
                          max="5"
                          value={selectedTier.earning_multiplier}
                          onChange={(e) => handleTierChange('earning_multiplier', parseFloat(e.target.value) || 1)}
                        />
                        <span className="text-muted-foreground">x</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Discount Percent</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={selectedTier.discount_percent}
                          onChange={(e) => handleTierChange('discount_percent', parseInt(e.target.value) || 0)}
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Claims */}
                  <div className="space-y-2">
                    <Label>Claims Allowance</Label>
                    <div className="flex items-center gap-4 mb-2">
                      <Switch
                        checked={selectedTier.unlimited_claims}
                        onCheckedChange={(checked) => {
                          handleTierChange('unlimited_claims', checked);
                          if (checked) {
                            handleTierChange('claims_per_month', 0);
                            handleTierChange('claims_per_year', 0);
                          }
                        }}
                      />
                      <span className="text-sm">Unlimited Claims</span>
                    </div>
                    {!selectedTier.unlimited_claims && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Per Month</Label>
                          <Input
                            type="number"
                            min="0"
                            value={selectedTier.claims_per_month}
                            onChange={(e) => handleTierChange('claims_per_month', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Per Year</Label>
                          <Input
                            type="number"
                            min="0"
                            value={selectedTier.claims_per_year}
                            onChange={(e) => handleTierChange('claims_per_year', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Perks Toggles */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Additional Perks
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'priority_support', label: 'Priority Support', icon: Headphones },
                      { key: 'early_access', label: 'Early Access', icon: Clock },
                      { key: 'vip_events', label: 'VIP Events', icon: Star },
                      { key: 'concierge_service', label: 'Concierge Service', icon: Shield },
                      { key: 'free_shipping', label: 'Free Shipping', icon: Truck },
                    ].map(({ key, label, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{label}</span>
                        </div>
                        <Switch
                          checked={selectedTier[key as keyof StatusTier] as boolean}
                          onCheckedChange={(checked) => handleTierChange(key as keyof StatusTier, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Custom Benefits */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    Custom Benefits
                  </h3>
                  <div className="flex gap-2">
                    <Input
                      value={newCustomBenefit}
                      onChange={(e) => setNewCustomBenefit(e.target.value)}
                      placeholder="Add a custom benefit..."
                      onKeyDown={(e) => e.key === 'Enter' && addCustomBenefit()}
                    />
                    <Button onClick={addCustomBenefit} size="icon" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {selectedTier.custom_benefits?.length > 0 && (
                    <div className="space-y-2">
                      {selectedTier.custom_benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <Check className="w-4 h-4 text-success flex-shrink-0" />
                          <span className="text-sm flex-1">{benefit}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeCustomBenefit(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Preview */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Generated Benefits Preview
                  </h3>
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4">
                      <ul className="space-y-1">
                        {generateBenefitsArray(selectedTier).map((benefit, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveTier} disabled={saving || !hasChanges}>
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
