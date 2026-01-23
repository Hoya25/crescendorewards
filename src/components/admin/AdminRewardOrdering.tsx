import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  GripVertical, ArrowUp, ArrowDown, Pencil, Search, Eye, EyeOff, 
  Check, X, Save, RotateCcw, ChevronUp, ChevronDown, Filter, 
  Unlock, DollarSign, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Reward {
  id: string;
  title: string;
  description: string;
  category: string;
  cost: number;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  min_status_tier: string | null;
  status_tier_claims_cost: Record<string, number> | null;
  display_order: number;
}

type StatusTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

const TIER_ORDER: StatusTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

const TIER_CONFIG: Record<StatusTier | 'none', { emoji: string; label: string; description: string; color: string }> = {
  none: { emoji: '🔓', label: 'All Users', description: 'Available to everyone', color: 'bg-success/10 text-success border-success/20' },
  bronze: { emoji: '🥉', label: 'Bronze+', description: 'Bronze, Silver, Gold, Platinum, Diamond', color: 'bg-[hsl(var(--bronze))]/10 text-[hsl(var(--bronze))] border-[hsl(var(--bronze))]/20' },
  silver: { emoji: '🥈', label: 'Silver+', description: 'Silver, Gold, Platinum, Diamond', color: 'bg-muted text-muted-foreground border-border' },
  gold: { emoji: '🥇', label: 'Gold+', description: 'Gold, Platinum, Diamond', color: 'bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))] border-[hsl(var(--gold))]/20' },
  platinum: { emoji: '💎', label: 'Platinum+', description: 'Platinum, Diamond', color: 'bg-accent text-accent-foreground border-accent' },
  diamond: { emoji: '👑', label: 'Diamond', description: 'Diamond only', color: 'bg-primary/10 text-primary border-primary/20' },
};

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'App', label: 'App' },
  { value: 'Subscription', label: 'Subscription' },
  { value: 'NCTR Ecosystem', label: 'NCTR Ecosystem' },
  { value: 'Experience', label: 'Experience' },
  { value: 'Education', label: 'Education' },
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Gaming', label: 'Gaming' },
  { value: 'Food & Beverage', label: 'Food & Beverage' },
  { value: 'Fashion', label: 'Fashion' },
  { value: 'Other', label: 'Other' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Rewards' },
  { value: 'unrestricted', label: 'Unrestricted Only' },
  { value: 'bronze', label: 'Bronze+ Only' },
  { value: 'silver', label: 'Silver+ Only' },
  { value: 'gold', label: 'Gold+ Only' },
  { value: 'platinum', label: 'Platinum+ Only' },
  { value: 'diamond', label: 'Diamond Exclusive' },
  { value: 'tiered-pricing', label: 'Has Tier-Based Pricing' },
];

const ACTIVE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active Only' },
  { value: 'inactive', label: 'Inactive Only' },
];

function hasTierPricing(reward: Reward): boolean {
  if (!reward.status_tier_claims_cost) return false;
  const costs = reward.status_tier_claims_cost;
  const values = Object.values(costs).filter(v => typeof v === 'number');
  if (values.length === 0) return false;
  // Check if any tier has different pricing from base
  return values.some(v => v !== reward.cost && v !== null);
}

function getTierPricingTooltip(reward: Reward): string {
  if (!reward.status_tier_claims_cost) return '';
  const lines = Object.entries(reward.status_tier_claims_cost)
    .filter(([_, cost]) => typeof cost === 'number')
    .map(([tier, cost]) => {
      const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
      return cost === 0 ? `${tierLabel}: FREE` : `${tierLabel}: ${cost} Claims`;
    });
  return lines.length > 0 ? lines.join('\n') : '';
}

function canTierAccessReward(tierName: StatusTier, minTier: string | null): boolean {
  if (!minTier) return true;
  const minTierIndex = TIER_ORDER.indexOf(minTier as StatusTier);
  const userTierIndex = TIER_ORDER.indexOf(tierName);
  if (minTierIndex === -1) return true;
  return userTierIndex >= minTierIndex;
}

export function AdminRewardOrdering() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [originalRewards, setOriginalRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [previewMode, setPreviewMode] = useState(false);
  const [previewTier, setPreviewTier] = useState<StatusTier>('bronze');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('id, title, description, category, cost, image_url, is_active, is_featured, min_status_tier, status_tier_claims_cost, display_order')
        .order('display_order', { ascending: true });

      if (error) throw error;

      const rewardsData = (data || []).map((r, idx) => ({
        ...r,
        status_tier_claims_cost: r.status_tier_claims_cost as Record<string, number> | null,
        display_order: r.display_order ?? idx + 1,
      }));

      setRewards(rewardsData);
      setOriginalRewards(JSON.parse(JSON.stringify(rewardsData)));
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const hasChanges = useMemo(() => {
    if (rewards.length !== originalRewards.length) return true;
    return rewards.some((reward, index) => {
      const original = originalRewards.find(r => r.id === reward.id);
      return !original || reward.display_order !== original.display_order || reward.is_active !== original.is_active;
    });
  }, [rewards, originalRewards]);

  const filteredRewards = useMemo(() => {
    let filtered = [...rewards];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => r.title.toLowerCase().includes(query));
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(r => r.category === categoryFilter);
    }

    // Status tier filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'unrestricted') {
        filtered = filtered.filter(r => !r.min_status_tier);
      } else if (statusFilter === 'tiered-pricing') {
        filtered = filtered.filter(r => hasTierPricing(r));
      } else {
        filtered = filtered.filter(r => r.min_status_tier === statusFilter);
      }
    }

    // Active filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(r => activeFilter === 'active' ? r.is_active : !r.is_active);
    }

    // Preview mode: filter by tier access
    if (previewMode) {
      filtered = filtered.filter(r => r.is_active && canTierAccessReward(previewTier, r.min_status_tier));
    }

    return filtered.sort((a, b) => a.display_order - b.display_order);
  }, [rewards, searchQuery, categoryFilter, statusFilter, activeFilter, previewMode, previewTier]);

  const moveReward = useCallback((id: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    setRewards(prev => {
      const sorted = [...prev].sort((a, b) => a.display_order - b.display_order);
      const idx = sorted.findIndex(r => r.id === id);
      if (idx === -1) return prev;

      let newIdx = idx;
      if (direction === 'up' && idx > 0) newIdx = idx - 1;
      else if (direction === 'down' && idx < sorted.length - 1) newIdx = idx + 1;
      else if (direction === 'top') newIdx = 0;
      else if (direction === 'bottom') newIdx = sorted.length - 1;

      if (newIdx === idx) return prev;

      const [item] = sorted.splice(idx, 1);
      sorted.splice(newIdx, 0, item);

      return sorted.map((r, i) => ({ ...r, display_order: i + 1 }));
    });
  }, []);

  const moveSelectedToPosition = useCallback((position: 'top' | 'bottom') => {
    if (selectedIds.size === 0) return;

    setRewards(prev => {
      const sorted = [...prev].sort((a, b) => a.display_order - b.display_order);
      const selected = sorted.filter(r => selectedIds.has(r.id));
      const unselected = sorted.filter(r => !selectedIds.has(r.id));

      const reordered = position === 'top' 
        ? [...selected, ...unselected] 
        : [...unselected, ...selected];

      return reordered.map((r, i) => ({ ...r, display_order: i + 1 }));
    });
    setSelectedIds(new Set());
  }, [selectedIds]);

  const toggleActive = useCallback((id: string) => {
    setRewards(prev => prev.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = filteredRewards.map(r => r.id);
    setSelectedIds(prev => prev.size === allIds.length ? new Set() : new Set(allIds));
  }, [filteredRewards]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    setRewards(prev => {
      const sorted = [...prev].sort((a, b) => a.display_order - b.display_order);
      const draggedIdx = sorted.findIndex(r => r.id === draggedId);
      const targetIdx = sorted.findIndex(r => r.id === targetId);

      if (draggedIdx === -1 || targetIdx === -1) return prev;

      const [dragged] = sorted.splice(draggedIdx, 1);
      sorted.splice(targetIdx, 0, dragged);

      return sorted.map((r, i) => ({ ...r, display_order: i + 1 }));
    });

    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const updates = rewards.filter(r => {
        const original = originalRewards.find(o => o.id === r.id);
        return !original || r.display_order !== original.display_order || r.is_active !== original.is_active;
      });

      for (const reward of updates) {
        const { error } = await supabase
          .from('rewards')
          .update({ 
            display_order: reward.display_order,
            is_active: reward.is_active 
          })
          .eq('id', reward.id);

        if (error) throw error;
      }

      setOriginalRewards(JSON.parse(JSON.stringify(rewards)));
      toast.success(`Saved order for ${updates.length} reward${updates.length !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = () => {
    setRewards(JSON.parse(JSON.stringify(originalRewards)));
    setSelectedIds(new Set());
    setDiscardDialogOpen(false);
    toast.info('Changes discarded');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Reward Display Order</h2>
            <p className="text-muted-foreground text-sm">Drag and drop to reorder how rewards appear in the marketplace</p>
          </div>

          {hasChanges && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                <AlertCircle className="w-3 h-3 mr-1" />
                Unsaved Changes
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setDiscardDialogOpen(true)}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Discard
              </Button>
              <Button size="sm" onClick={saveChanges} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* Filters & Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search rewards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Access Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-52">
                  <SelectValue placeholder="Status Access" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTER_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Active Filter */}
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="w-full lg:w-40">
                  <SelectValue placeholder="Active Status" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVE_FILTER_OPTIONS.map(a => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview Toggle & Bulk Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={previewMode} 
                    onCheckedChange={setPreviewMode}
                    id="preview-mode"
                  />
                  <label htmlFor="preview-mode" className="text-sm font-medium cursor-pointer">
                    Preview Mode
                  </label>
                </div>

                {previewMode && (
                  <Select value={previewTier} onValueChange={(v) => setPreviewTier(v as StatusTier)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIER_ORDER.map(tier => (
                        <SelectItem key={tier} value={tier}>
                          {TIER_CONFIG[tier].emoji} Preview as {tier.charAt(0).toUpperCase() + tier.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Bulk Actions */}
              {!previewMode && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    {selectedIds.size === filteredRewards.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  {selectedIds.size > 0 && (
                    <>
                      <Badge variant="secondary">{selectedIds.size} selected</Badge>
                      <Button variant="outline" size="sm" onClick={() => moveSelectedToPosition('top')}>
                        <ChevronUp className="w-4 h-4 mr-1" />
                        Move to Top
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => moveSelectedToPosition('bottom')}>
                        <ChevronDown className="w-4 h-4 mr-1" />
                        Move to Bottom
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rewards List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>
                {previewMode 
                  ? `Preview: ${TIER_CONFIG[previewTier].emoji} ${previewTier.charAt(0).toUpperCase() + previewTier.slice(1)} View (${filteredRewards.length} rewards)` 
                  : `${filteredRewards.length} Reward${filteredRewards.length !== 1 ? 's' : ''}`}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="p-4 space-y-2">
                {filteredRewards.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No rewards match your filters</p>
                  </div>
                ) : (
                  filteredRewards.map((reward, index) => (
                    <RewardOrderCard
                      key={reward.id}
                      reward={reward}
                      position={index + 1}
                      isSelected={selectedIds.has(reward.id)}
                      isDragging={draggedId === reward.id}
                      isDragOver={dragOverId === reward.id}
                      previewMode={previewMode}
                      previewTier={previewTier}
                      onToggleSelect={() => toggleSelect(reward.id)}
                      onToggleActive={() => toggleActive(reward.id)}
                      onMoveUp={() => moveReward(reward.id, 'up')}
                      onMoveDown={() => moveReward(reward.id, 'down')}
                      onMoveTop={() => moveReward(reward.id, 'top')}
                      onMoveBottom={() => moveReward(reward.id, 'bottom')}
                      onDragStart={(e) => handleDragStart(e, reward.id)}
                      onDragOver={(e) => handleDragOver(e, reward.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, reward.id)}
                      onDragEnd={handleDragEnd}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Discard Dialog */}
        <Dialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Discard Changes?</DialogTitle>
              <DialogDescription>
                You have unsaved changes. Are you sure you want to discard them? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDiscardDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={discardChanges}>
                Discard Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

interface RewardOrderCardProps {
  reward: Reward;
  position: number;
  isSelected: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  previewMode: boolean;
  previewTier: StatusTier;
  onToggleSelect: () => void;
  onToggleActive: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveTop: () => void;
  onMoveBottom: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

function RewardOrderCard({
  reward,
  position,
  isSelected,
  isDragging,
  isDragOver,
  previewMode,
  previewTier,
  onToggleSelect,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  onMoveTop,
  onMoveBottom,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: RewardOrderCardProps) {
  const tierConfig = reward.min_status_tier 
    ? TIER_CONFIG[reward.min_status_tier as StatusTier] 
    : TIER_CONFIG.none;
  const hasPricing = hasTierPricing(reward);
  const pricingTooltip = hasPricing ? getTierPricingTooltip(reward) : '';

  // Get user-specific price in preview mode
  const displayPrice = useMemo(() => {
    if (previewMode && reward.status_tier_claims_cost) {
      const tierPrice = reward.status_tier_claims_cost[previewTier];
      if (typeof tierPrice === 'number') {
        return tierPrice === 0 ? 'FREE' : `${tierPrice} Claims`;
      }
    }
    return reward.cost === 0 ? 'FREE' : `${reward.cost} Claims`;
  }, [previewMode, previewTier, reward]);

  return (
    <div
      draggable={!previewMode}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
        "bg-card hover:bg-accent/5",
        isDragging && "opacity-50 scale-[0.98] shadow-lg",
        isDragOver && "border-primary border-2 bg-primary/5",
        isSelected && "border-primary bg-primary/5",
        !reward.is_active && "opacity-60"
      )}
    >
      {/* Drag Handle & Checkbox */}
      {!previewMode && (
        <div className="flex items-center gap-2">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={onToggleSelect}
          />
          <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Position Number */}
      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-sm font-medium">
        {position}
      </div>

      {/* Image */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {reward.image_url ? (
          <img 
            src={reward.image_url} 
            alt={reward.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No img
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{reward.title}</span>
          {reward.is_featured && (
            <Badge variant="secondary" className="text-xs">Featured</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-sm">
          <Badge variant="outline" className="text-xs">{reward.category}</Badge>
          <span className="text-muted-foreground">{displayPrice}</span>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-2">
        {/* Tier Access Badge */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={cn("text-xs cursor-help", tierConfig.color)}>
              <span className="mr-1">{tierConfig.emoji}</span>
              {tierConfig.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tierConfig.description}</p>
          </TooltipContent>
        </Tooltip>

        {/* Tier Pricing Badge */}
        {hasPricing && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-xs cursor-help bg-secondary text-secondary-foreground border-border">
                <DollarSign className="w-3 h-3 mr-1" />
                Tiered
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="whitespace-pre-line">{pricingTooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Actions */}
      {!previewMode && (
        <div className="flex items-center gap-1">
          {/* Quick Move */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMoveTop}>
                <ChevronUp className="w-4 h-4" />
                <ChevronUp className="w-4 h-4 -ml-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to Top</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMoveUp}>
                <ArrowUp className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move Up</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMoveDown}>
                <ArrowDown className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move Down</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMoveBottom}>
                <ChevronDown className="w-4 h-4" />
                <ChevronDown className="w-4 h-4 -ml-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to Bottom</TooltipContent>
          </Tooltip>

          {/* Active Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={onToggleActive}
              >
                {reward.is_active ? (
                  <Eye className="w-4 h-4 text-success" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{reward.is_active ? 'Active' : 'Inactive'}</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
