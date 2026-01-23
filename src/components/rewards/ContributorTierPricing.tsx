import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { 
  generateDefaultTierPricing, 
  validateTierPricing,
  type TierPricing 
} from '@/utils/tierPricingValidation';

interface ContributorTierPricingProps {
  baseCost: number;
  enabled: boolean;
  pricing: TierPricing | null;
  onEnabledChange: (enabled: boolean) => void;
  onPricingChange: (pricing: TierPricing) => void;
}

const TIER_INFO = [
  { key: 'bronze', name: 'Bronze', icon: '🥉' },
  { key: 'silver', name: 'Silver', icon: '🥈' },
  { key: 'gold', name: 'Gold', icon: '🥇' },
  { key: 'platinum', name: 'Platinum', icon: '💎' },
  { key: 'diamond', name: 'Diamond', icon: '👑' },
] as const;

const DISCOUNT_PATTERNS = [
  { 
    id: 'none', 
    label: 'No Discounts', 
    description: 'Same price for all tiers',
    discounts: [0, 0, 0, 0, 0],
  },
  { 
    id: 'gentle', 
    label: 'Gentle Rewards', 
    description: 'Small discounts for loyalty',
    discounts: [0, 10, 20, 30, 40],
  },
  { 
    id: 'linear', 
    label: 'Linear Progression', 
    description: 'Steady increase in benefits',
    discounts: [0, 20, 40, 60, 80],
  },
  { 
    id: 'steep', 
    label: 'VIP Focused', 
    description: 'Big rewards for top tiers',
    discounts: [0, 25, 50, 75, 100],
  },
];

export function ContributorTierPricing({
  baseCost,
  enabled,
  pricing,
  onEnabledChange,
  onPricingChange,
}: ContributorTierPricingProps) {
  const [selectedPattern, setSelectedPattern] = useState<string>('linear');
  const [showDetails, setShowDetails] = useState(false);

  // Apply pattern when it changes or baseCost changes
  useEffect(() => {
    if (enabled && baseCost > 0) {
      const pattern = DISCOUNT_PATTERNS.find(p => p.id === selectedPattern);
      if (pattern) {
        const discounts = pattern.discounts;
        const newPricing: TierPricing = {
          bronze: Math.round(baseCost * (1 - discounts[0] / 100)),
          silver: Math.round(baseCost * (1 - discounts[1] / 100)),
          gold: Math.round(baseCost * (1 - discounts[2] / 100)),
          platinum: Math.round(baseCost * (1 - discounts[3] / 100)),
          diamond: Math.round(baseCost * (1 - discounts[4] / 100)),
        };
        onPricingChange(newPricing);
      }
    }
  }, [selectedPattern, baseCost, enabled]);

  // Initialize with linear pattern when enabled
  useEffect(() => {
    if (enabled && !pricing && baseCost > 0) {
      onPricingChange(generateDefaultTierPricing(baseCost, 'linear'));
    }
  }, [enabled, baseCost]);

  const handlePatternSelect = (patternId: string) => {
    setSelectedPattern(patternId);
  };

  const validation = pricing ? validateTierPricing(pricing, baseCost) : null;

  return (
    <div className="space-y-4">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <div>
            <Label htmlFor="tier-pricing-toggle" className="text-base font-medium cursor-pointer">
              Enable Tier-Based Pricing
            </Label>
            <p className="text-sm text-muted-foreground">
              Offer different prices based on member status level
            </p>
          </div>
        </div>
        <Switch
          id="tier-pricing-toggle"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>

      {enabled && baseCost > 0 && (
        <Card className="border-primary/20">
          <CardContent className="pt-4 space-y-4">
            {/* Pattern Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Choose a Discount Pattern</Label>
              <div className="grid grid-cols-2 gap-2">
                {DISCOUNT_PATTERNS.map((pattern) => (
                  <Button
                    key={pattern.id}
                    type="button"
                    variant={selectedPattern === pattern.id ? 'default' : 'outline'}
                    className={cn(
                      "h-auto py-3 px-4 flex flex-col items-start text-left",
                      selectedPattern === pattern.id && "ring-2 ring-primary"
                    )}
                    onClick={() => handlePatternSelect(pattern.id)}
                  >
                    <span className="font-medium text-sm">{pattern.label}</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {pattern.description}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Price Preview */}
            {pricing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Price Preview</Label>
                  <Badge variant="outline" className="text-xs">
                    Base: {baseCost} Claims
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TIER_INFO.map((tier) => {
                    const tierPrice = pricing[tier.key as keyof TierPricing];
                    const isFree = tierPrice === 0;
                    const discount = baseCost > 0 
                      ? Math.round((1 - tierPrice / baseCost) * 100) 
                      : 0;
                    
                    return (
                      <div 
                        key={tier.key}
                        className="flex-1 min-w-[80px] text-center p-3 rounded-lg border bg-card"
                      >
                        <div className="text-lg">{tier.icon}</div>
                        <div className="text-xs text-muted-foreground mb-1">{tier.name}</div>
                        <div className={cn(
                          'font-bold text-sm',
                          isFree && 'text-green-600'
                        )}>
                          {isFree ? 'FREE' : `${tierPrice}`}
                        </div>
                        {discount > 0 && !isFree && (
                          <Badge variant="secondary" className="text-[10px] mt-1">
                            {discount}% off
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Collapsible Details */}
            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
              <CollapsibleTrigger asChild>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  <Info className="w-4 h-4 mr-2" />
                  {showDetails ? 'Hide' : 'Learn more about tier pricing'}
                  {showDetails ? (
                    <ChevronUp className="w-4 h-4 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-2" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground space-y-2">
                  <p>
                    <strong>How it works:</strong> Members with higher Crescendo Status levels 
                    (Bronze → Diamond) can claim your reward for fewer Claims.
                  </p>
                  <p>
                    <strong>Note:</strong> Admins may adjust pricing during review to optimize 
                    for the marketplace. You can request specific pricing in your description.
                  </p>
                  <div className="flex items-start gap-2 mt-2 p-2 rounded bg-primary/5 border border-primary/20">
                    <span className="text-primary">💡</span>
                    <p className="text-xs">
                      Tier-based pricing rewards loyal members and can increase claim rates 
                      from high-value community members.
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Validation Warning */}
            {validation && !validation.isValid && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                {validation.errors.map((error, i) => (
                  <p key={i}>{error}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {enabled && baseCost <= 0 && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm text-amber-700 dark:text-amber-400">
          Set a floor amount above to configure tier pricing.
        </div>
      )}
    </div>
  );
}
