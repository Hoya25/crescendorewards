/**
 * Centralized referral reward constants
 * Single source of truth for all referral-related messaging
 */

export const REFERRAL_REWARDS = {
  // Default values - these can be overridden by admin settings
  defaults: {
    allocation360Lock: 500,
    signupBonus: 100,
    claimsPerReferral: 0, // Currently not awarding claims per referral
  },
  
  // Reward descriptions for consistent messaging
  descriptions: {
    inviter: {
      short: (nctr: number) => `${nctr} NCTR 360LOCK per referral`,
      full: (nctr: number) => `Earn ${nctr} NCTR in 360LOCK for each friend who joins`,
    },
    invitee: {
      short: (nctr: number) => `${nctr} NCTR 360LOCK welcome bonus`,
      full: (nctr: number) => `Get ${nctr} NCTR in 360LOCK when you join`,
    },
    mutual: (nctr: number) => `You both earn ${nctr} NCTR in 360LOCK`,
  },
  
  // Share text templates
  shareText: {
    default: (nctr: number) => `Join me on Crescendo and we both earn ${nctr} NCTR in 360LOCK!`,
    qrCard: (nctr: number) => `Scan the QR code or use my link to join and earn ${nctr} NCTR!`,
    twitter: (nctr: number) => `🎁 Join me on @CrescendoNCTR and we BOTH earn ${nctr} NCTR in 360LOCK! No purchase required.`,
    telegram: (nctr: number) => `🎁 Join Crescendo with my link and we both earn ${nctr} NCTR in 360LOCK!`,
    whatsapp: (nctr: number) => `Hey! Join me on Crescendo and we'll both earn ${nctr} NCTR in 360LOCK. It's free to join:`,
  },
  
  // Milestone definitions (synced with referral_milestones table)
  milestones: [
    { count: 1, nctr: 500, claims: 0, badge: '🎉', description: 'First referral reward' },
    { count: 3, nctr: 0, claims: 5, badge: '🦋', badgeName: 'Social Butterfly', description: 'Bonus claims unlocked' },
    { count: 5, nctr: 1000, claims: 0, badge: '🔗', badgeName: 'Connector', description: 'Connector badge earned' },
    { count: 10, nctr: 2000, claims: 10, badge: '🌐', badgeName: 'Networker', title: 'Community Builder', description: 'Networker badge + exclusive reward' },
    { count: 25, nctr: 5000, claims: 25, badge: '👑', badgeName: 'Ambassador', title: 'Crescendo Ambassador', description: 'Ambassador title unlocked' },
  ],
} as const;

// Helper function to get next milestone
export function getNextMilestone(currentReferrals: number) {
  return REFERRAL_REWARDS.milestones.find(m => m.count > currentReferrals) || null;
}

// Helper function to get milestone progress
export function getMilestoneProgress(currentReferrals: number) {
  const next = getNextMilestone(currentReferrals);
  if (!next) {
    return { current: currentReferrals, target: currentReferrals, progress: 100, remaining: 0 };
  }
  
  const prevMilestone = REFERRAL_REWARDS.milestones
    .filter(m => m.count <= currentReferrals)
    .pop();
  
  const start = prevMilestone?.count || 0;
  const range = next.count - start;
  const progress = range > 0 ? Math.round(((currentReferrals - start) / range) * 100) : 0;
  
  return {
    current: currentReferrals,
    target: next.count,
    progress: Math.min(progress, 100),
    remaining: next.count - currentReferrals,
  };
}
