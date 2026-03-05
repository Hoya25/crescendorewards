/**
 * Tier-based claim discount calculator.
 * 
 * Each tier has a discount multiplier applied to the base claim cost.
 * Result is always rounded UP to the nearest whole number.
 */

export const TIER_DISCOUNT_MULTIPLIERS: Record<string, number> = {
  bronze: 1.00,
  silver: 0.85,
  gold: 0.70,
  platinum: 0.55,
  diamond: 0.40,
};

const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const;

/**
 * Calculate the discounted claim cost for a user's tier.
 * Always rounds UP to the nearest whole number.
 */
export function calculateClaimsForUser(
  rewardClaimCost: number,
  userTier: string
): number {
  const normalizedTier = userTier.toLowerCase();
  const multiplier = TIER_DISCOUNT_MULTIPLIERS[normalizedTier] ?? 1.0;
  return Math.ceil(rewardClaimCost * multiplier);
}

/**
 * Get the next tier above the user's current tier.
 * Returns null if already at Diamond.
 */
export function getNextTierName(userTier: string): string | null {
  const normalizedTier = userTier.toLowerCase();
  const currentIndex = TIER_ORDER.indexOf(normalizedTier as any);
  if (currentIndex === -1 || currentIndex >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[currentIndex + 1];
}

/**
 * Get tier display name (capitalized).
 */
export function getTierLabel(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
}

/**
 * Get the upsell message to show below the claim cost.
 */
export function getClaimDiscountUpsell(
  rewardClaimCost: number,
  userTier: string
): string {
  const normalizedTier = userTier.toLowerCase();

  if (normalizedTier === 'diamond') {
    return 'Best rate — Diamond discount applied';
  }

  if (normalizedTier === 'bronze') {
    return 'Upgrade to Silver for 15% off all rewards';
  }

  const nextTier = getNextTierName(normalizedTier);
  if (!nextTier) return '';

  const nextTierCost = calculateClaimsForUser(rewardClaimCost, nextTier);
  return `${getTierLabel(nextTier)} members pay ${nextTierCost} claim${nextTierCost !== 1 ? 's' : ''} →`;
}

/**
 * Get all tier prices for a given base claim cost.
 */
export function getAllTierDiscountedPrices(rewardClaimCost: number) {
  return TIER_ORDER.map(tier => ({
    tier,
    displayName: getTierLabel(tier),
    cost: calculateClaimsForUser(rewardClaimCost, tier),
  }));
}
