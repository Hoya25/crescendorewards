// Tier-based pricing validation utilities

export interface TierPricing {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
  diamond: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const TIER_ORDER: (keyof TierPricing)[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

/**
 * Validate that tier pricing follows descending or equal pattern
 * Diamond ≤ Platinum ≤ Gold ≤ Silver ≤ Bronze
 */
export function validateTierPricing(
  pricing: TierPricing,
  baseCost: number,
  requireAllFilled: boolean = true
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check all tiers are filled (not undefined/null)
  if (requireAllFilled) {
    for (const tier of TIER_ORDER) {
      if (pricing[tier] === undefined || pricing[tier] === null) {
        errors.push(`${capitalize(tier)} price is required`);
      }
    }
  }

  // Check for non-negative values
  for (const tier of TIER_ORDER) {
    if (pricing[tier] < 0) {
      errors.push(`${capitalize(tier)} price cannot be negative`);
    }
  }

  // Check descending order (Diamond ≤ Platinum ≤ Gold ≤ Silver ≤ Bronze)
  for (let i = 0; i < TIER_ORDER.length - 1; i++) {
    const lowerTier = TIER_ORDER[i];
    const higherTier = TIER_ORDER[i + 1];
    
    if (pricing[higherTier] > pricing[lowerTier]) {
      errors.push(
        `${capitalize(higherTier)} (${pricing[higherTier]}) should not cost more than ${capitalize(lowerTier)} (${pricing[lowerTier]})`
      );
    }
  }

  // Bronze should not exceed base cost
  if (pricing.bronze > baseCost) {
    warnings.push(`Bronze price (${pricing.bronze}) exceeds base cost (${baseCost})`);
  }

  // Warning if all prices are the same (no tiered discount)
  const allSame = TIER_ORDER.every(t => pricing[t] === pricing.bronze);
  if (allSame && pricing.bronze > 0) {
    warnings.push('All tiers have the same price. Consider adding tier-based discounts.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get the highest discount percentage in the tier structure
 */
export function getMaxDiscount(pricing: TierPricing, baseCost: number): number {
  if (baseCost === 0) return 0;
  const minPrice = Math.min(...TIER_ORDER.map(t => pricing[t]));
  return Math.round((1 - minPrice / baseCost) * 100);
}

/**
 * Check if a specific tier has free access (0 claims)
 */
export function isTierFree(pricing: TierPricing, tier: keyof TierPricing): boolean {
  return pricing[tier] === 0;
}

/**
 * Generate a default tier pricing structure with linear discounts
 */
export function generateDefaultTierPricing(
  baseCost: number,
  discountPattern: 'none' | 'linear' | 'steep' | 'gentle' = 'none'
): TierPricing {
  const patterns: Record<string, number[]> = {
    none: [0, 0, 0, 0, 0],
    linear: [0, 20, 40, 60, 80],
    steep: [0, 25, 50, 75, 100],
    gentle: [0, 10, 20, 30, 40],
  };

  const discounts = patterns[discountPattern] || patterns.none;

  return {
    bronze: Math.round(baseCost * (1 - discounts[0] / 100)),
    silver: Math.round(baseCost * (1 - discounts[1] / 100)),
    gold: Math.round(baseCost * (1 - discounts[2] / 100)),
    platinum: Math.round(baseCost * (1 - discounts[3] / 100)),
    diamond: Math.round(baseCost * (1 - discounts[4] / 100)),
  };
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
