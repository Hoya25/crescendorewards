import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Save, RefreshCw, Plus, X, Check, EyeOff } from 'lucide-react';
import { EmojiPicker } from './tier-editor';
import { useBenefitTypeSettings } from '@/hooks/useBenefitTypeSettings';

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

interface EditTierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: StatusTier | null;
  allTiers: StatusTier[];
  onSave: (tier: StatusTier) => Promise<void>;
  saving: boolean;
}

export function EditTierModal({ open, onOpenChange, tier, allTiers, onSave, saving }: EditTierModalProps) {
  const { isActive: isBenefitActive, loading: benefitSettingsLoading } = useBenefitTypeSettings();
  
  // Display fields
  const [displayName, setDisplayName] = useState('');
  const [badgeEmoji, setBadgeEmoji] = useState('');
  const [badgeColor, setBadgeColor] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Threshold fields
  const [minNctr, setMinNctr] = useState(0);
  const [maxNctr, setMaxNctr] = useState<number | null>(null);
  const [noMaximum, setNoMaximum] = useState(false);

  // Benefit fields
  const [multiplier, setMultiplier] = useState(1.0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [unlimitedClaims, setUnlimitedClaims] = useState(false);
  const [claimsPerMonth, setClaimsPerMonth] = useState(0);
  const [claimsPerYear, setClaimsPerYear] = useState(0);

  // Perks
  const [prioritySupport, setPrioritySupport] = useState(false);
  const [earlyAccess, setEarlyAccess] = useState(false);
  const [vipEvents, setVipEvents] = useState(false);
  const [conciergeService, setConciergeService] = useState(false);
  const [freeShipping, setFreeShipping] = useState(false);

  // Custom benefits
  const [customBenefits, setCustomBenefits] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState('');

  // Track changes
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize state when tier changes
  useEffect(() => {
    if (tier) {
      setDisplayName(tier.display_name);
      setBadgeEmoji(tier.badge_emoji);
      setBadgeColor(tier.badge_color);
      setDescription(tier.description || '');
      setIsActive(tier.is_active);
      setMinNctr(tier.min_nctr_360_locked);
      setMaxNctr(tier.max_nctr_360_locked);
      setNoMaximum(tier.max_nctr_360_locked === null);
      setMultiplier(tier.earning_multiplier || 1.0);
      setDiscountPercent(tier.discount_percent || 0);
      setUnlimitedClaims(tier.unlimited_claims || false);
      setClaimsPerMonth(tier.claims_per_month || 0);
      setClaimsPerYear(tier.claims_per_year || 0);
      setPrioritySupport(tier.priority_support || false);
      setEarlyAccess(tier.early_access || false);
      setVipEvents(tier.vip_events || false);
      setConciergeService(tier.concierge_service || false);
      setFreeShipping(tier.free_shipping || false);
      setCustomBenefits(tier.custom_benefits || []);
      setHasChanges(false);
    }
  }, [tier]);

  // Mark changes when any field updates
  useEffect(() => {
    if (tier) {
      const changed =
        displayName !== tier.display_name ||
        badgeEmoji !== tier.badge_emoji ||
        badgeColor !== tier.badge_color ||
        description !== (tier.description || '') ||
        isActive !== tier.is_active ||
        minNctr !== tier.min_nctr_360_locked ||
        maxNctr !== tier.max_nctr_360_locked ||
        multiplier !== (tier.earning_multiplier || 1.0) ||
        discountPercent !== (tier.discount_percent || 0) ||
        unlimitedClaims !== (tier.unlimited_claims || false) ||
        claimsPerMonth !== (tier.claims_per_month || 0) ||
        claimsPerYear !== (tier.claims_per_year || 0) ||
        prioritySupport !== (tier.priority_support || false) ||
        earlyAccess !== (tier.early_access || false) ||
        vipEvents !== (tier.vip_events || false) ||
        conciergeService !== (tier.concierge_service || false) ||
        freeShipping !== (tier.free_shipping || false) ||
        JSON.stringify(customBenefits) !== JSON.stringify(tier.custom_benefits || []);
      setHasChanges(changed);
    }
  }, [
    tier, displayName, badgeEmoji, badgeColor, description, isActive,
    minNctr, maxNctr, multiplier, discountPercent, unlimitedClaims,
    claimsPerMonth, claimsPerYear, prioritySupport, earlyAccess,
    vipEvents, conciergeService, freeShipping, customBenefits
  ]);

  // Validation: check if current tier config would create overlaps
  const getValidationErrors = (): string[] => {
    if (!tier) return [];
    const errors: string[] = [];
    
    // Check min < max for this tier
    if (!noMaximum && maxNctr !== null && minNctr >= maxNctr) {
      errors.push('Minimum NCTR must be less than maximum NCTR');
    }
    
    // Check for overlaps with other tiers
    const otherTiers = allTiers.filter(t => t.id !== tier.id);
    for (const other of otherTiers) {
      // Check if this tier's range overlaps with another tier
      const thisMax = noMaximum ? Infinity : (maxNctr ?? Infinity);
      const otherMax = other.max_nctr_360_locked ?? Infinity;
      
      // Overlap exists if: thisMin <= otherMax AND thisMax >= otherMin
      if (minNctr <= otherMax && thisMax >= other.min_nctr_360_locked) {
        // Check if they actually overlap (not just adjacent)
        if (minNctr < otherMax && thisMax > other.min_nctr_360_locked) {
          errors.push(`Range overlaps with ${other.display_name} (${other.min_nctr_360_locked.toLocaleString()} - ${other.max_nctr_360_locked?.toLocaleString() ?? '∞'})`);
        }
      }
    }
    
    return errors;
  };

  const validationErrors = getValidationErrors();
  const canSave = hasChanges && validationErrors.length === 0;

  const handleSave = async () => {
    if (!tier || validationErrors.length > 0) return;

    const updatedTier: StatusTier = {
      ...tier,
      display_name: displayName,
      badge_emoji: badgeEmoji,
      badge_color: badgeColor,
      description: description || null,
      is_active: isActive,
      min_nctr_360_locked: minNctr,
      max_nctr_360_locked: noMaximum ? null : maxNctr,
      earning_multiplier: multiplier,
      discount_percent: discountPercent,
      unlimited_claims: unlimitedClaims,
      claims_per_month: unlimitedClaims ? 0 : claimsPerMonth,
      claims_per_year: unlimitedClaims ? 0 : claimsPerYear,
      priority_support: prioritySupport,
      early_access: earlyAccess,
      vip_events: vipEvents,
      concierge_service: conciergeService,
      free_shipping: freeShipping,
      custom_benefits: customBenefits,
    };

    await onSave(updatedTier);
  };

  const addCustomBenefit = () => {
    if (newBenefit.trim()) {
      setCustomBenefits([...customBenefits, newBenefit.trim()]);
      setNewBenefit('');
    }
  };

  const removeCustomBenefit = (index: number) => {
    setCustomBenefits(customBenefits.filter((_, i) => i !== index));
  };

  if (!tier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[85vh] p-0 gap-0 overflow-hidden">
        {/* HEADER - Fixed */}
        <div className="px-6 py-4 border-b bg-background">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <span className="text-3xl">{badgeEmoji}</span>
            Edit {tier.display_name} Tier
          </DialogTitle>
          <DialogDescription className="mt-1">
            Update tier settings, thresholds, and benefits
          </DialogDescription>
        </div>

        {/* SCROLLABLE CONTENT - Single column */}
        <div className="overflow-y-auto px-6 py-6 space-y-8 max-h-[calc(85vh-140px)]">
          
          {/* SECTION 1: DISPLAY SETTINGS */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Display Settings</h3>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., Bronze"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Badge Emoji</Label>
                <EmojiPicker
                  value={badgeEmoji}
                  onChange={setBadgeEmoji}
                />
              </div>
              <div className="space-y-2">
                <Label>Badge Color</Label>
                <div className="flex gap-2">
                  <div
                    className="w-12 h-10 rounded border flex-shrink-0"
                    style={{ backgroundColor: badgeColor }}
                  />
                  <Input
                    type="color"
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value)}
                    className="w-14 h-10 p-1 cursor-pointer flex-shrink-0"
                  />
                  <Input
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value)}
                    placeholder="#F59E0B"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this tier..."
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive tiers are hidden from users
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </section>

          {/* SECTION 2: THRESHOLDS */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">NCTR Thresholds</h3>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="minNctr">Minimum NCTR Locked</Label>
                <Input
                  id="minNctr"
                  type="number"
                  value={minNctr}
                  onChange={(e) => setMinNctr(Number(e.target.value))}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxNctr">Maximum NCTR Locked</Label>
                <Input
                  id="maxNctr"
                  type="number"
                  value={maxNctr ?? ''}
                  onChange={(e) => setMaxNctr(e.target.value ? Number(e.target.value) : null)}
                  placeholder="No limit"
                  disabled={noMaximum}
                />
                <div className="flex items-center gap-2 mt-1">
                  <Checkbox
                    id="noMax"
                    checked={noMaximum}
                    onCheckedChange={(checked) => {
                      setNoMaximum(!!checked);
                      if (checked) setMaxNctr(null);
                    }}
                  />
                  <Label htmlFor="noMax" className="text-sm font-normal">
                    No maximum (top tier)
                  </Label>
                </div>
              </div>
            </div>

            {/* Validation warning */}
            {!noMaximum && maxNctr !== null && minNctr >= maxNctr && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                ⚠️ Minimum must be less than maximum
              </div>
            )}
          </section>

          {/* SECTION 3: BENEFITS */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Tier Benefits</h3>

            {/* Earning Multiplier */}
            <div className={`space-y-2 ${!isBenefitActive('earning_multiplier') ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-2">
                <Label>Earning Multiplier</Label>
                {!isBenefitActive('earning_multiplier') && (
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <EyeOff className="w-3 h-3" /> Disabled
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Members earn this multiple of NCTR on activities
              </p>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  step={0.05}
                  min={1}
                  max={3}
                  value={multiplier}
                  onChange={(e) => setMultiplier(Number(e.target.value))}
                  className="w-24"
                  disabled={!isBenefitActive('earning_multiplier')}
                />
                <span className="text-xl font-bold">×</span>
              </div>
            </div>

            {/* Discount */}
            <div className={`space-y-2 ${!isBenefitActive('discount_percent') ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-2">
                <Label>Partner Discount</Label>
                {!isBenefitActive('discount_percent') && (
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <EyeOff className="w-3 h-3" /> Disabled
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Discount on partner brand purchases
              </p>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-24"
                  disabled={!isBenefitActive('discount_percent')}
                />
                <span className="text-xl font-bold">%</span>
              </div>
            </div>

            {/* Claims */}
            <div className={`space-y-3 ${!isBenefitActive('claims_allowance') ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-2">
                <Label>Claims Allowance</Label>
                {!isBenefitActive('claims_allowance') && (
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <EyeOff className="w-3 h-3" /> Disabled
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                How many rewards can members claim?
              </p>

              <div className="flex items-center gap-4">
                <Checkbox
                  id="unlimited"
                  checked={unlimitedClaims}
                  onCheckedChange={(checked) => setUnlimitedClaims(!!checked)}
                  disabled={!isBenefitActive('claims_allowance')}
                />
                <Label htmlFor="unlimited" className="font-normal">
                  Unlimited claims
                </Label>
              </div>

              {!unlimitedClaims && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-1">
                    <Label className="text-sm">Per Month</Label>
                    <Input
                      type="number"
                      min={0}
                      value={claimsPerMonth}
                      onChange={(e) => setClaimsPerMonth(Number(e.target.value))}
                      disabled={!isBenefitActive('claims_allowance')}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">Per Year</Label>
                    <Input
                      type="number"
                      min={0}
                      value={claimsPerYear}
                      onChange={(e) => setClaimsPerYear(Number(e.target.value))}
                      disabled={!isBenefitActive('claims_allowance')}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Perks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Additional Perks</Label>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <EyeOff className="w-3 h-3" /> = Globally disabled
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div className={`flex items-center gap-2 ${!isBenefitActive('priority_support') ? 'opacity-50' : ''}`}>
                  <Checkbox
                    id="support"
                    checked={prioritySupport}
                    onCheckedChange={(checked) => setPrioritySupport(!!checked)}
                    disabled={!isBenefitActive('priority_support')}
                  />
                  <Label htmlFor="support" className="font-normal flex items-center gap-1">
                    Priority Support
                    {!isBenefitActive('priority_support') && <EyeOff className="w-3 h-3 text-muted-foreground" />}
                  </Label>
                </div>
                <div className={`flex items-center gap-2 ${!isBenefitActive('early_access') ? 'opacity-50' : ''}`}>
                  <Checkbox
                    id="early"
                    checked={earlyAccess}
                    onCheckedChange={(checked) => setEarlyAccess(!!checked)}
                    disabled={!isBenefitActive('early_access')}
                  />
                  <Label htmlFor="early" className="font-normal flex items-center gap-1">
                    Early Access
                    {!isBenefitActive('early_access') && <EyeOff className="w-3 h-3 text-muted-foreground" />}
                  </Label>
                </div>
                <div className={`flex items-center gap-2 ${!isBenefitActive('vip_events') ? 'opacity-50' : ''}`}>
                  <Checkbox
                    id="vip"
                    checked={vipEvents}
                    onCheckedChange={(checked) => setVipEvents(!!checked)}
                    disabled={!isBenefitActive('vip_events')}
                  />
                  <Label htmlFor="vip" className="font-normal flex items-center gap-1">
                    VIP Events
                    {!isBenefitActive('vip_events') && <EyeOff className="w-3 h-3 text-muted-foreground" />}
                  </Label>
                </div>
                <div className={`flex items-center gap-2 ${!isBenefitActive('concierge_service') ? 'opacity-50' : ''}`}>
                  <Checkbox
                    id="concierge"
                    checked={conciergeService}
                    onCheckedChange={(checked) => setConciergeService(!!checked)}
                    disabled={!isBenefitActive('concierge_service')}
                  />
                  <Label htmlFor="concierge" className="font-normal flex items-center gap-1">
                    Concierge Service
                    {!isBenefitActive('concierge_service') && <EyeOff className="w-3 h-3 text-muted-foreground" />}
                  </Label>
                </div>
                <div className={`flex items-center gap-2 ${!isBenefitActive('free_shipping') ? 'opacity-50' : ''}`}>
                  <Checkbox
                    id="shipping"
                    checked={freeShipping}
                    onCheckedChange={(checked) => setFreeShipping(!!checked)}
                    disabled={!isBenefitActive('free_shipping')}
                  />
                  <Label htmlFor="shipping" className="font-normal flex items-center gap-1">
                    Free Shipping
                    {!isBenefitActive('free_shipping') && <EyeOff className="w-3 h-3 text-muted-foreground" />}
                  </Label>
                </div>
              </div>
            </div>

            {/* Custom Benefits */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Custom Benefits</Label>
                {customBenefits.length > 0 && (
                  <Badge variant="secondary">{customBenefits.length}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Additional benefits shown to users
              </p>
              <div className="flex gap-2">
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="Add a custom benefit..."
                  onKeyDown={(e) => e.key === 'Enter' && addCustomBenefit()}
                  className="flex-1"
                />
                <Button onClick={addCustomBenefit} size="icon" variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {customBenefits.length > 0 && (
                <div className="space-y-2 mt-2">
                  {customBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm flex-1 truncate">{benefit}</span>
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
          </section>

          {/* SECTION 4: PREVIEW */}
          <section className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Preview</h3>
            <p className="text-sm text-muted-foreground">
              This is how users will see this tier
            </p>

            <div className="border rounded-lg p-6 bg-muted/30">
              {/* Tier card preview */}
              <div
                className="rounded-lg p-6 text-center max-w-xs mx-auto border-2"
                style={{
                  backgroundColor: badgeColor + '20',
                  borderColor: badgeColor,
                }}
              >
                <div className="text-4xl mb-2">{badgeEmoji}</div>
                <div className="text-xl font-bold" style={{ color: badgeColor }}>
                  {displayName}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {minNctr.toLocaleString()} - {noMaximum || maxNctr === null ? '∞' : maxNctr.toLocaleString()} NCTR
                </div>
              </div>

              {/* Benefits summary */}
              <div className="flex justify-center gap-6 mt-4">
                <div className="text-center">
                  <div className="text-lg font-bold">{multiplier}x</div>
                  <div className="text-xs text-muted-foreground">Multiplier</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {unlimitedClaims ? '∞' : `${claimsPerYear}/yr`}
                  </div>
                  <div className="text-xs text-muted-foreground">Claims</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{discountPercent}%</div>
                  <div className="text-xs text-muted-foreground">Discount</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* FOOTER - Fixed */}
        <div className="px-6 py-4 border-t bg-background space-y-3">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <strong className="block mb-1">Cannot save:</strong>
              <ul className="list-disc list-inside">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-warning">
              {hasChanges && validationErrors.length === 0 ? '• Unsaved changes' : ''}
            </span>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!canSave || saving}>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
