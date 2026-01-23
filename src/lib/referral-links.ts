/**
 * Centralized referral link generation utilities
 * Always uses the production domain for consistent referral tracking
 */

// Production domain - this should always be used for referral links
// to ensure proper attribution regardless of where the link is generated
export const PRODUCTION_DOMAIN = 'https://crescendo.nctr.live';

/**
 * Get the base URL for referral links
 * Always returns the production domain for referral links
 */
export function getReferralBaseUrl(): string {
  return PRODUCTION_DOMAIN;
}

/**
 * Generate a standard referral link
 */
export function generateReferralLink(referralCode: string): string {
  if (!referralCode || referralCode === 'LOADING') {
    return `${PRODUCTION_DOMAIN}/signup`;
  }
  return `${PRODUCTION_DOMAIN}/signup?ref=${referralCode}`;
}

/**
 * Generate a personalized referral link using the user's name
 * Format: crescendo.nctr.live/join/FirstName
 */
export function generatePersonalizedLink(referralCode: string, displayName?: string | null): string {
  if (!referralCode || referralCode === 'LOADING') {
    return `${PRODUCTION_DOMAIN}/signup`;
  }
  
  if (displayName) {
    // Clean the name: take first word, remove special chars, lowercase
    const cleanName = displayName
      .split(' ')[0] // Get first name only
      .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
      .toLowerCase()
      .slice(0, 20); // Limit length
    
    if (cleanName.length >= 2) {
      return `${PRODUCTION_DOMAIN}/join/${cleanName}?ref=${referralCode}`;
    }
  }
  
  return generateReferralLink(referralCode);
}

/**
 * Generate a reward-specific referral link
 */
export function generateRewardShareLink(rewardId: string, referralCode: string): string {
  if (!referralCode) {
    return `${PRODUCTION_DOMAIN}/rewards/${rewardId}`;
  }
  return `${PRODUCTION_DOMAIN}/rewards/${rewardId}?ref=${referralCode}`;
}

/**
 * Generate a gift claim link
 */
export function generateGiftClaimLink(giftCode: string): string {
  return `${PRODUCTION_DOMAIN}/claim?code=${giftCode}`;
}

export interface ReferralLinkOptions {
  code: string;
  displayName?: string | null;
  customAlias?: string | null;
}

/**
 * Get all available link variants for the user
 */
export function getAllLinkVariants(options: ReferralLinkOptions): {
  standard: string;
  personalized: string | null;
  custom: string | null;
} {
  const { code, displayName, customAlias } = options;
  
  const standard = generateReferralLink(code);
  
  // Only generate personalized if we have a valid display name
  let personalized: string | null = null;
  if (displayName) {
    const personalizedLink = generatePersonalizedLink(code, displayName);
    if (personalizedLink !== standard) {
      personalized = personalizedLink;
    }
  }
  
  // Custom alias link
  let custom: string | null = null;
  if (customAlias) {
    const cleanAlias = customAlias
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .toLowerCase()
      .slice(0, 30);
    
    if (cleanAlias.length >= 2) {
      custom = `${PRODUCTION_DOMAIN}/join/${cleanAlias}?ref=${code}`;
    }
  }
  
  return { standard, personalized, custom };
}
