// Membership level calculation based on locked NCTR (360LOCK)
import type { MembershipTier } from '@/types';

// Re-export for backwards compatibility
export type { MembershipTier } from '@/types';

export const membershipTiers: MembershipTier[] = [
  {
    level: 0,
    name: 'Bronze',
    requirement: 1000,
    description: 'Alliance status (1,000-4,999 NCTR committed)',
    multiplier: 1.1,
    claims: '',
    discount: 0,
    benefits: [
      'Earns on every bounty',
      'Rewards sponsored by the alliance and its partner brands open at Bronze'
    ],
    nftBadges: ['Digital Rewards Access'],
    color: 'hsl(14 100% 57%)',
    bgColor: 'hsl(14 100% 96%)'
  },
  {
    level: 1,
    name: 'Silver',
    requirement: 5000,
    description: 'Alliance status (5,000-14,999 NCTR committed)',
    multiplier: 1.3,
    claims: '',
    discount: 0,
    benefits: [
      'Earns more than Bronze on every bounty',
      'Silver rewards open'
    ],
    nftBadges: ['Digital Rewards Access', 'Event Access'],
    color: 'hsl(0 0% 75%)',
    bgColor: 'hsl(0 0% 96%)'
  },
  {
    level: 2,
    name: 'Gold',
    requirement: 15000,
    description: 'Alliance status (15,000-39,999 NCTR committed)',
    multiplier: 1.5,
    claims: '',
    discount: 0,
    benefits: [
      'Earns more than Silver on every bounty',
      'Gold rewards and experiences open'
    ],
    nftBadges: ['Digital Rewards Access', 'Event Access', 'VIP Experiences'],
    color: 'hsl(43 96% 56%)',
    bgColor: 'hsl(43 96% 96%)'
  },
  {
    level: 3,
    name: 'Platinum',
    requirement: 40000,
    description: 'Alliance status (40,000-99,999 NCTR committed)',
    multiplier: 1.8,
    claims: '',
    discount: 0,
    benefits: [
      'Earns more than Gold on every bounty',
      'Platinum rewards, experiences, and first looks open'
    ],
    nftBadges: ['Digital Rewards Access', 'Event Access', 'VIP Experiences', 'Platinum Concierge'],
    color: 'hsl(0 0% 85%)',
    bgColor: 'hsl(0 0% 96%)'
  },
  {
    level: 4,
    name: 'Diamond',
    requirement: 100000,
    description: 'Alliance status (100,000+ NCTR committed)',
    multiplier: 2.5,
    claims: '',
    discount: 0,
    benefits: [
      'Earns the most on every bounty',
      'Everything opens at Diamond'
    ],
    nftBadges: ['Digital Rewards Access', 'Event Access', 'VIP Experiences', 'Diamond Elite'],
    color: 'hsl(180 100% 50%)',
    bgColor: 'hsl(180 100% 96%)'
  },
];

// Calculate membership level based on locked NCTR
export function getMembershipLevel(lockedNCTR: number): number {
  for (let i = membershipTiers.length - 1; i >= 0; i--) {
    if (lockedNCTR >= membershipTiers[i].requirement) {
      return membershipTiers[i].level;
    }
  }
  return 0;
}

// Get tier information by locked NCTR amount
export function getMembershipTierByNCTR(lockedNCTR: number): MembershipTier {
  const level = getMembershipLevel(lockedNCTR);
  return membershipTiers.find(t => t.level === level) || membershipTiers[0];
}

// Get tier information by level number
export function getMembershipTierByLevel(level: number): MembershipTier {
  return membershipTiers.find(t => t.level === level) || membershipTiers[0];
}

// Get next tier information
export function getNextMembershipTier(lockedNCTR: number): MembershipTier | null {
  const currentLevel = getMembershipLevel(lockedNCTR);
  return membershipTiers.find(t => t.level === currentLevel + 1) || null;
}

// Calculate progress to next level
export function getMembershipProgress(lockedNCTR: number): number {
  const currentTier = getMembershipTierByNCTR(lockedNCTR);
  const nextTier = getNextMembershipTier(lockedNCTR);
  
  if (!nextTier) return 100; // Max level reached
  
  const progress = ((lockedNCTR - currentTier.requirement) / (nextTier.requirement - currentTier.requirement)) * 100;
  return Math.max(0, Math.min(100, progress));
}

// Calculate NCTR needed for next level
export function getNCTRNeededForNextLevel(lockedNCTR: number): number {
  const nextTier = getNextMembershipTier(lockedNCTR);
  if (!nextTier) return 0;
  return Math.max(0, nextTier.requirement - lockedNCTR);
}
