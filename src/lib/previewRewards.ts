// Preview rewards: listed and badged so members can see what's coming, but
// not claimable yet. The server flag `rewards.is_preview` is authoritative
// (claims are rejected in the database); the sponsor list only covers
// surfaces that select explicit columns without is_preview.
export const PREVIEW_SPONSORS = ['Kroma Wellness'];

export function isPreviewReward(
  reward?: { sponsor_name?: string | null; is_preview?: boolean | null } | null,
): boolean {
  if (reward?.is_preview === true) return true;
  return !!reward?.sponsor_name && PREVIEW_SPONSORS.includes(reward.sponsor_name);
}

/** "silver" -> "Opens at Silver". Reads the reward's tier gate column. */
export function previewOpensLabel(tier?: string | null): string {
  const t = (tier || '').trim();
  return t ? `Opens at ${t.charAt(0).toUpperCase()}${t.slice(1).toLowerCase()}` : 'Opens soon';
}
