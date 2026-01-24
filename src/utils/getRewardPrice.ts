// Status-based pricing utility for rewards
// Calculates tier-specific prices for sponsored rewards

export interface TierPricing {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
  diamond: number;
}

export interface Reward {
  id: string;
  cost: number;
  is_sponsored?: boolean | null;
  status_tier_claims_cost?: TierPricing | Record<string, number> | null;
  min_status_tier?: string | null;
  stock_quantity?: number | null;
  is_active?: boolean;
}

export interface PriceResult {
  price: number;
  isFree: boolean;
  discount: number;
  originalPrice: number;
}

export interface ClaimEligibility {
  canClaim: boolean;
  reason?: string;
}

// Tier order from lowest to highest
const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const;
type TierName = typeof TIER_ORDER[number];

/**
 * Get the reward price for a specific user tier
 * Sponsored rewards can have tier-specific pricing
 */
export function getRewardPriceForUser(
  reward: Reward,
  userTier: string
): PriceResult {
  const normalizedTier = userTier.toLowerCase();
  
  // If not sponsored or no tier pricing, return base cost
  if (!reward.is_sponsored || !reward.status_tier_claims_cost) {
    return {
      price: reward.cost,
      isFree: reward.cost === 0,
      discount: 0,
      originalPrice: reward.cost
    };
  }

  const tierPricing = reward.status_tier_claims_cost as TierPricing;
  const tierPrice = tierPricing[normalizedTier as keyof TierPricing] ?? reward.cost;
  const originalPrice = tierPricing.bronze ?? reward.cost;

  return {
    price: tierPrice,
    isFree: tierPrice === 0,
    discount: originalPrice > 0 ? Math.round((1 - tierPrice / originalPrice) * 100) : 0,
    originalPrice
  };
}

/**
 * Check if a user can claim a reward based on tier and balance
 */
export function canUserClaimReward(
  reward: Reward,
  userTier: string,
  userBalance: number
): ClaimEligibility {
  const normalizedTier = userTier.toLowerCase();
  
  // Check if reward is active
  if (reward.is_active === false) {
    return {
      canClaim: false,
      reason: 'This reward is no longer available'
    };
  }

  // Check stock
  if (reward.stock_quantity !== null && reward.stock_quantity !== undefined && reward.stock_quantity <= 0) {
    return {
      canClaim: false,
      reason: 'Out of stock'
    };
  }

  // Check minimum tier requirement
  if (reward.min_status_tier) {
    const normalizedMinTier = reward.min_status_tier.toLowerCase();
    const userTierIndex = TIER_ORDER.indexOf(normalizedTier as TierName);
    const requiredTierIndex = TIER_ORDER.indexOf(normalizedMinTier as TierName);

    if (userTierIndex === -1 || requiredTierIndex === -1) {
      // Invalid tier, allow claim but log warning
      console.warn('Invalid tier comparison:', { userTier, minTier: reward.min_status_tier });
    } else if (userTierIndex < requiredTierIndex) {
      const displayTier = reward.min_status_tier.charAt(0).toUpperCase() + reward.min_status_tier.slice(1);
      return {
        canClaim: false,
        reason: `Requires ${displayTier} status or higher`
      };
    }
  }

  const { price } = getRewardPriceForUser(reward, userTier);

  if (price > userBalance) {
    const needed = price - userBalance;
    return {
      canClaim: false,
      reason: `Need ${needed} more claim${needed !== 1 ? 's' : ''}`
    };
  }

  return { canClaim: true };
}

/**
 * Get display-friendly tier name (without emoji for cleaner display)
 */
export function getTierDisplayName(tier: string): string {
  const tierMap: Record<string, string> = {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
    diamond: 'Diamond'
  };
  return tierMap[tier.toLowerCase()] || tier;
}

/**
 * Get all tier prices for a reward (for display purposes)
 */
export function getAllTierPrices(reward: Reward): { tier: string; price: number; displayName: string }[] {
  if (!reward.is_sponsored || !reward.status_tier_claims_cost) {
    return TIER_ORDER.map(tier => ({
      tier,
      price: reward.cost,
      displayName: getTierDisplayName(tier)
    }));
  }

  const tierPricing = reward.status_tier_claims_cost as TierPricing;
  
  return TIER_ORDER.map(tier => ({
    tier,
    price: tierPricing[tier] ?? reward.cost,
    displayName: getTierDisplayName(tier)
  }));
}
