import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Gift, Tag, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  sort_order: number;
}

interface TierPreviewPanelProps {
  tiers: StatusTier[];
  selectedTierId: string;
  onSelectTier: (tierId: string) => void;
  editingTier?: StatusTier | null;
  hideHeader?: boolean;
}

export function TierPreviewPanel({ 
  tiers, 
  selectedTierId, 
  onSelectTier,
  editingTier,
  hideHeader = false
}: TierPreviewPanelProps) {
  const { isActive } = useBenefitTypeSettings();
  
  // Use editing tier if it matches, otherwise find from list
  const displayTier = editingTier?.id === selectedTierId 
    ? editingTier 
    : tiers.find(t => t.id === selectedTierId) || tiers[0];

  if (!displayTier) return null;

  const generateBenefitsList = (tier: StatusTier): string[] => {
    const benefits: string[] = [];
    
    benefits.push(`Access to ${tier.display_name.toLowerCase()} reward catalog`);
    
    if (isActive('claims_allowance')) {
      if (tier.unlimited_claims) {
        benefits.push('Unlimited reward claims');
      } else if (tier.claims_per_month > 0) {
        benefits.push(`${tier.claims_per_month} reward claim${tier.claims_per_month > 1 ? 's' : ''} per month`);
      } else if (tier.claims_per_year > 0) {
        benefits.push(`${tier.claims_per_year} reward claim${tier.claims_per_year > 1 ? 's' : ''} per year`);
      }
    }
    
    if (isActive('earning_multiplier') && tier.earning_multiplier > 1) {
      benefits.push(`Earn ${tier.earning_multiplier}x NCTR on all activities`);
    }
    
    if (isActive('discount_percent') && tier.discount_percent > 0) {
      benefits.push(`${tier.discount_percent}% discount on partner brands`);
    }
    
    if (isActive('priority_support') && tier.priority_support) benefits.push('Priority customer support');
    if (isActive('early_access') && tier.early_access) benefits.push('Early access to new rewards');
    if (isActive('vip_events') && tier.vip_events) benefits.push('VIP event invitations');
    if (isActive('concierge_service') && tier.concierge_service) benefits.push('Personal concierge service');
    if (isActive('free_shipping') && tier.free_shipping) benefits.push('Free expedited shipping');
    
    if (tier.custom_benefits?.length > 0) {
      benefits.push(...tier.custom_benefits);
    }
    
    return benefits;
  };

  const sortedTiers = [...tiers].sort((a, b) => a.sort_order - b.sort_order);
  const currentIndex = sortedTiers.findIndex(t => t.id === displayTier.id);
  const prevTier = currentIndex > 0 ? sortedTiers[currentIndex - 1] : null;

  return (
    <Card className={hideHeader ? "border-0 shadow-none" : "sticky top-4"}>
      {!hideHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Preview as User</CardTitle>
            <Select value={selectedTierId} onValueChange={onSelectTier}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortedTiers.map(tier => (
                  <SelectItem key={tier.id} value={tier.id}>
                    <span className="flex items-center gap-2">
                      <span>{tier.badge_emoji}</span>
                      <span>{tier.display_name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {/* Tier Badge */}
        <div 
          className="p-4 rounded-lg text-center"
          style={{ 
            backgroundColor: `${displayTier.badge_color}15`,
            borderColor: displayTier.badge_color,
            borderWidth: 2
          }}
        >
          <span className="text-4xl block mb-2">{displayTier.badge_emoji}</span>
          <h3 className="font-bold text-xl" style={{ color: displayTier.badge_color }}>
            {displayTier.display_name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {displayTier.min_nctr_360_locked.toLocaleString()} - {displayTier.max_nctr_360_locked?.toLocaleString() || '∞'} NCTR
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-muted/50 rounded-lg">
            <Zap className="w-4 h-4 mx-auto mb-1 text-warning" />
            <span className="font-bold text-sm">{displayTier.earning_multiplier}x</span>
            <p className="text-xs text-muted-foreground">Multiplier</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <Gift className="w-4 h-4 mx-auto mb-1 text-primary" />
            <span className="font-bold text-sm">
              {displayTier.unlimited_claims 
                ? '∞' 
                : displayTier.claims_per_month > 0 
                  ? `${displayTier.claims_per_month}/mo` 
                  : `${displayTier.claims_per_year}/yr`}
            </span>
            <p className="text-xs text-muted-foreground">Claims</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <Tag className="w-4 h-4 mx-auto mb-1 text-success" />
            <span className="font-bold text-sm">{displayTier.discount_percent}%</span>
            <p className="text-xs text-muted-foreground">Discount</p>
          </div>
        </div>

        {/* Tier Progression Highlight */}
        {prevTier && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-xs font-medium text-primary mb-2">Upgrades from {prevTier.display_name}:</p>
            <div className="space-y-1 text-xs">
              {displayTier.earning_multiplier > prevTier.earning_multiplier && (
                <div className="flex items-center gap-1 text-success">
                  <ChevronRight className="w-3 h-3" />
                  +{(displayTier.earning_multiplier - prevTier.earning_multiplier).toFixed(2)}x multiplier
                </div>
              )}
              {displayTier.discount_percent > prevTier.discount_percent && (
                <div className="flex items-center gap-1 text-success">
                  <ChevronRight className="w-3 h-3" />
                  +{displayTier.discount_percent - prevTier.discount_percent}% discount
                </div>
              )}
              {displayTier.unlimited_claims && !prevTier.unlimited_claims && (
                <div className="flex items-center gap-1 text-success">
                  <ChevronRight className="w-3 h-3" />
                  Unlimited claims unlocked
                </div>
              )}
            </div>
          </div>
        )}

        {/* Benefits List */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Benefits</h4>
          <ul className="space-y-1.5">
            {generateBenefitsList(displayTier).map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
