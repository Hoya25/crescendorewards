import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, Sparkles, Award, Gift, HelpCircle, Flame, Crown, Gem } from 'lucide-react';
import { NCTRLogo } from '@/components/NCTRLogo';
import { cn } from '@/lib/utils';

export interface ClaimPackage {
  id: string;
  claims: number;
  price: number;
  label: string;
  popular?: boolean;
  bonus?: number;
  tierBadge?: { emoji: string; label: string } | null;
  multiplierBadge?: string | null;
}

interface ClaimsPackageCardProps {
  package: ClaimPackage;
  isSelected: boolean;
  onSelect: () => void;
  isBestValue?: boolean;
}

// Format numbers with commas
const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

const calculateSavings = (claims: number, price: number): number => {
  const basePrice = 5.99;
  const regularPrice = claims * basePrice;
  return regularPrice - price;
};

// Get badge styling based on tier
const getBadgeStyle = (label: string): string => {
  switch (label) {
    case 'Most Popular':
      return 'bg-gradient-to-r from-violet-600 to-purple-600 border-none text-white';
    case 'Hot':
      return 'bg-gradient-to-r from-orange-500 to-red-500 border-none text-white';
    case 'Best Value':
      return 'bg-gradient-to-r from-cyan-500 to-blue-500 border-none text-white';
    case 'VIP':
      return 'bg-gradient-to-r from-amber-500 to-yellow-500 border-none text-black';
    default:
      return '';
  }
};

export function ClaimsPackageCard({ 
  package: pkg, 
  isSelected, 
  onSelect, 
  isBestValue = false 
}: ClaimsPackageCardProps) {
  const savings = calculateSavings(pkg.claims, pkg.price);
  const pricePerClaim = (pkg.price / pkg.claims).toFixed(2);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 relative overflow-hidden group",
        isSelected
          ? 'ring-2 ring-primary border-primary bg-primary/5 scale-[1.02]'
          : 'hover:border-primary/50 hover:scale-[1.01] hover:shadow-lg',
        pkg.popular && !isSelected && 'border-violet-500/40 bg-gradient-to-br from-violet-500/5 to-purple-500/5',
        pkg.tierBadge?.label === 'VIP' && !isSelected && 'border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-yellow-500/5',
        pkg.tierBadge?.label === 'Best Value' && !isSelected && 'border-cyan-500/40 bg-gradient-to-br from-cyan-500/5 to-blue-500/5',
        pkg.tierBadge?.label === 'Hot' && !isSelected && 'border-orange-500/40 bg-gradient-to-br from-orange-500/5 to-red-500/5'
      )}
      onClick={onSelect}
    >
      {/* Tier badge - corner ribbon */}
      {pkg.tierBadge && (
        <div className={cn(
          "absolute -right-8 top-4 rotate-45 text-xs font-medium px-10 py-1 shadow-sm",
          getBadgeStyle(pkg.tierBadge.label)
        )}>
          {pkg.tierBadge.emoji} {pkg.tierBadge.label}
        </div>
      )}

      <CardContent className="p-6">
        {/* Header with badges */}
        <div className="flex items-center gap-2 mb-2 min-h-[28px] flex-wrap">
          {pkg.tierBadge && (
            <Badge className={cn("gap-1 shrink-0", getBadgeStyle(pkg.tierBadge.label))}>
              {pkg.tierBadge.emoji} {pkg.tierBadge.label}
            </Badge>
          )}
          {pkg.multiplierBadge && (
            <Badge variant="secondary" className="gap-1 shrink-0 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 dark:from-emerald-900/50 dark:to-green-900/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
              <Sparkles className="w-3 h-3" />
              {pkg.multiplierBadge}
            </Badge>
          )}
          {isSelected && (
            <Badge className="gap-1 shrink-0 bg-primary ml-auto">
              <Check className="w-3 h-3" />
              Selected
            </Badge>
          )}
        </div>

        {/* Package name */}
        <h3 className="font-semibold text-lg mb-1">{pkg.label}</h3>

        {/* Claims amount - large */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-bold text-foreground">{formatNumber(pkg.claims)}</span>
          <span className="text-lg text-muted-foreground">Claims</span>
        </div>

        {/* Bonus badge */}
        {pkg.bonus && pkg.bonus > 0 && (
          <Badge 
            variant="secondary" 
            className="mb-3 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 dark:from-amber-900/50 dark:to-yellow-900/50 dark:text-amber-400 border-amber-200 dark:border-amber-800"
          >
            <Gift className="w-3 h-3 mr-1" />
            +{formatNumber(pkg.bonus)} 360LOCK NCTR!
          </Badge>
        )}

        {/* Price section */}
        <div className="mb-4 mt-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl font-bold">${formatNumber(pkg.price)}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            ${pricePerClaim} per claim
          </p>
          {savings > 0 && (
            <Badge variant="outline" className="text-xs mt-2 text-emerald-600 border-emerald-200 dark:border-emerald-800">
              Save ${formatNumber(Math.round(savings))} vs individual
            </Badge>
          )}
        </div>

        {/* Bonus NCTR details */}
        {pkg.bonus && (
          <div className="mb-4 p-3 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-violet-600 shrink-0" />
              <span className="text-sm font-medium text-violet-900 dark:text-violet-100">
                +{formatNumber(pkg.bonus)}
              </span>
              <NCTRLogo size="xs" />
              <span className="text-xs text-violet-600 font-medium">(360LOCK)</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3.5 h-3.5 text-violet-600 cursor-help shrink-0 ml-auto" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold mb-1">360LOCK NCTR Bonus</p>
                    <p className="text-sm">
                      Bonus NCTR is locked for 360 days, boosting your membership tier and earning potential.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}

        {/* Select button */}
        <Button 
          className={cn(
            "w-full transition-all",
            isSelected 
              ? "bg-primary hover:bg-primary/90" 
              : pkg.popular 
                ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                : pkg.tierBadge?.label === 'VIP'
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black"
                  : "bg-secondary hover:bg-secondary/80"
          )}
          variant={isSelected ? "default" : pkg.popular || pkg.tierBadge ? "default" : "secondary"}
        >
          {isSelected ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Selected
            </>
          ) : (
            'Select Package'
          )}
        </Button>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-3">
          <Check className="w-3 h-3 text-emerald-500" />
          <span>Instant delivery</span>
        </div>
      </CardContent>
    </Card>
  );
}
