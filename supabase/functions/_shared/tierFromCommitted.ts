// Status tier from committed (360LOCK) NCTR, computed at send time.
// Title-case names match what Bounty Hunter accepts. Below the first threshold
// there is no tier ("pre-Bronze") and callers must omit the tier field entirely.
export type CommittedTier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

export const COMMITTED_TIER_THRESHOLDS: ReadonlyArray<{ tier: CommittedTier; min: number }> = [
  { tier: "Diamond", min: 100_000 },
  { tier: "Platinum", min: 40_000 },
  { tier: "Gold", min: 15_000 },
  { tier: "Silver", min: 5_000 },
  { tier: "Bronze", min: 1_000 },
];

export const PRE_BRONZE_LABEL = "pre-Bronze";

export function tierForCommitted(committed: number | null | undefined): CommittedTier | null {
  const amount = Number(committed);
  if (!Number.isFinite(amount)) return null;
  for (const t of COMMITTED_TIER_THRESHOLDS) {
    if (amount >= t.min) return t.tier;
  }
  return null;
}
