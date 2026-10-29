// Server copy of the shared member-benefits resolver (mirrors src/lib/tierBenefits.ts).
// EARN · OPENS · YOUR SAY · PERKS — every number is read from the database.

export interface ResolvedTier {
  tier_name: string
  display_name: string
  threshold: number
  earn_rate: number
  earn: string
  opens: { count: number; label: string; first: { id: string; title: string; image_url: string | null }[] }
  say: { backing_weight: number; can_nominate: boolean; council_eligible: boolean; label: string }
  perks: string[]
  rows: string[]
}

// deno-lint-ignore no-explicit-any
type Client = any

export function earnLabel(rate: number): string {
  return `Earns ${Math.round(Number(rate) * 100) / 10} for every 10 at base`
}

export async function loadTierBenefits(supabase: Client): Promise<ResolvedTier[]> {
  const [tiersR, sayR, rewardsR] = await Promise.all([
    supabase.from('status_tiers').select('tier_name, display_name, min_nctr_360_locked, earning_multiplier').eq('is_active', true).order('min_nctr_360_locked'),
    supabase.from('tier_benefits').select('tier_name, backing_weight, can_nominate, council_eligible, perks'),
    supabase.from('rewards').select('id, title, image_url, min_tier_required').eq('is_active', true).order('created_at'),
  ])
  if (tiersR.error) throw tiersR.error
  const tiers = tiersR.data ?? []
  const says = sayR.data ?? []
  const rewards = rewardsR.data ?? []
  return tiers.map((t: Client, i: number) => {
    const s = says.find((x: Client) => x.tier_name === t.tier_name) ?? { backing_weight: 1, can_nominate: false, council_eligible: false, perks: [] }
    const open = rewards.filter((r: Client) => (r.min_tier_required || '').toLowerCase() === t.tier_name.toLowerCase())
    const sayParts = [i === 0 ? 'Your backing counts' : `Backing at ${Number(s.backing_weight)}×`]
    if (s.can_nominate) sayParts.push('nominates')
    if (s.council_eligible) sayParts.push('Council-eligible')
    const perks: string[] = Array.isArray(s.perks) ? s.perks : []
    const earn = earnLabel(Number(t.earning_multiplier))
    const opensLabel = open.length ? `Opens at ${t.display_name}: ${open.length} reward${open.length === 1 ? '' : 's'}` : `Opens at ${t.display_name}`
    const sayLabel = sayParts.join(' · ')
    return {
      tier_name: t.tier_name,
      display_name: t.display_name,
      threshold: Number(t.min_nctr_360_locked),
      earn_rate: Number(t.earning_multiplier),
      earn,
      opens: { count: open.length, label: opensLabel, first: open.slice(0, 3).map((r: Client) => ({ id: r.id, title: r.title, image_url: r.image_url })) },
      say: { backing_weight: Number(s.backing_weight), can_nominate: !!s.can_nominate, council_eligible: !!s.council_eligible, label: sayLabel },
      perks,
      rows: [earn, open.length ? `${opensLabel} — ${open.slice(0, 3).map((r: Client) => r.title).join(', ')}` : opensLabel, sayLabel, ...perks],
    }
  })
}

export function progressLabel(tiers: ResolvedTier[], balance: number): string | null {
  const next = tiers.find((t) => t.threshold > balance)
  if (!next) return null
  const remaining = Math.max(0, Math.ceil(next.threshold - balance)).toLocaleString()
  if (next.opens.count === 0) return `${remaining} NCTR to ${next.display_name} — opens ${next.display_name} earning and say`
  if (next.opens.count === 1) return `${remaining} NCTR to ${next.display_name} — opens ${next.opens.first[0].title}`
  return `${remaining} NCTR to ${next.display_name} — opens ${next.opens.first[0].title} and ${next.opens.count - 1} more`
}
