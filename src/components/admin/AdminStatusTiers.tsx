import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  Table as TableIcon,
  LayoutGrid,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import {
  NumberInputWithButtons,
  EmojiPicker,
  TierValidationWarnings,
  TierPreviewPanel,
  TierProgressionBar,
  TierComparisonTable,
  BenefitTemplates,
  TierChangeHistory,
  UserImpactPreview,
  TierPromotions,
  BenefitTemplate
} from './tier-editor';

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
  const { profile } = useUnifiedUser();
  const [tiers, setTiers] = useState<StatusTier[]>([]);
  const [originalTiers, setOriginalTiers] = useState<StatusTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTier, setSelectedTier] = useState<StatusTier | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newCustomBenefit, setNewCustomBenefit] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [previewTierId, setPreviewTierId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showImpactPreview, setShowImpactPreview] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    display: true,
    thresholds: true,
    benefits: true,
    perks: false,
    custom: false
  });
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchTiers();
  }, []);

  useEffect(() => {
    if (tiers.length > 0 && !previewTierId) {
      setPreviewTierId(tiers[0].id);
    }
  }, [tiers, previewTierId]);

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('status_tiers')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      
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
      setOriginalTiers(JSON.parse(JSON.stringify(parsedTiers)));
    } catch (error) {
      console.error('Error fetching tiers:', error);
      toast.error('Failed to load status tiers');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (tier: StatusTier) => {
    setSelectedTier({ ...tier });
    setPreviewTierId(tier.id);
    setHasChanges(false);
    setEditDialogOpen(true);
  };

  const handleTierChange = (field: keyof StatusTier, value: any) => {
    if (!selectedTier) return;
    setSelectedTier({ ...selectedTier, [field]: value });
    setHasChanges(true);
  };

  const handleBulkTierUpdate = (tierId: string, field: keyof StatusTier, value: any) => {
    setTiers(prev => prev.map(t => 
      t.id === tierId ? { ...t, [field]: value } : t
    ));
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
    
    benefits.push(`Access to ${tier.display_name.toLowerCase()} reward catalog`);
    
    if (tier.unlimited_claims) {
      benefits.push('Unlimited reward claims');
    } else if (tier.claims_per_month > 0) {
      benefits.push(`${tier.claims_per_month} reward claim${tier.claims_per_month > 1 ? 's' : ''} per month`);
    } else if (tier.claims_per_year > 0) {
      benefits.push(`${tier.claims_per_year} reward claim${tier.claims_per_year > 1 ? 's' : ''} per year`);
    }
    
    if (tier.earning_multiplier > 1) {
      benefits.push(`Earn ${tier.earning_multiplier}x NCTR on all activities`);
    }
    
    if (tier.discount_percent > 0) {
      benefits.push(`${tier.discount_percent}% discount on partner brands`);
    }
    
    if (tier.priority_support) benefits.push('Priority customer support');
    if (tier.early_access) benefits.push('Early access to new rewards');
    if (tier.vip_events) benefits.push('VIP event invitations');
    if (tier.concierge_service) benefits.push('Personal concierge service');
    if (tier.free_shipping) benefits.push('Free expedited shipping');
    
    if (tier.custom_benefits && tier.custom_benefits.length > 0) {
      benefits.push(...tier.custom_benefits);
    }
    
    return benefits;
  };

  const logTierChange = async (tierId: string, oldValues: Partial<StatusTier>, newValues: Partial<StatusTier>) => {
    try {
      await supabase.from('tier_changes_log').insert({
        tier_id: tierId,
        changed_by: profile?.id,
        old_values: oldValues,
        new_values: newValues,
        change_summary: `Updated tier settings`
      });
    } catch (error) {
      console.error('Failed to log tier change:', error);
    }
  };

  const saveTier = async () => {
    if (!selectedTier) return;
    
    setSaving(true);
    try {
      const generatedBenefits = generateBenefitsArray(selectedTier);
      const original = originalTiers.find(t => t.id === selectedTier.id);
      
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
      
      // Log the change
      if (original) {
        await logTierChange(selectedTier.id, original, selectedTier);
      }
      
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

  const saveAllTiers = async () => {
    setSaving(true);
    try {
      for (const tier of tiers) {
        const generatedBenefits = generateBenefitsArray(tier);
        const original = originalTiers.find(t => t.id === tier.id);
        
        const { error } = await supabase
          .from('status_tiers')
          .update({
            earning_multiplier: tier.earning_multiplier,
            claims_per_month: tier.claims_per_month,
            claims_per_year: tier.claims_per_year,
            unlimited_claims: tier.unlimited_claims,
            discount_percent: tier.discount_percent,
            priority_support: tier.priority_support,
            early_access: tier.early_access,
            vip_events: tier.vip_events,
            concierge_service: tier.concierge_service,
            free_shipping: tier.free_shipping,
            min_nctr_360_locked: tier.min_nctr_360_locked,
            benefits: generatedBenefits,
            updated_at: new Date().toISOString()
          })
          .eq('id', tier.id);

        if (error) throw error;
        
        if (original) {
          await logTierChange(tier.id, original, tier);
        }
      }
      
      toast.success('All tiers updated successfully');
      setShowImpactPreview(false);
      fetchTiers();
    } catch (error) {
      console.error('Error saving tiers:', error);
      toast.error('Failed to save tiers');
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (template: BenefitTemplate) => {
    const tierNameMap: Record<string, keyof typeof template.tiers> = {
      'bronze': 'bronze',
      'silver': 'silver',
      'gold': 'gold',
      'platinum': 'platinum',
      'diamond': 'diamond'
    };

    setTiers(prev => prev.map(tier => {
      const templateKey = tierNameMap[tier.tier_name.toLowerCase()];
      if (!templateKey) return tier;
      
      const templateValues = template.tiers[templateKey];
      return {
        ...tier,
        ...templateValues
      };
    }));
    
    setHasChanges(true);
    toast.success(`Applied "${template.name}" template`);
  };

  const handleSaveWithPreview = () => {
    setShowImpactPreview(true);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const sortedTiers = useMemo(() => 
    [...tiers].sort((a, b) => a.sort_order - b.sort_order), 
    [tiers]
  );

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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Status Tier Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure tier thresholds, benefits, and display settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={viewMode === 'cards' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button 
            variant={viewMode === 'table' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <TableIcon className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={fetchTiers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tiers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tiers">Tier Configuration</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="history">Change History</TabsTrigger>
        </TabsList>

        <TabsContent value="tiers" className="space-y-6">
          {/* Tier Progression Visualization */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Tier Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <TierProgressionBar 
                tiers={sortedTiers}
                selectedTierId={previewTierId}
                onSelectTier={(tier) => {
                  setPreviewTierId(tier.id);
                  openEditDialog(tier);
                }}
              />
            </CardContent>
          </Card>

          {/* Validation Warnings */}
          <TierValidationWarnings tiers={sortedTiers} />

          {/* Main Content */}
          {viewMode === 'table' ? (
            <TierComparisonTable 
              tiers={sortedTiers}
              onUpdate={handleBulkTierUpdate}
              onSave={handleSaveWithPreview}
              hasChanges={hasChanges}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tier Cards */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sortedTiers.map((tier, index) => {
                    const prevTier = index > 0 ? sortedTiers[index - 1] : null;
                    
                    return (
                      <Card 
                        key={tier.id} 
                        className="cursor-pointer hover:shadow-lg transition-shadow border-2"
                        style={{ borderColor: tier.badge_color }}
                        onClick={() => openEditDialog(tier)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span 
                                className="text-2xl w-10 h-10 flex items-center justify-center rounded-full"
                                style={{ backgroundColor: `${tier.badge_color}20` }}
                              >
                                {tier.badge_emoji}
                              </span>
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
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 bg-muted/50 rounded">
                              <Zap className="w-3 h-3 mx-auto text-warning" />
                              <span className="text-sm font-bold block">{tier.earning_multiplier}x</span>
                            </div>
                            <div className="p-2 bg-muted/50 rounded">
                              <Gift className="w-3 h-3 mx-auto text-primary" />
                              <span className="text-sm font-bold block">
                                {tier.unlimited_claims ? '∞' : tier.claims_per_month > 0 ? `${tier.claims_per_month}/mo` : `${tier.claims_per_year}/yr`}
                              </span>
                            </div>
                            <div className="p-2 bg-muted/50 rounded">
                              <Tag className="w-3 h-3 mx-auto text-success" />
                              <span className="text-sm font-bold block">{tier.discount_percent}%</span>
                            </div>
                          </div>

                          {/* Upgrade Highlight */}
                          {prevTier && (
                            <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
                              <span className="text-success">↑</span> +{(tier.earning_multiplier - prevTier.earning_multiplier).toFixed(2)}x from {prevTier.display_name}
                            </div>
                          )}

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
                            <Eye className="w-4 h-4 mr-2" />
                            Edit Tier
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Preview Panel */}
              <div className="hidden lg:block">
                <TierPreviewPanel
                  tiers={sortedTiers}
                  selectedTierId={previewTierId}
                  onSelectTier={setPreviewTierId}
                  editingTier={selectedTier}
                />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates">
          <BenefitTemplates onApplyTemplate={applyTemplate} />
          
          {hasChanges && (
            <Card className="mt-6 border-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Template applied. Review changes in the tier configuration tab, then save.
                  </p>
                  <Button onClick={handleSaveWithPreview}>
                    <Save className="w-4 h-4 mr-2" />
                    Review & Save All
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="promotions">
          <TierPromotions />
        </TabsContent>

        <TabsContent value="history">
          <TierChangeHistory />
        </TabsContent>
      </Tabs>

      {/* User Impact Preview Dialog */}
      <UserImpactPreview
        open={showImpactPreview}
        onOpenChange={setShowImpactPreview}
        originalTiers={originalTiers}
        modifiedTiers={tiers}
        onConfirm={saveAllTiers}
      />

      {/* Edit Dialog - Fixed Layout with Proper Scrolling */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0">
          {/* Fixed Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-3">
              <span 
                className="text-2xl w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedTier?.badge_color ? `${selectedTier.badge_color}20` : undefined }}
              >
                {selectedTier?.badge_emoji}
              </span>
              <span>Edit {selectedTier?.display_name} Tier</span>
            </DialogTitle>
            <DialogDescription>
              Update tier settings, thresholds, and benefits. Changes preview in real-time.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="flex flex-col lg:flex-row">
              {/* Edit Form Section - Takes remaining space */}
              <div className="flex-1 min-w-0 p-6">
                {selectedTier && (
                  <Tabs defaultValue="display" className="w-full">
                    {/* Tabs with proper width distribution and gap */}
                    <TabsList className="w-full grid grid-cols-3 gap-1 p-1 mb-6">
                      <TabsTrigger 
                        value="display" 
                        className="flex items-center justify-center gap-2 px-3 py-2"
                      >
                        <Sparkles className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline">Display</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="thresholds" 
                        className="flex items-center justify-center gap-2 px-3 py-2"
                      >
                        <Shield className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline">Thresholds</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="benefits" 
                        className="flex items-center justify-center gap-2 px-3 py-2"
                      >
                        <Zap className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline">Benefits</span>
                      </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Display Settings */}
                    <TabsContent value="display" className="mt-0 space-y-4">
                      {/* Display Name - FULL WIDTH */}
                      <div className="space-y-2">
                        <Label htmlFor="display_name">Display Name</Label>
                        <Input
                          id="display_name"
                          value={selectedTier.display_name}
                          onChange={(e) => handleTierChange('display_name', e.target.value)}
                          className="w-full"
                          placeholder="e.g., Gold Member"
                        />
                      </div>
                      
                      {/* Badge Emoji and Color - SIDE BY SIDE */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Badge Emoji</Label>
                          <EmojiPicker
                            value={selectedTier.badge_emoji}
                            onChange={(emoji) => handleTierChange('badge_emoji', emoji)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Badge Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={selectedTier.badge_color}
                              onChange={(e) => handleTierChange('badge_color', e.target.value)}
                              className="w-14 h-10 p-1 cursor-pointer flex-shrink-0"
                            />
                            <Input
                              value={selectedTier.badge_color}
                              onChange={(e) => handleTierChange('badge_color', e.target.value)}
                              className="flex-1 font-mono text-sm min-w-0"
                              placeholder="#FFD700"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Description - FULL WIDTH */}
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={selectedTier.description || ''}
                          onChange={(e) => handleTierChange('description', e.target.value)}
                          placeholder="Describe what makes this tier special..."
                          rows={3}
                          className="w-full resize-none"
                        />
                      </div>

                      {/* Active Status Toggle */}
                      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                        <div className="space-y-0.5">
                          <Label>Active Status</Label>
                          <p className="text-xs text-muted-foreground">
                            Inactive tiers are hidden from users
                          </p>
                        </div>
                        <Switch
                          checked={selectedTier.is_active}
                          onCheckedChange={(checked) => handleTierChange('is_active', checked)}
                        />
                      </div>
                    </TabsContent>

                    {/* Tab 2: Thresholds */}
                    <TabsContent value="thresholds" className="mt-0 space-y-4">
                      <div className="p-4 rounded-lg border bg-muted/30">
                        <p className="text-sm text-muted-foreground">
                          Set the NCTR locking requirements for users to qualify for this tier.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="min_nctr">Minimum 360LOCK NCTR</Label>
                        <Input
                          id="min_nctr"
                          type="number"
                          value={selectedTier.min_nctr_360_locked}
                          onChange={(e) => handleTierChange('min_nctr_360_locked', parseInt(e.target.value) || 0)}
                          className="w-full"
                          min={0}
                        />
                        <p className="text-xs text-muted-foreground">
                          Users need at least this much NCTR locked to qualify
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="max_nctr">Maximum 360LOCK NCTR</Label>
                        <Input
                          id="max_nctr"
                          type="number"
                          value={selectedTier.max_nctr_360_locked ?? ''}
                          onChange={(e) => handleTierChange('max_nctr_360_locked', e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="Leave empty for no maximum (top tier)"
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Users with more than this amount advance to the next tier
                        </p>
                      </div>
                    </TabsContent>

                    {/* Tab 3: Benefits */}
                    <TabsContent value="benefits" className="mt-0 space-y-4">
                      {/* Earning Multiplier */}
                      <div className="space-y-3 p-4 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-warning" />
                            <Label>Earning Multiplier</Label>
                          </div>
                          <span className="text-lg font-bold text-warning">{selectedTier.earning_multiplier}x</span>
                        </div>
                        <NumberInputWithButtons
                          value={selectedTier.earning_multiplier}
                          onChange={(val) => handleTierChange('earning_multiplier', val)}
                          min={1.0}
                          max={3.0}
                          step={0.05}
                          suffix="x"
                        />
                        <Slider
                          value={[selectedTier.earning_multiplier]}
                          onValueChange={([val]) => handleTierChange('earning_multiplier', val)}
                          min={1.0}
                          max={3.0}
                          step={0.05}
                        />
                      </div>

                      {/* Discount Percent */}
                      <div className="space-y-3 p-4 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-success" />
                            <Label>Discount Percent</Label>
                          </div>
                          <span className="text-lg font-bold text-success">{selectedTier.discount_percent}%</span>
                        </div>
                        <NumberInputWithButtons
                          value={selectedTier.discount_percent}
                          onChange={(val) => handleTierChange('discount_percent', val)}
                          min={0}
                          max={50}
                          step={5}
                          suffix="%"
                        />
                        <Slider
                          value={[selectedTier.discount_percent]}
                          onValueChange={([val]) => handleTierChange('discount_percent', val)}
                          min={0}
                          max={50}
                          step={5}
                        />
                      </div>

                      {/* Claims */}
                      <div className="space-y-3 p-4 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Gift className="w-4 h-4 text-primary" />
                          <Label>Claims Allowance</Label>
                        </div>
                        
                        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
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
                          <span className="text-sm font-medium">Unlimited Claims</span>
                        </div>
                        
                        {!selectedTier.unlimited_claims && (
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Per Month</Label>
                              <NumberInputWithButtons
                                value={selectedTier.claims_per_month}
                                onChange={(val) => handleTierChange('claims_per_month', Math.round(val))}
                                min={0}
                                max={10}
                                step={1}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Per Year</Label>
                              <NumberInputWithButtons
                                value={selectedTier.claims_per_year}
                                onChange={(val) => handleTierChange('claims_per_year', Math.round(val))}
                                min={0}
                                max={100}
                                step={1}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Perks Toggles */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-muted-foreground" />
                          <Label>Additional Perks</Label>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { key: 'priority_support', label: 'Priority Support', icon: Headphones },
                            { key: 'early_access', label: 'Early Access', icon: Clock },
                            { key: 'vip_events', label: 'VIP Events', icon: Star },
                            { key: 'concierge_service', label: 'Concierge Service', icon: Shield },
                            { key: 'free_shipping', label: 'Free Shipping', icon: Truck },
                          ].map(({ key, label, icon: Icon }) => (
                            <div 
                              key={key} 
                              className="flex items-center justify-between p-3 rounded-lg border bg-background"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm truncate">{label}</span>
                              </div>
                              <Switch
                                checked={selectedTier[key as keyof StatusTier] as boolean}
                                onCheckedChange={(checked) => handleTierChange(key as keyof StatusTier, checked)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Custom Benefits */}
                      <div className="space-y-3 p-4 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Gift className="w-4 h-4 text-muted-foreground" />
                            <Label>Custom Benefits</Label>
                          </div>
                          {selectedTier.custom_benefits?.length > 0 && (
                            <Badge variant="secondary">
                              {selectedTier.custom_benefits.length}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Input
                            value={newCustomBenefit}
                            onChange={(e) => setNewCustomBenefit(e.target.value)}
                            placeholder="Add a custom benefit..."
                            onKeyDown={(e) => e.key === 'Enter' && addCustomBenefit()}
                            className="flex-1 min-w-0"
                          />
                          <Button onClick={addCustomBenefit} size="icon" variant="outline" className="flex-shrink-0">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {selectedTier.custom_benefits?.length > 0 && (
                          <div className="space-y-2 mt-3">
                            {selectedTier.custom_benefits.map((benefit, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                <Check className="w-4 h-4 text-success flex-shrink-0" />
                                <span className="text-sm flex-1 min-w-0 truncate">{benefit}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 flex-shrink-0"
                                  onClick={() => removeCustomBenefit(index)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </div>

              {/* Preview Panel - Fixed width on lg+, hidden on smaller */}
              <div className="hidden lg:block w-[320px] flex-shrink-0 border-l bg-muted/10">
                <div className="sticky top-0 p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <h3 className="font-medium text-sm">Live Preview</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This is how users will see this tier
                  </p>
                  {selectedTier && (
                    <TierPreviewPanel
                      tiers={sortedTiers}
                      selectedTierId={selectedTier.id}
                      onSelectTier={() => {}}
                      editingTier={selectedTier}
                      hideHeader
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <DialogFooter className="px-6 py-4 border-t bg-background flex-shrink-0">
            <div className="flex items-center justify-between w-full gap-4">
              <div className="text-xs text-muted-foreground hidden sm:block">
                {hasChanges ? (
                  <span className="text-warning">• Unsaved changes</span>
                ) : (
                  <span>No changes</span>
                )}
              </div>
              <div className="flex gap-2 ml-auto">
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
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
