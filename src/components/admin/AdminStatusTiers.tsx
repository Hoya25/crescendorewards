import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  RefreshCw, 
  Trophy, 
  Zap,
  Gift,
  Tag,
  Headphones,
  Clock,
  Star,
  Truck,
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
import { useBenefitTypeSettings } from '@/hooks/useBenefitTypeSettings';
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
  BenefitTemplate,
  BenefitTypeManager
} from './tier-editor';
import { EditTierModal } from './EditTierModal';

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
  const { isActive: isBenefitActive } = useBenefitTypeSettings();
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
    
    if (isBenefitActive('claims_allowance')) {
      if (tier.unlimited_claims) {
        benefits.push('Unlimited reward claims');
      } else if (tier.claims_per_month > 0) {
        benefits.push(`${tier.claims_per_month} reward claim${tier.claims_per_month > 1 ? 's' : ''} per month`);
      } else if (tier.claims_per_year > 0) {
        benefits.push(`${tier.claims_per_year} reward claim${tier.claims_per_year > 1 ? 's' : ''} per year`);
      }
    }
    
    if (isBenefitActive('earning_multiplier') && tier.earning_multiplier > 1) {
      benefits.push(`Earn ${tier.earning_multiplier}x NCTR on all activities`);
    }
    
    if (isBenefitActive('discount_percent') && tier.discount_percent > 0) {
      benefits.push(`${tier.discount_percent}% discount on partner brands`);
    }
    
    if (isBenefitActive('priority_support') && tier.priority_support) benefits.push('Priority customer support');
    if (isBenefitActive('early_access') && tier.early_access) benefits.push('Early access to new rewards');
    if (isBenefitActive('vip_events') && tier.vip_events) benefits.push('VIP event invitations');
    if (isBenefitActive('concierge_service') && tier.concierge_service) benefits.push('Personal concierge service');
    if (isBenefitActive('free_shipping') && tier.free_shipping) benefits.push('Free expedited shipping');
    
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

  const saveTier = async (tierToSave: StatusTier) => {
    setSaving(true);
    try {
      const generatedBenefits = generateBenefitsArray(tierToSave);
      const original = originalTiers.find(t => t.id === tierToSave.id);
      
      const { error } = await supabase
        .from('status_tiers')
        .update({
          display_name: tierToSave.display_name,
          badge_emoji: tierToSave.badge_emoji,
          badge_color: tierToSave.badge_color,
          description: tierToSave.description,
          min_nctr_360_locked: tierToSave.min_nctr_360_locked,
          max_nctr_360_locked: tierToSave.max_nctr_360_locked,
          earning_multiplier: tierToSave.earning_multiplier,
          claims_per_month: tierToSave.claims_per_month,
          claims_per_year: tierToSave.claims_per_year,
          unlimited_claims: tierToSave.unlimited_claims,
          discount_percent: tierToSave.discount_percent,
          priority_support: tierToSave.priority_support,
          early_access: tierToSave.early_access,
          vip_events: tierToSave.vip_events,
          concierge_service: tierToSave.concierge_service,
          free_shipping: tierToSave.free_shipping,
          custom_benefits: tierToSave.custom_benefits,
          benefits: generatedBenefits,
          is_active: tierToSave.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', tierToSave.id);

      if (error) throw error;
      
      // Log the change
      if (original) {
        await logTierChange(tierToSave.id, original, tierToSave);
      }
      
      toast.success(`${tierToSave.display_name} tier updated successfully`);
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
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="tiers">Tier Configuration</TabsTrigger>
          <TabsTrigger value="benefits">Benefit Controls</TabsTrigger>
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

        <TabsContent value="benefits">
          <BenefitTypeManager />
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

      {/* Edit Tier Modal - Clean rebuilt component */}
      <EditTierModal
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        tier={selectedTier}
        onSave={saveTier}
        saving={saving}
      />
    </div>
  );
}
