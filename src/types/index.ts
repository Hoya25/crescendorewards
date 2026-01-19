// Shared TypeScript interfaces for the Crescendo app
// These types are derived from Supabase tables and app structures

/**
 * User profile from the profiles table
 */
export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  level: number;
  locked_nctr: number;
  available_nctr: number;
  claim_balance: number;
  referral_code: string | null;
  referred_by?: string | null;
  has_claimed_signup_bonus: boolean;
  has_status_access_pass: boolean;
  wallet_address: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Reward from the rewards table
 */
export interface Reward {
  id: string;
  title: string;
  description: string;
  category: string;
  cost: number;
  image_url: string | null;
  stock_quantity: number | null;
  is_active: boolean;
  is_featured: boolean;
  token_gated: boolean | null;
  token_name: string | null;
  token_symbol: string | null;
  token_contract_address: string | null;
  minimum_token_balance: number | null;
  brand_id: string | null;
  // Sponsorship fields
  sponsor_enabled: boolean;
  sponsor_name: string | null;
  sponsor_logo: string | null;
  sponsor_link: string | null;
  sponsor_start_date: string | null;
  sponsor_end_date: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Brand from the brands table
 */
export interface Brand {
  id: string;
  name: string;
  description: string;
  category: string;
  logo_emoji: string;
  logo_color: string;
  shop_url: string;
  image_url: string | null;
  base_earning_rate: number;
  is_featured: boolean;
  is_active: boolean;
  earn_opportunities: EarnOpportunity[] | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Earn opportunity structure for brands
 */
export interface EarnOpportunity {
  action: string;
  rate: number;
  description?: string;
}

/**
 * Membership tier structure from membershipLevels.ts
 */
export interface MembershipTier {
  level: number;
  name: string;
  requirement: number;
  description: string;
  multiplier: number;
  claims: string;
  discount: number;
  benefits: string[];
  nftBadges: string[];
  color: string;
  bgColor: string;
}

/**
 * Reward claim from the rewards_claims table
 */
export interface RewardClaim {
  id: string;
  user_id: string;
  reward_id: string;
  status: 'pending' | 'approved' | 'shipped' | 'completed';
  claimed_at: string;
  shipping_info: Record<string, unknown> | null;
}

/**
 * Reward submission from the reward_submissions table
 */
export interface RewardSubmission {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  brand: string | null;
  reward_type: string;
  lock_rate: string;
  nctr_value: number;
  claim_passes_required: number;
  stock_quantity: number | null;
  image_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  version: number;
  parent_submission_id: string | null;
  is_latest_version: boolean;
  version_notes: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Purchase from the purchases table
 */
export interface Purchase {
  id: string;
  user_id: string;
  claims_amount: number;
  amount_paid: number;
  package_id: string;
  package_name: string;
  currency: string;
  stripe_session_id: string | null;
  status: string;
  created_at: string;
}
