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
  min_tier_required?: string | null;
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
 * CANON: Claims are NEVER discounted by status tier.
 * Tier value = access, eligibility, and earn multipliers.
 * The ONLY sanctioned price override is the per-reward
 * `status_tier_claims_cost` map, set per reward by an admin.
 *
 * This mirrors the server-side `claim_reward` RPC exactly:
 *   if (status_tier_claims_cost ? user_tier) -> that value
 *   else -> rewards.cost
 */
export function getTierOverrideCost(
  reward: Reward,
  userTier: string
): number | null {
  const map = reward.status_tier_claims_cost as Record<string, number> | null | undefined;
  if (!map || typeof map !== 'object') return null;

  // Server matches the tier key as stored (status_tiers.tier_name).
  // Try exact, then case-insensitive, to stay safe across casings.
  if (userTier in map && typeof map[userTier] === 'number') return map[userTier];
  const key = Object.keys(map).find(k => k.toLowerCase() === userTier.toLowerCase());
  if (key && typeof map[key] === 'number') return map[key];
  return null;
}

export function hasTierPriceOverrides(reward: Reward): boolean {
  const map = reward.status_tier_claims_cost as Record<string, number> | null | undefined;
  if (!map || typeof map !== 'object') return false;
  return Object.values(map).some(v => typeof v === 'number' && v !== reward.cost);
}

/**
 * Get the reward price for a specific user tier.
 * Returns exactly what the server will charge.
 */
export function getRewardPriceForUser(
  reward: Reward,
  userTier: string
): PriceResult {
  const override = getTierOverrideCost(reward, userTier);
  const price = override ?? reward.cost;
  const originalPrice = reward.cost;

  return {
    price,
    isFree: price === 0,
    // Only a real per-reward override can produce a "discount".
    discount: originalPrice > 0 && price < originalPrice
      ? Math.round((1 - price / originalPrice) * 100)
      : 0,
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
  // TIER COLUMN CONSOLIDATION: prefer v2 column min_tier_required, fall back to legacy min_status_tier.
  const effectiveMinTier = reward.min_tier_required || reward.min_status_tier;
  if (effectiveMinTier) {
    const normalizedMinTier = effectiveMinTier.toLowerCase();
    const userTierIndex = TIER_ORDER.indexOf(normalizedTier as TierName);
    const requiredTierIndex = TIER_ORDER.indexOf(normalizedMinTier as TierName);

    if (userTierIndex === -1 || requiredTierIndex === -1) {
      // Invalid tier, allow claim but log warning
      console.warn('Invalid tier comparison:', { userTier, minTier: effectiveMinTier });
    } else if (userTierIndex < requiredTierIndex) {
      const displayTier = effectiveMinTier.charAt(0).toUpperCase() + effectiveMinTier.slice(1);
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
 * Get all tier prices for a reward (for display purposes).
 * Prices come ONLY from the per-reward status_tier_claims_cost override,
 * falling back to rewards.cost — never from a tier discount table.
 */
export function getAllTierPrices(reward: Reward): { tier: string; price: number; displayName: string }[] {
  return TIER_ORDER.map(tier => ({
    tier,
    price: getTierOverrideCost(reward, tier) ?? reward.cost,
    displayName: getTierDisplayName(tier)
  }));
}

