import { 
  Coins, Sparkles, ShoppingBag, CreditCard, Heart, Trophy, 
  Gamepad2, Film, Rocket, Bitcoin, Package, Gift
} from 'lucide-react';

// ============================================================================
// REWARD CATEGORIES
// Single source of truth for all reward category definitions
// ============================================================================

export const REWARD_CATEGORIES = [
  { value: 'alliance_tokens', label: 'Alliance Tokens', icon: Coins },
  { value: 'experiences', label: 'Experiences', icon: Sparkles },
  { value: 'merch', label: 'Merchandise', icon: ShoppingBag },
  { value: 'gift_cards', label: 'Gift Cards', icon: CreditCard },
  { value: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { value: 'entertainment', label: 'Entertainment', icon: Film },
  { value: 'subscriptions', label: 'Subscriptions', icon: Trophy },
  { value: 'wellness', label: 'Health & Wellness', icon: Heart },
  { value: 'crypto', label: 'Crypto', icon: Bitcoin },
  { value: 'opportunity', label: 'Opportunity', icon: Rocket },
] as const;

// For filter dropdowns that need an "All" option
export const REWARD_CATEGORIES_WITH_ALL = [
  { value: 'all', label: 'All Categories', icon: Package },
  ...REWARD_CATEGORIES,
] as const;

// Simple key-value map for display labels
export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  REWARD_CATEGORIES.map(cat => [cat.value, cat.label])
);

// Icon map for category rendering
export const CATEGORY_ICONS: Record<string, React.ElementType> = Object.fromEntries(
  REWARD_CATEGORIES.map(cat => [cat.value, cat.icon])
);

// Valid category values for URL param validation
export const VALID_CATEGORY_VALUES = REWARD_CATEGORIES.map(cat => cat.value);

// ============================================================================
// STATUS TIERS (Membership Levels)
// Bronze → Silver → Gold → Platinum → Diamond
// ============================================================================

export const STATUS_TIERS = [
  { 
    value: 'bronze', 
    label: 'Bronze', 
    emoji: '🥉', 
    color: 'orange',
    className: 'bg-orange-500/10 text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800' 
  },
  { 
    value: 'silver', 
    label: 'Silver', 
    emoji: '🥈', 
    color: 'slate',
    className: 'bg-slate-400/10 text-slate-600 border-slate-300 dark:text-slate-300 dark:border-slate-600' 
  },
  { 
    value: 'gold', 
    label: 'Gold', 
    emoji: '🥇', 
    color: 'amber',
    className: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800' 
  },
  { 
    value: 'platinum', 
    label: 'Platinum', 
    emoji: '💎', 
    color: 'slate',
    className: 'bg-slate-500/10 text-slate-700 border-slate-300 dark:text-slate-200 dark:border-slate-600' 
  },
  { 
    value: 'diamond', 
    label: 'Diamond', 
    emoji: '👑', 
    color: 'cyan',
    className: 'bg-cyan-500/10 text-cyan-600 border-cyan-200 dark:text-cyan-400 dark:border-cyan-800' 
  },
] as const;

// Status tier access options for reward restriction
export const STATUS_TIER_ACCESS_OPTIONS = [
  { value: 'none', label: 'All Members', description: 'Anyone can claim', emoji: '🔓' },
  { value: 'bronze', label: 'Bronze & Above', description: 'Bronze, Silver, Gold, Platinum, Diamond', emoji: '🥉' },
  { value: 'silver', label: 'Silver & Above', description: 'Silver, Gold, Platinum, Diamond', emoji: '🥈' },
  { value: 'gold', label: 'Gold & Above', description: 'Gold, Platinum, Diamond', emoji: '🥇' },
  { value: 'platinum', label: 'Platinum & Above', description: 'Platinum, Diamond', emoji: '💎' },
  { value: 'diamond', label: 'Diamond Only', description: 'Diamond tier exclusive', emoji: '👑' },
] as const;

// Tier badge styling for admin displays
export const TIER_BADGES: Record<string, { emoji: string; label: string; className: string }> = {
  all: { emoji: '🔓', label: 'All', className: 'bg-green-500/10 text-green-600 border-green-200' },
  none: { emoji: '🔓', label: 'All', className: 'bg-green-500/10 text-green-600 border-green-200' },
  bronze: { emoji: '🥉', label: 'Bronze+', className: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  silver: { emoji: '🥈', label: 'Silver+', className: 'bg-slate-400/10 text-slate-600 border-slate-300' },
  gold: { emoji: '🥇', label: 'Gold+', className: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  platinum: { emoji: '💎', label: 'Platinum+', className: 'bg-slate-500/10 text-slate-700 border-slate-300' },
  diamond: { emoji: '👑', label: 'Diamond', className: 'bg-cyan-500/10 text-cyan-600 border-cyan-200' },
};

// Emoji lookup
export const TIER_EMOJIS: Record<string, string> = Object.fromEntries(
  STATUS_TIERS.map(tier => [tier.value, tier.emoji])
);

// ============================================================================
// DELIVERY METHODS
// How rewards are fulfilled to users
// ============================================================================

export const DELIVERY_METHODS = [
  { value: 'email', label: 'Email Delivery', description: 'Send digital content via email' },
  { value: 'instant_code', label: 'Instant Code', description: 'User receives code immediately' },
  { value: 'shipping', label: 'Physical Shipping', description: 'Ship physical product' },
  { value: 'wallet', label: 'Crypto Wallet', description: 'Send to user wallet address' },
  { value: 'discord', label: 'Discord Delivery', description: 'Send via Discord DM' },
  { value: 'manual', label: 'Manual Fulfillment', description: 'Admin handles delivery' },
] as const;

// Simple label map
export const DELIVERY_METHOD_LABELS: Record<string, string> = Object.fromEntries(
  DELIVERY_METHODS.map(method => [method.value, method.label])
);

// ============================================================================
// REWARD TYPES (for submission forms)
// Physical vs Digital classification
// ============================================================================

export const REWARD_TYPES = [
  { id: 'physical', label: 'Physical Product', icon: Package },
  { id: 'digital', label: 'Digital Good', icon: Sparkles },
  { id: 'giftcard', label: 'Gift Card', icon: CreditCard },
  { id: 'experience', label: 'Experience', icon: Sparkles },
  { id: 'nft', label: 'NFT/Crypto', icon: Bitcoin },
  { id: 'merch', label: 'Merchandise', icon: ShoppingBag },
  { id: 'subscription', label: 'Subscription', icon: Trophy },
  { id: 'other', label: 'Other', icon: Gift },
] as const;

// Reward type label map
export const REWARD_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  REWARD_TYPES.map(type => [type.id, type.label])
);

// ============================================================================
// QUICK FILTER TABS (for admin tables)
// ============================================================================

export const REWARD_QUICK_FILTERS = [
  { value: 'all', label: 'All Rewards' },
  { value: 'active', label: 'Active' },
  { value: 'sponsored', label: 'Sponsored' },
  { value: 'featured', label: 'Featured' },
  { value: 'inactive', label: 'Inactive' },
] as const;

// ============================================================================
// BRAND CATEGORIES (separate from reward categories)
// ============================================================================

export const BRAND_CATEGORIES = [
  'Retail',
  'Dining',
  'Travel',
  'Entertainment',
  'Wellness',
  'Technology',
  'Lifestyle',
] as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get display label for a category value
 */
export function getCategoryLabel(value: string): string {
  return CATEGORY_LABELS[value] || value;
}

/**
 * Get icon component for a category
 */
export function getCategoryIcon(value: string): React.ElementType {
  return CATEGORY_ICONS[value] || Gift;
}

/**
 * Get tier emoji by tier name
 */
export function getTierEmoji(tierName: string): string {
  return TIER_EMOJIS[tierName.toLowerCase()] || '🔓';
}

/**
 * Check if a category value is valid
 */
export function isValidCategory(value: string): boolean {
  return VALID_CATEGORY_VALUES.includes(value as any);
}
