// Shared member-benefits resolver: EARN · OPENS · YOUR SAY · PERKS.
// Pure functions so the app, emails and MCP tool apply the same wording.
// Every number comes from the database rows passed in — never constants.

export interface TierRow {
  tier_name: string; // 'bronze'
  display_name: string; // 'Bronze'
  min_nctr_360_locked: number;
  earning_multiplier: number;
}

export interface TierSayRow {
  tier_name: string;
  backing_weight: number;
  can_nominate: boolean;
  council_eligible: boolean;
  perks: string[];
}

export interface OpenReward {
  id: string;
  title: string;
  image_url: string | null;
  min_tier_required: string | null;
}

export interface TierBenefitRows {
  tier: TierRow;
  earn: string;
  opens: { count: number; label: string; first: OpenReward[]; link: string };
  say: { backing_weight: number; can_nominate: boolean; council_eligible: boolean; label: string };
  perks: string[];
}

/** Live rate expressed against 10: 1.3 → "Earns 13 for every 10 at base". */
export function earnLabel(rate: number): string {
  const per10 = Math.round(Number(rate) * 10 * 10) / 10;
  return `Earns ${per10} for every 10 at base`;
}

export function formatWeight(w: number): string {
  return `${Number(w)}×`;
}

/** YOUR SAY row text derived from tier_benefits. */
export function sayLabel(say: Pick<TierSayRow, 'backing_weight' | 'can_nominate' | 'council_eligible'>, isBaseTier: boolean): string {
  const parts: string[] = [isBaseTier ? 'Your backing counts' : `Backing at ${formatWeight(say.backing_weight)}`];
  if (say.can_nominate) parts.push('nominates');
  if (say.council_eligible) parts.push('Council-eligible');
  return parts.join(' · ');
}

export function opensAt(tier: TierRow, rewards: OpenReward[]): OpenReward[] {
  return rewards.filter((r) => (r.min_tier_required || '').toLowerCase() === tier.tier_name.toLowerCase());
}

export function resolveTier(tier: TierRow, tiers: TierRow[], says: TierSayRow[], rewards: OpenReward[]): TierBenefitRows {
  const sorted = [...tiers].sort((a, b) => a.min_nctr_360_locked - b.min_nctr_360_locked);
  const isBase = sorted[0]?.tier_name === tier.tier_name;
  const say = says.find((s) => s.tier_name === tier.tier_name) ?? {
    tier_name: tier.tier_name, backing_weight: 1, can_nominate: false, council_eligible: false, perks: [],
  };
  const open = opensAt(tier, rewards);
  return {
    tier,
    earn: earnLabel(tier.earning_multiplier),
    opens: {
      count: open.length,
      label: open.length > 0 ? `Opens at ${tier.display_name}: ${open.length} reward${open.length === 1 ? '' : 's'}` : `Opens at ${tier.display_name}`,
      first: open.slice(0, 3),
      link: `/rewards?tier=${tier.tier_name}`,
    },
    say: { backing_weight: say.backing_weight, can_nominate: say.can_nominate, council_eligible: say.council_eligible, label: sayLabel(say, isBase) },
    perks: Array.isArray(say.perks) ? say.perks : [],
  };
}

/** "Available with {Tier}" — cumulative count of rewards open at or below the tier. */
export function availableWith(tier: TierRow, tiers: TierRow[], rewards: OpenReward[]): { count: number; label: string } {
  const allowed = new Set(tiers.filter((t) => t.min_nctr_360_locked <= tier.min_nctr_360_locked).map((t) => t.tier_name.toLowerCase()));
  const count = rewards.filter((r) => !r.min_tier_required || allowed.has(r.min_tier_required.toLowerCase())).length;
  return { count, label: `${count} available with ${tier.display_name}` };
}

export function nextTierFor(tiers: TierRow[], balance: number): TierRow | null {
  return [...tiers].sort((a, b) => a.min_nctr_360_locked - b.min_nctr_360_locked).find((t) => t.min_nctr_360_locked > balance) ?? null;
}

/** "{remaining} NCTR to {Tier} — opens {first} and {n-1} more" */
export function progressLabel(balance: number, tiers: TierRow[], rewards: OpenReward[]): string | null {
  const next = nextTierFor(tiers, balance);
  if (!next) return null;
  const remaining = Math.max(0, Math.ceil(next.min_nctr_360_locked - balance)).toLocaleString();
  const open = opensAt(next, rewards);
  if (open.length === 0) return `${remaining} NCTR to ${next.display_name} — opens ${next.display_name} earning and say`;
  if (open.length === 1) return `${remaining} NCTR to ${next.display_name} — opens ${open[0].title}`;
  return `${remaining} NCTR to ${next.display_name} — opens ${open[0].title} and ${open.length - 1} more`;
}
