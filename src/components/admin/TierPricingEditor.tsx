import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Percent, Wand2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateTierPricing, type ValidationResult } from '@/utils/tierPricingValidation';

interface TierPricing {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
  diamond: number;
}

interface TierPricingEditorProps {
  baseCost: number;
  pricing: TierPricing | null;
  onChange: (pricing: TierPricing) => void;
  onValidationChange?: (validation: ValidationResult) => void;
  showValidation?: boolean;
}

const TIERS = [
  { key: 'bronze', name: 'Bronze', icon: '🥉', color: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  { key: 'silver', name: 'Silver', icon: '🥈', color: 'bg-slate-400/10 text-slate-600 border-slate-300' },
  { key: 'gold', name: 'Gold', icon: '🥇', color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  { key: 'platinum', name: 'Platinum', icon: '💎', color: 'bg-slate-500/10 text-slate-700 border-slate-300' },
  { key: 'diamond', name: 'Diamond', icon: '👑', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-200' },
] as const;

const DISCOUNT_PRESETS = [
  { label: 'Linear 20%', discounts: [0, 20, 40, 60, 80] },
  { label: 'Steep 25%', discounts: [0, 25, 50, 75, 100] },
  { label: 'Gentle 10%', discounts: [0, 10, 20, 30, 40] },
  { label: 'VIP Only', discounts: [0, 0, 0, 50, 100] },
];

export function TierPricingEditor({ 
  baseCost, 
  pricing, 
  onChange,
  onValidationChange,
  showValidation = true,
}: TierPricingEditorProps) {
  const [localPricing, setLocalPricing] = useState<TierPricing>(() => 
    pricing || {
      bronze: baseCost,
      silver: baseCost,
      gold: baseCost,
      platinum: baseCost,
      diamond: baseCost,
    }
  );

  // Validate pricing and notify parent
  const validation = useMemo(() => {
    return validateTierPricing(localPricing, baseCost, true);
  }, [localPricing, baseCost]);

  useEffect(() => {
    onValidationChange?.(validation);
  }, [validation, onValidationChange]);

  // Update local pricing when baseCost changes and no custom pricing exists
  useEffect(() => {
    if (!pricing) {
      const defaultPricing = {
        bronze: baseCost,
        silver: baseCost,
        gold: baseCost,
        platinum: baseCost,
        diamond: baseCost,
      };
      setLocalPricing(defaultPricing);
      onChange(defaultPricing);
    }
  }, [baseCost]);

  const handlePriceChange = (tier: keyof TierPricing, value: number) => {
    const newPricing = { ...localPricing, [tier]: Math.max(0, value) };
    setLocalPricing(newPricing);
    onChange(newPricing);
  };

  const applyDiscountPattern = (discounts: number[]) => {
    const newPricing: TierPricing = {
      bronze: Math.round(baseCost * (1 - discounts[0] / 100)),
      silver: Math.round(baseCost * (1 - discounts[1] / 100)),
      gold: Math.round(baseCost * (1 - discounts[2] / 100)),
      platinum: Math.round(baseCost * (1 - discounts[3] / 100)),
      diamond: Math.round(baseCost * (1 - discounts[4] / 100)),
    };
    setLocalPricing(newPricing);
    onChange(newPricing);
  };

  const getDiscount = (tierPrice: number) => {
    if (baseCost === 0) return 0;
    return Math.round((1 - tierPrice / baseCost) * 100);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Status-Based Pricing
          </CardTitle>
          <div className="flex items-center gap-2">
            {showValidation && (
              validation.isValid ? (
                <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Valid
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-destructive border-destructive/30 bg-destructive/10">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {validation.errors.length} issue{validation.errors.length !== 1 ? 's' : ''}
                </Badge>
              )
            )}
            <Badge variant="outline" className="text-xs">
              Base: {baseCost} Claims
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Errors */}
        {showValidation && validation.errors.length > 0 && (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <ul className="list-disc pl-4 space-y-1">
                {validation.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Warnings */}
        {showValidation && validation.warnings.length > 0 && validation.errors.length === 0 && (
          <Alert className="py-2 border-amber-300 bg-amber-50 text-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              {validation.warnings.map((warning, i) => (
                <p key={i}>{warning}</p>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2">
          <Label className="w-full text-xs text-muted-foreground flex items-center gap-1">
            <Wand2 className="w-3 h-3" />
            Quick Patterns
          </Label>
          {DISCOUNT_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyDiscountPattern(preset.discounts)}
              className="text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Tier Pricing Grid */}
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground">
            Price per Status Level 
            <span className="text-muted-foreground/70 ml-1">(Higher tiers should cost same or less)</span>
          </Label>
          
          {TIERS.map((tier, idx) => {
            const tierPrice = localPricing[tier.key as keyof TierPricing];
            const discount = getDiscount(tierPrice);
            const isFree = tierPrice === 0;
            
            // Check if this tier violates descending order
            const prevTierKey = idx > 0 ? TIERS[idx - 1].key : null;
            const hasOrderError = prevTierKey && 
              tierPrice > localPricing[prevTierKey as keyof TierPricing];
            
            return (
              <div
                key={tier.key}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all',
                  hasOrderError 
                    ? 'border-destructive/50 bg-destructive/5' 
                    : tier.color
                )}
              >
                <div className="flex items-center gap-2 min-w-[80px] sm:min-w-[120px]">
                  <span className="text-lg">{tier.icon}</span>
                  <span className="font-medium">{tier.name}</span>
                </div>
                
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1">
                    <Slider
                      value={[tierPrice]}
                      min={0}
                      max={baseCost}
                      step={1}
                      onValueChange={([value]) => handlePriceChange(tier.key as keyof TierPricing, value)}
                      className="cursor-pointer"
                    />
                  </div>
                  
                  <Input
                    type="number"
                    min={0}
                    value={tierPrice}
                    onChange={(e) => handlePriceChange(tier.key as keyof TierPricing, parseInt(e.target.value) || 0)}
                    className={cn(
                      "w-20 text-center",
                      hasOrderError && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                </div>
                
                <div className="min-w-[60px] sm:min-w-[80px] text-right">
                  {hasOrderError ? (
                    <Badge variant="destructive" className="text-xs">
                      Too high
                    </Badge>
                  ) : isFree ? (
                    <Badge className="bg-green-500/20 text-green-600 border-green-300">
                      FREE
                    </Badge>
                  ) : discount > 0 ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      {discount}% off
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Base price</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Preview Summary */}
        <div className="pt-3 border-t">
          <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
          <div className="flex flex-wrap gap-2">
            {TIERS.map((tier) => {
              const tierPrice = localPricing[tier.key as keyof TierPricing];
              const isFree = tierPrice === 0;
              return (
                <div 
                  key={tier.key}
                  className="text-center p-2 rounded border bg-card"
                >
                  <div className="text-sm">{tier.icon}</div>
                  <div className={cn(
                    'font-bold text-sm',
                    isFree && 'text-green-600'
                  )}>
                    {isFree ? 'FREE' : `${tierPrice}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
