// Sponsorship System Types

export type SponsorType = 'brand' | 'creator' | 'employer' | 'individual' | 'nonprofit' | 'organization';
export type SponsorTier = 'community' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'mission';
export type ContributionModel = 'contribute' | 'full_sponsor' | 'tier_sponsor' | 'hybrid' | 'revenue_share';
export type CampaignType = 'ongoing' | 'limited_time' | 'event' | 'mission_aligned';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'more_info';

export interface Sponsor {
  id: string;
  user_id?: string;
  type: SponsorType;
  name: string;
  slug?: string;
  logo_url?: string;
  cover_image_url?: string;
  description?: string;
  website_url?: string;
  contact_email?: string;
  social_links?: Record<string, string>;
  tier: SponsorTier;
  is_verified: boolean;
  is_active: boolean;
  total_sponsored_value: number;
  total_claims: number;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SponsorshipCampaign {
  id: string;
  sponsor_id: string;
  name: string;
  description?: string;
  campaign_type: CampaignType;
  budget_total?: number;
  budget_spent: number;
  start_date: string;
  end_date?: string;
  target_mission_engine?: string;
  target_tiers: string[];
  is_active: boolean;
  created_at: string;
  sponsor?: Sponsor;
}

export interface TierPricing {
  diamond: number;
  platinum: number;
  gold: number;
  silver: number;
  bronze: number;
  [key: string]: number;
}

export interface SponsoredReward {
  id: string;
  title: string;
  description: string;
  category: string;
  cost: number;
  image_url?: string;
  contribution_model: ContributionModel;
  linked_sponsor_id?: string;
  campaign_id?: string;
  sponsor_message?: string;
  sponsor_cta_text?: string;
  sponsor_cta_url?: string;
  cost_per_claim?: number;
  revenue_share_percent?: number;
  status_tier_claims_cost?: TierPricing;
  sponsor?: Sponsor;
  campaign?: SponsorshipCampaign;
  is_active: boolean;
  is_sponsored?: boolean;
  stock_quantity?: number;
}

export interface SponsorApplication {
  id: string;
  user_id?: string;
  type: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  website_url?: string;
  description?: string;
  intended_contribution?: string;
  status: ApplicationStatus;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface SponsorshipTransaction {
  id: string;
  sponsor_id: string;
  campaign_id?: string;
  reward_id?: string;
  transaction_type: 'claim_sponsored' | 'budget_deposit' | 'monthly_fee' | 'refund';
  amount: number;
  member_id?: string;
  member_tier?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface SponsorStats {
  total_rewards: number;
  total_claims: number;
  total_value_sponsored: number;
  claims_this_month: number;
  active_campaigns: number;
}

export interface MemberRewardPrice {
  base_price: number;
  your_price: number;
  is_free: boolean;
  discount_percent: number;
  contribution_model: ContributionModel;
  is_sponsored: boolean;
  error?: string;
}

// Configuration objects for UI display

export const SPONSOR_TYPE_CONFIG: Record<SponsorType, { label: string; icon: string; description: string }> = {
  brand: { label: 'Brand', icon: 'Building2', description: 'Company or retail brand' },
  creator: { label: 'Creator', icon: 'Sparkles', description: 'Content creator or influencer' },
  employer: { label: 'Employer', icon: 'Briefcase', description: 'Company offering job opportunities' },
  individual: { label: 'Individual', icon: 'User', description: 'Personal contributor' },
  nonprofit: { label: 'Nonprofit', icon: 'Heart', description: 'Charitable organization' },
  organization: { label: 'Organization', icon: 'Users', description: 'Association or group' },
};

export const SPONSOR_TIER_CONFIG: Record<SponsorTier, { label: string; color: string; minMonthly: number; bgColor: string }> = {
  community: { label: 'Community Contributor', color: 'text-muted-foreground', minMonthly: 0, bgColor: 'bg-muted' },
  bronze: { label: 'Bronze Sponsor', color: 'text-amber-700', minMonthly: 500, bgColor: 'bg-amber-500/10' },
  silver: { label: 'Silver Sponsor', color: 'text-slate-500', minMonthly: 2000, bgColor: 'bg-slate-500/10' },
  gold: { label: 'Gold Sponsor', color: 'text-yellow-600', minMonthly: 5000, bgColor: 'bg-yellow-500/10' },
  platinum: { label: 'Platinum Sponsor', color: 'text-violet-600', minMonthly: 10000, bgColor: 'bg-violet-500/10' },
  mission: { label: 'Mission Sponsor', color: 'text-emerald-600', minMonthly: 25000, bgColor: 'bg-emerald-500/10' },
};

export const CONTRIBUTION_MODEL_CONFIG: Record<ContributionModel, { label: string; description: string; icon: string }> = {
  contribute: { label: 'Contribute', description: 'Members spend Claims, you receive NCTR', icon: 'Gift' },
  full_sponsor: { label: 'Full Sponsor', description: 'You fund free access for all members', icon: 'Crown' },
  tier_sponsor: { label: 'Tier Sponsor', description: 'Free for top tiers, Claims for others', icon: 'Award' },
  hybrid: { label: 'Hybrid', description: 'Discounted pricing by tier', icon: 'Sliders' },
  revenue_share: { label: 'Revenue Share', description: 'Pay commission on conversions only', icon: 'TrendingUp' },
};

export const CAMPAIGN_TYPE_CONFIG: Record<CampaignType, { label: string; description: string }> = {
  ongoing: { label: 'Ongoing', description: 'Continuous sponsorship without end date' },
  limited_time: { label: 'Limited Time', description: 'Time-bound promotional campaign' },
  event: { label: 'Event', description: 'Sponsorship tied to a specific event' },
  mission_aligned: { label: 'Mission Aligned', description: 'Supporting a specific Impact Engine' },
};

// Helper functions

export function getSponsorTierBadgeClasses(tier: SponsorTier): string {
  const config = SPONSOR_TIER_CONFIG[tier];
  return `${config.color} ${config.bgColor}`;
}

export function formatSponsorType(type: SponsorType): string {
  return SPONSOR_TYPE_CONFIG[type]?.label || type;
}

export function formatContributionModel(model: ContributionModel): string {
  return CONTRIBUTION_MODEL_CONFIG[model]?.label || model;
}

export const DEFAULT_TIER_PRICING: TierPricing = {
  diamond: 0,
  platinum: 0,
  gold: 25,
  silver: 50,
  bronze: 100,
};

export const MEMBER_TIER_ORDER = ['diamond', 'platinum', 'gold', 'silver', 'bronze'] as const;

export const MEMBER_TIER_DISPLAY: Record<string, { emoji: string; label: string }> = {
  diamond: { emoji: '💎', label: 'Diamond' },
  platinum: { emoji: '👑', label: 'Platinum' },
  gold: { emoji: '🥇', label: 'Gold' },
  silver: { emoji: '🥈', label: 'Silver' },
  bronze: { emoji: '🥉', label: 'Bronze' },
};
