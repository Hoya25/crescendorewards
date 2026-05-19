/**
 * Contributor economics constants — Model B
 *
 * Canonical source for lock multipliers and economic parameters
 * used by the contributor wizard's Step 5 preview and the
 * process-claim edge function's settlement math.
 *
 * Do NOT use these constants for member earning — that's the
 * Earn Rate Registry's domain (different firewall).
 */

export const LOCK_OPTIONS = {
  '90lock': {
    label: '90-Day Lock',
    durationDays: 90,
    multiplier: 1.5,
    description: '1.5x multiplier',
    bhLockType: '90LOCK' as const,
  },
  '360lock': {
    label: '360-Day Lock',
    durationDays: 360,
    multiplier: 3.0,
    description: '3.0x multiplier',
    isDefault: true,
    description2: 'Most generous',
    bhLockType: '360LOCK' as const,
  },
} as const;

export type LockOption = keyof typeof LOCK_OPTIONS;

/**
 * Default claims-to-USD rate.
 * 1 claim = $5 of reward value.
 * Stored on submission as claim_value_at_submission so members
 * see a stable price even if the rate changes later.
 */
export const DEFAULT_CLAIM_VALUE_USD = 5;

/** Minimum floor_usd_amount a contributor can list a reward at. */
export const MIN_FLOOR_USD = 5;

/** Soft warning threshold — above this, show a "are you sure?" confirmation. */
export const SOFT_WARN_FLOOR_USD = 1000;

/**
 * Compute claims_required for a contributor reward.
 * Always rounds UP.
 */
export function computeClaimsRequired(
  floorUsd: number,
  claimValueUsd: number = DEFAULT_CLAIM_VALUE_USD,
): number {
  return Math.ceil(floorUsd / claimValueUsd);
}

/**
 * Compute the submission-time NCTR preview.
 * INFORMATIONAL ONLY — actual nctr_owed at claim time uses live oracle rate.
 */
export function computeNctrPreview(
  floorUsd: number,
  multiplier: number,
  nctrUsdPrice: number,
): number {
  if (nctrUsdPrice <= 0) {
    throw new Error('nctrUsdPrice must be positive');
  }
  return Math.floor((floorUsd * multiplier) / nctrUsdPrice);
}

/** Get the multiplier for a given lock_option. Returns null for unknown. */
export function getLockMultiplier(lockOption: string): number | null {
  if (lockOption === '90lock') return 1.5;
  if (lockOption === '360lock') return 3.0;
  return null;
}

/** Reward origin types — three-type model from Turn 2.5b. */
export const REWARD_ORIGINS = ['contributor', 'sponsor', 'admin_manual'] as const;
export type RewardOrigin = (typeof REWARD_ORIGINS)[number];
