/**
 * CANONICAL TIER DEFINITIONS — Single source of truth for Crescendo.
 *
 * These must match the authoritative values in BH's database function
 * (`get_status_tier_for_lock`). If BH changes, update HERE and all
 * Crescendo components update automatically.
 *
 * At runtime the user's *current* tier is resolved from the
 * `status_tiers` DB table via `UnifiedUserContext`. The constants
 * below are used only for:
 *   • progress-bar / hero visual layout
 *   • fallback when the DB query fails
 *   • static display (landing, status page, deposit page, etc.)
 */

// ── Core tier data ──────────────────────────────────────────────

export interface TierDefinition {
  id: string;
  name: string;
  /** Minimum 360-locked NCTR to qualify */
  threshold: number;
  /** Earning multiplier */
  multiplier: number;
  /** Canonical badge color (hex) */
  color: string;
  /** Badge emoji */
  emoji: string;
}

export const TIERS: TierDefinition[] = [
  { id: 'bronze',   name: 'Bronze',   threshold: 1_000,   multiplier: 1.0,  color: '#CD7F32', emoji: '🥉' },
  { id: 'silver',   name: 'Silver',   threshold: 5_000,   multiplier: 1.25, color: '#C0C0C8', emoji: '🥈' },
  { id: 'gold',     name: 'Gold',     threshold: 15_000,  multiplier: 1.5,  color: '#FFD764', emoji: '🥇' },
  { id: 'platinum', name: 'Platinum', threshold: 40_000,  multiplier: 1.8,  color: '#C8C8D2', emoji: '💎' },
  { id: 'diamond',  name: 'Diamond',  threshold: 100_000, multiplier: 2.5,  color: '#B9F2FF', emoji: '👑' },
];

// ── Derived helpers ─────────────────────────────────────────────

/** Tier names in order */
export const TIER_NAMES = TIERS.map(t => t.name);

/** Quick lookup by id */
export const TIER_BY_ID: Record<string, TierDefinition> = Object.fromEntries(
  TIERS.map(t => [t.id, t]),
);

/** Quick lookup by lowercase name */
export const TIER_BY_NAME: Record<string, TierDefinition> = Object.fromEntries(
  TIERS.map(t => [t.name.toLowerCase(), t]),
);

/**
 * Return the tier a user qualifies for given their 360-locked NCTR.
 * Falls back to the lowest tier when balance is below Bronze.
 */
export function getTierForBalance(locked: number): TierDefinition {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (locked >= TIERS[i].threshold) return TIERS[i];
  }
  return TIERS[0];
}

/** Return the next tier above the user's current balance, or null at Diamond. */
export function getNextTierForBalance(locked: number): TierDefinition | null {
  for (const t of TIERS) {
    if (t.threshold > locked) return t;
  }
  return null;
}

/** Progress percentage toward the next tier (0-100). 100 if at Diamond. */
export function getProgressToNextTier(locked: number): number {
  const current = getTierForBalance(locked);
  const next = getNextTierForBalance(locked);
  if (!next) return 100;
  const range = next.threshold - current.threshold;
  if (range <= 0) return 100;
  return Math.min(100, Math.max(0, ((locked - current.threshold) / range) * 100));
}

/** Claim-cost discount multiplier per tier id */
export const CLAIM_DISCOUNT_MULTIPLIERS: Record<string, number> = {
  bronze: 1.0,
  silver: 0.85,
  gold: 0.70,
  platinum: 0.55,
  diamond: 0.40,
};

// ── Extended visual data (for hero / progress components) ───────

export interface TierVisual extends TierDefinition {
  rgb: string;
  glow: string;
  tagline: string;
  perks: string[];
}

export const TIER_VISUALS: TierVisual[] = [
  { ...TIER_BY_ID['bronze'],   rgb: '205,127,50',  glow: 'rgba(205,127,50,0.45)',  tagline: 'Every alliance begins here.',        perks: ['Bronze rewards catalog', 'NCTR earning on all purchases', 'Alliance member newsletter'] },
  { ...TIER_BY_ID['silver'],   rgb: '192,192,200', glow: 'rgba(192,192,200,0.38)', tagline: 'Early access. More earning.',         perks: ['Everything in Bronze', 'Early access to new brands', '1.25× NCTR on select partners'] },
  { ...TIER_BY_ID['gold'],     rgb: '255,215,100', glow: 'rgba(255,215,100,0.50)', tagline: 'Exclusive drops. Priority support.',  perks: ['Everything in Silver', 'Exclusive Gold reward drops', 'Priority member support'] },
  { ...TIER_BY_ID['platinum'], rgb: '200,200,210', glow: 'rgba(200,200,210,0.35)', tagline: 'VIP experiences. Dedicated access.',  perks: ['Everything in Gold', 'VIP brand partner experiences', 'Dedicated account access'] },
  { ...TIER_BY_ID['diamond'],  rgb: '185,242,255', glow: 'rgba(185,242,255,0.55)', tagline: 'Elite status. Diamond drops.',        perks: ['Everything in Platinum', 'Diamond member status', 'Exclusive Diamond drops'] },
];
