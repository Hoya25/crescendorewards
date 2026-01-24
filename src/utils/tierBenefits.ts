// Benefit slot allocations per tier
export const TIER_BENEFIT_SLOTS: Record<string, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
  diamond: 6,
};

// Ordered list of tiers from lowest to highest
export const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const;

export type TierName = (typeof TIER_ORDER)[number];

/**
 * Get the numeric index of a tier (0-based)
 * Higher index = higher tier
 */
export function getTierIndex(tier: string): number {
  const normalizedTier = tier.toLowerCase();
  const index = TIER_ORDER.indexOf(normalizedTier as TierName);
  return index >= 0 ? index : 0; // Default to bronze (0) if unknown
}

/**
 * Check if user's tier meets or exceeds the required tier
 */
export function canAccessPartner(userTier: string, requiredTier: string): boolean {
  const userIndex = getTierIndex(userTier);
  const requiredIndex = getTierIndex(requiredTier);
  return userIndex >= requiredIndex;
}

/**
 * Get the number of benefit slots available for a given tier
 */
export function getAvailableSlots(tier: string): number {
  const normalizedTier = tier.toLowerCase();
  return TIER_BENEFIT_SLOTS[normalizedTier] || 1;
}

/**
 * Get the display name for a tier (capitalized)
 */
export function getTierDisplayName(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
}

/**
 * Get tier color classes for badges
 */
export function getTierColorClasses(tier: string): string {
  const colors: Record<string, string> = {
    bronze: 'bg-amber-700 text-white',
    silver: 'bg-slate-400 text-white',
    gold: 'bg-yellow-500 text-black',
    platinum: 'bg-slate-200 text-black border border-slate-300',
    diamond: 'bg-cyan-400 text-black',
  };
  return colors[tier.toLowerCase()] || colors.bronze;
}

/**
 * Get the next tier up from the current tier
 */
export function getNextTier(currentTier: string): string | null {
  const currentIndex = getTierIndex(currentTier);
  if (currentIndex >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[currentIndex + 1];
}

/**
 * Calculate how many tiers needed to unlock a partner
 */
export function getTiersUntilUnlock(userTier: string, requiredTier: string): number {
  const userIndex = getTierIndex(userTier);
  const requiredIndex = getTierIndex(requiredTier);
  return Math.max(0, requiredIndex - userIndex);
}
