// Preview rewards: listed and badged so members can see what's coming, but
// not claimable yet. Today this is every reward from these sponsors.
export const PREVIEW_SPONSORS = ['Kroma Wellness'];

export function isPreviewReward(reward?: { sponsor_name?: string | null } | null): boolean {
  return !!reward?.sponsor_name && PREVIEW_SPONSORS.includes(reward.sponsor_name);
}

/** "silver" -> "Opens at Silver". Reads the reward's tier gate column. */
export function previewOpensLabel(tier?: string | null): string {
  const t = (tier || '').trim();
  return t ? `Opens at ${t.charAt(0).toUpperCase()}${t.slice(1).toLowerCase()}` : 'Opens soon';
}
