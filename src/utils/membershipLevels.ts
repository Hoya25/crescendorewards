// Membership level calculation based on locked NCTR (360LOCK)
import type { MembershipTier } from '@/types';

// Re-export for backwards compatibility
export type { MembershipTier } from '@/types';

export const membershipTiers: MembershipTier[] = [
  {
    level: 0,
    name: 'Bronze',
    requirement: 100,
    description: 'Entry tier with enhanced earning potential (100-999 NCTR)',
    multiplier: 1.1,
    claims: '1 annual claim',
    discount: 0,
    benefits: [
      'Access to bronze reward catalog',
      '1 reward claim per year',
      'Priority customer support',
      'Earn 1.1x NCTR on all activities'
    ],
    nftBadges: ['Digital Rewards Access'],
    color: 'hsl(14 100% 57%)',
    bgColor: 'hsl(14 100% 96%)'
  },
  {
    level: 1,
    name: 'Silver',
    requirement: 1000,
    description: 'Enhanced benefits with quarterly claim privileges (1,000-4,999 NCTR)',
    multiplier: 1.25,
    claims: '4 annual claims',
    discount: 10,
    benefits: [
      'Access to silver reward catalog',
      '4 reward claims per year',
      'Early access to new rewards',
      'Earn 1.25x NCTR on all activities',
      '10% discount on partner brands'
    ],
    nftBadges: ['Digital Rewards Access', 'Event Access'],
    color: 'hsl(0 0% 75%)',
    bgColor: 'hsl(0 0% 96%)'
  },
  {
    level: 2,
    name: 'Gold',
    requirement: 5000,
    description: 'Elite status with monthly claims and exclusive perks (5,000-14,999 NCTR)',
    multiplier: 1.4,
    claims: '1 monthly claim',
    discount: 15,
    benefits: [
      'Access to gold reward catalog',
      '1 reward claim per month',
      'VIP event invitations',
      'Earn 1.4x NCTR on all activities',
      '15% discount on partner brands',
      'Dedicated account manager'
    ],
    nftBadges: ['Digital Rewards Access', 'Event Access', 'VIP Experiences'],
    color: 'hsl(43 96% 56%)',
    bgColor: 'hsl(43 96% 96%)'
  },
  {
    level: 3,
    name: 'Platinum',
    requirement: 15000,
    description: 'Premium status with bi-monthly claims and concierge service (15,000-49,999 NCTR)',
    multiplier: 1.6,
    claims: '2 monthly claims',
    discount: 20,
    benefits: [
      'Access to platinum reward catalog',
      '2 reward claims per month',
      'Exclusive platinum events',
      'Earn 1.6x NCTR on all activities',
      '20% discount on partner brands',
      'Personal concierge service',
      'Priority shipping'
    ],
    nftBadges: ['Digital Rewards Access', 'Event Access', 'VIP Experiences', 'Platinum Concierge'],
    color: 'hsl(0 0% 85%)',
    bgColor: 'hsl(0 0% 96%)'
  },
  {
    level: 4,
    name: 'Diamond',
    requirement: 50000,
    description: 'Ultimate status with unlimited benefits and white-glove service (50,000+ NCTR)',
    multiplier: 2.0,
    claims: 'Unlimited',
    discount: 25,
    benefits: [
      'Access to diamond reward catalog',
      'Unlimited reward claims',
      'Exclusive diamond experiences',
      'Earn 2x NCTR on all activities',
      '25% discount on partner brands',
      'White-glove concierge service',
      'Free expedited shipping',
      'Early access to all new features'
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
