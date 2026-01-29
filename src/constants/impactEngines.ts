// Impact Engine Configuration - Scalable for future tokens
import { Hexagon, Zap, Sparkles, Flame, Mountain } from 'lucide-react';

export type ImpactEngineSlug = 'groundball' | 'throttle' | 'stardust' | 'sweat' | 'sisu';

export interface ImpactEngine {
  slug: ImpactEngineSlug;
  name: string;
  displayName: string;
  description: string;
  icon: string; // Emoji or icon name
  color: string; // HSL color for theming
  isActive: boolean;
  comingSoonText?: string;
  routes: {
    root: string;
    rewards: string;
    myRewards: string;
    gearVault?: string; // Only for engines with gear contribution
  };
}

export const IMPACT_ENGINES: ImpactEngine[] = [
  {
    slug: 'groundball',
    name: 'GROUNDBALL',
    displayName: 'GROUNDBALL',
    description: 'Lacrosse community rewards & impact',
    icon: '🥍',
    color: 'hsl(142 76% 36%)', // Emerald green
    isActive: true,
    routes: {
      root: '/groundball',
      rewards: '/groundball/rewards',
      myRewards: '/groundball/my-rewards',
      gearVault: '/groundball/gear-vault',
    },
  },
  {
    slug: 'throttle',
    name: 'THROTTLE',
    displayName: 'THROTTLE',
    description: 'Motorsports & racing community',
    icon: '🏎️',
    color: 'hsl(0 84% 60%)', // Racing red
    isActive: false,
    comingSoonText: 'Launching Q2 2025',
    routes: {
      root: '/throttle',
      rewards: '/throttle/rewards',
      myRewards: '/throttle/my-rewards',
    },
  },
  {
    slug: 'stardust',
    name: 'STARDUST',
    displayName: 'STARDUST',
    description: 'Space & astronomy enthusiasts',
    icon: '✨',
    color: 'hsl(256 67% 59%)', // Cosmic purple
    isActive: false,
    comingSoonText: 'Launching Q3 2025',
    routes: {
      root: '/stardust',
      rewards: '/stardust/rewards',
      myRewards: '/stardust/my-rewards',
    },
  },
  {
    slug: 'sweat',
    name: 'SWEAT',
    displayName: 'SWEAT',
    description: 'Fitness & wellness community',
    icon: '💪',
    color: 'hsl(20 96% 50%)', // Energy orange
    isActive: false,
    comingSoonText: 'Launching Q4 2025',
    routes: {
      root: '/sweat',
      rewards: '/sweat/rewards',
      myRewards: '/sweat/my-rewards',
    },
  },
  {
    slug: 'sisu',
    name: 'SISU',
    displayName: 'SISU',
    description: 'Mental resilience & endurance',
    icon: '🔥',
    color: 'hsl(200 95% 48%)', // Ice blue
    isActive: false,
    comingSoonText: 'Launching 2026',
    routes: {
      root: '/sisu',
      rewards: '/sisu/rewards',
      myRewards: '/sisu/my-rewards',
    },
  },
];

export const getActiveEngines = () => IMPACT_ENGINES.filter(e => e.isActive);
export const getEngineBySlug = (slug: string) => IMPACT_ENGINES.find(e => e.slug === slug);

// Groundball-specific navigation tabs
export const GROUNDBALL_NAV_TABS = [
  { label: 'Overview', path: '/groundball', exact: true },
  { label: 'Rewards', path: '/groundball/rewards', exact: false },
  { label: 'My Rewards', path: '/groundball/my-rewards', exact: false },
  { label: 'Gear Vault', path: '/groundball/gear-vault', exact: false },
];

// Reward filter options (reusable across engines)
export const REWARD_CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories', emoji: '🎯' },
  { value: 'experiences', label: 'Experiences', emoji: '⭐' },
  { value: 'gear', label: 'Gear', emoji: '🥍' },
  { value: 'give-back', label: 'Give-Back', emoji: '💚' },
] as const;

export const REWARD_CADENCE_OPTIONS = [
  { value: 'all', label: 'All Cadences' },
  { value: 'daily', label: 'Daily' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
  { value: 'one_time', label: 'One-Time' },
] as const;

export const REWARD_STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'bronze', label: 'Bronze+' },
  { value: 'silver', label: 'Silver+' },
  { value: 'gold', label: 'Gold' },
] as const;

export type RewardCategoryFilter = typeof REWARD_CATEGORY_OPTIONS[number]['value'];
export type RewardCadenceFilter = typeof REWARD_CADENCE_OPTIONS[number]['value'];
export type RewardStatusFilter = typeof REWARD_STATUS_OPTIONS[number]['value'];
