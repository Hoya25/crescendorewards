/**
 * Reward calculation utility — handles status multiplier × merch bonus stacking.
 *
 * TWO LAYERS THAT STACK:
 * 1. STATUS MULTIPLIER — applies to ALL earning (Bronze 1x → Diamond 3x)
 * 2. MERCH 360LOCK BONUS — 3x automatic on merch purchases + merch bounties ONLY
 *
 * FORMULA: final = base × merch_bonus (if applicable) × status_multiplier
 */

export interface RewardCalculation {
  baseAmount: number;
  merchBonus: number;         // 1 or 3
  statusMultiplier: number;   // 1.0 – 3.0
  finalAmount: number;
  isMerch: boolean;
  tierName: string;
}

export function calculateReward(
  baseAmount: number,
  options: {
    statusMultiplier?: number;
    tierName?: string;
    isMerch?: boolean;        // merch purchase or merch bounty
    is360Lock?: boolean;      // whether 360LOCK commitment chosen
  } = {},
): RewardCalculation {
  const statusMultiplier = options.statusMultiplier ?? 1.0;
  const tierName = options.tierName ?? 'bronze';
  const isMerch = options.isMerch ?? false;
  const is360Lock = options.is360Lock ?? false;

  // Merch bonus: 3x when 360LOCK + merch, otherwise 1x
  const merchBonus = isMerch && is360Lock ? 3 : 1;

  const finalAmount = Math.round(baseAmount * merchBonus * statusMultiplier);

  return {
    baseAmount,
    merchBonus,
    statusMultiplier,
    finalAmount,
    isMerch,
    tierName,
  };
}

/**
 * Format a multiplier breakdown string for display.
 * e.g. "250 × 3x merch × 1.5x Gold = 1,125 NCTR"
 */
export function formatMultiplierBreakdown(calc: RewardCalculation): string {
  const parts: string[] = [`${calc.baseAmount.toLocaleString()}`];
  if (calc.merchBonus > 1) parts.push(`${calc.merchBonus}x merch`);
  if (calc.statusMultiplier > 1) parts.push(`${calc.statusMultiplier}x ${capitalize(calc.tierName)}`);
  parts.push(`= ${calc.finalAmount.toLocaleString()} NCTR`);
  return parts.join(' × ');
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Default earning multipliers per tier (used as fallback).
 */
export const DEFAULT_EARNING_MULTIPLIERS: Record<string, number> = {
  bronze: 1.0,
  silver: 1.25,
  gold: 1.5,
  platinum: 1.75,
  diamond: 2.0,
};
