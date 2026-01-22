export type EarningCategory = 'shopping' | 'apps' | 'partners' | 'community' | 'impact';
export type EarnType = 'nctr' | 'task' | 'referral' | 'purchase' | 'activity';

export interface EarningOpportunity {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  iconName: string;
  iconUrl?: string;
  backgroundColor: string;
  category: EarningCategory;
  earnType: EarnType;
  earnPotential?: string;
  ctaText: string;
  ctaUrl?: string;
  opensInNewTab: boolean;
  isFeatured: boolean;
  isActive: boolean;
  isComingSoon: boolean;
  comingSoonText?: string;
  sortOrder: number;
  requirements?: string[];
  tags?: string[];
  stats?: {
    totalEarned?: number;
    activeUsers?: number;
    avgEarning?: number;
  };
}

export const CATEGORY_CONFIG: Record<EarningCategory, { label: string; icon: string; description: string }> = {
  shopping: { label: 'Shopping', icon: 'ShoppingBag', description: 'Earn while you shop' },
  apps: { label: 'Apps', icon: 'Smartphone', description: 'Earn through NCTR apps' },
  partners: { label: 'Partners', icon: 'Handshake', description: 'Earn with partner brands' },
  community: { label: 'Community', icon: 'Users', description: 'Earn by growing the community' },
  impact: { label: 'Impact', icon: 'Rocket', description: 'Earn in Impact Engines' },
};
