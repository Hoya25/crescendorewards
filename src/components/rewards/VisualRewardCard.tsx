import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { 
  Gift, Sparkles, ShoppingBag, CreditCard, Coins,
  Heart, Trophy, Zap, Music, Ticket, Package, Pencil
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RewardPriceCompact } from './RewardPriceDisplay';
import { type Reward } from '@/utils/getRewardPrice';

export interface VisualRewardCardData {
  id: string;
  title: string;
  description: string;
  category: string;
  cost: number;
  image_url: string | null;
  stock_quantity: number | null;
  is_active: boolean;
  is_featured: boolean;
  // Sponsorship fields
  is_sponsored?: boolean;
  sponsor_name?: string | null;
  sponsor_logo_url?: string | null;
  sponsor_logo?: string | null;
  min_status_tier?: string | null;
  status_tier_claims_cost?: Record<string, number> | null;
  campaign_id?: string | null;
  // Legacy sponsor fields
  sponsor_enabled?: boolean;
  sponsor_link?: string | null;
}

interface UserTierInfo {
  tierName: string;
  tierLevel: number;
}

interface VisualRewardCardProps {
  reward: VisualRewardCardData;
  isInFavorites: boolean;
  onToggleFavorites: (rewardId: string, e: React.MouseEvent) => void;
  onClick: () => void;
  isAnimatingHeart?: boolean;
  claimBalance?: number;
  userTier?: UserTierInfo;
  claimCount?: number;
  isAdmin?: boolean;
  onAdminEdit?: (rewardId: string) => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  alliance_tokens: Coins,
  experiences: Sparkles,
  merch: ShoppingBag,
  gift_cards: CreditCard,
  wellness: Heart,
  subscriptions: Trophy,
  gaming: Zap,
  music: Music,
  events: Ticket,
};

const categoryGradients: Record<string, string> = {
  alliance_tokens: 'from-amber-500/20 via-yellow-500/10 to-orange-500/20',
  experiences: 'from-purple-500/20 via-pink-500/10 to-rose-500/20',
  merch: 'from-blue-500/20 via-indigo-500/10 to-violet-500/20',
  gift_cards: 'from-emerald-500/20 via-green-500/10 to-teal-500/20',
  wellness: 'from-rose-500/20 via-pink-500/10 to-red-500/20',
  subscriptions: 'from-violet-500/20 via-purple-500/10 to-indigo-500/20',
  gaming: 'from-cyan-500/20 via-blue-500/10 to-indigo-500/20',
  music: 'from-green-500/20 via-emerald-500/10 to-teal-500/20',
  events: 'from-orange-500/20 via-amber-500/10 to-yellow-500/20',
};

const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

function getTierDisplayName(tier: string): string {
  const names: Record<string, string> = {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
    diamond: 'Diamond',
  };
  return names[tier.toLowerCase()] || tier;
}

// Returns the lowest tier that gets free (0 cost) access
function getFreeTierAccess(tierCosts: Record<string, number> | null | undefined): string | null {
  if (!tierCosts) return null;
  
  // Find all tiers with 0 cost
  const freeTiers = Object.entries(tierCosts)
    .filter(([_, cost]) => cost === 0)
    .map(([tier]) => tier.toLowerCase());
  
  if (freeTiers.length === 0) return null;
  
  // Return the lowest tier in the hierarchy that has free access
  for (const tier of tierOrder) {
    if (freeTiers.includes(tier)) {
      return getTierDisplayName(tier);
    }
  }
  return null;
}

function isUserTierEligible(
  minTier: string | null | undefined,
  userTierName: string
): boolean {
  if (!minTier) return true;
  
  const minTierIndex = tierOrder.indexOf(minTier.toLowerCase());
  const userTierIndex = tierOrder.indexOf(userTierName.toLowerCase());
  
  if (minTierIndex === -1 || userTierIndex === -1) return true;
  
  return userTierIndex >= minTierIndex;
}

export function VisualRewardCard({
  reward,
  isInFavorites,
  onToggleFavorites,
  onClick,
  isAnimatingHeart = false,
  claimBalance = 0,
  userTier = { tierName: 'Bronze', tierLevel: 1 },
  claimCount = 0,
  isAdmin = false,
  onAdminEdit,
}: VisualRewardCardProps) {
  const Icon = categoryIcons[reward.category] || Gift;
  const gradient = categoryGradients[reward.category] || 'from-gray-500/20 via-slate-500/10 to-zinc-500/20';
  
  const isSponsored = reward.is_sponsored || reward.sponsor_enabled;
  const sponsorName = reward.sponsor_name;
  const sponsorLogo = reward.sponsor_logo_url || reward.sponsor_logo;
  
  const freeTierName = getFreeTierAccess(reward.status_tier_claims_cost);
  const isEligible = isUserTierEligible(reward.min_status_tier, userTier.tierName);
  const remainingStock = reward.stock_quantity;
  
  // Build reward object for price display
  const rewardForPricing: Reward = {
    id: reward.id,
    cost: reward.cost,
    is_sponsored: reward.is_sponsored,
    status_tier_claims_cost: reward.status_tier_claims_cost,
    min_status_tier: reward.min_status_tier,
    stock_quantity: reward.stock_quantity,
    is_active: reward.is_active,
  };

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden transition-all duration-200",
        "hover:scale-[1.02] hover:shadow-xl",
        "rounded-xl border",
        isSponsored 
          ? "border-amber-400/50 dark:border-amber-500/30 shadow-amber-500/10" 
          : "border-gray-200 dark:border-gray-800"
      )}
      onClick={onClick}
    >
      {/* IMAGE SECTION - 60% of card height with gradient overlay */}
      <div className="relative aspect-[3/2] w-full overflow-hidden">
        {/* Background - Image or Gradient */}
        {reward.image_url ? (
          <ImageWithFallback
            src={reward.image_url}
            alt={reward.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className={cn(
            "w-full h-full flex items-center justify-center bg-gradient-to-br",
            gradient
          )}>
            <Icon className="w-16 h-16 text-muted-foreground/40" />
          </div>
        )}

        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* TOP-RIGHT: Favorites Heart */}
        <button
          className={cn(
            "absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center",
            "bg-white/90 dark:bg-black/70 backdrop-blur-md shadow-lg",
            "transition-all duration-200 hover:scale-110"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorites(reward.id, e);
          }}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-all duration-200",
              isInFavorites
                ? "fill-red-500 text-red-500"
                : "text-gray-600 dark:text-gray-300",
              isAnimatingHeart && "animate-[heartBounce_0.3s_ease-in-out]"
            )}
          />
        </button>

        {/* Admin Edit Button */}
        {isAdmin && onAdminEdit && (
          <button
            className="absolute top-2.5 right-12 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-amber-500/90 hover:bg-amber-600 backdrop-blur-md shadow-lg transition-all duration-200 hover:scale-110"
            onClick={(e) => {
              e.stopPropagation();
              onAdminEdit(reward.id);
            }}
          >
            <Pencil className="h-3.5 w-3.5 text-white" />
          </button>
        )}

        {/* BOTTOM: Title overlay on image */}
        <div className="absolute left-0 right-0 bottom-0 p-3">
          {/* Title - max 2 lines */}
          <h3 className="font-bold text-sm text-white leading-tight line-clamp-2 drop-shadow-md">
            {reward.title}
          </h3>
        </div>
      </div>

      {/* CONTENT SECTION - simplified */}
      <div className="p-3 space-y-2 bg-background">
        {/* Price Section - Prominent display */}
        <div className="flex items-center justify-between">
          <RewardPriceCompact 
            reward={rewardForPricing} 
            userTier={userTier.tierName} 
          />
        </div>

        {/* Footer: Stock info only */}
        {remainingStock !== null && remainingStock <= 20 && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Package className="w-3 h-3 mr-1" />
            <span className={cn(
              remainingStock <= 5 && "text-orange-500 font-medium"
            )}>
              {remainingStock} left
            </span>
          </div>
        )}
      </div>

      {/* BOTTOM SPONSOR BAR - Below content, not blocking image */}
      {isSponsored && (
        <div className="bg-gradient-to-r from-[#1a1d21] via-[#2a2d32] to-[#1a1d21] px-3 py-2 border-t border-amber-500/20">
          <div className="flex items-center gap-2">
            {sponsorLogo && (
              <img 
                src={sponsorLogo} 
                alt={sponsorName || 'Sponsor'} 
                className="h-4 w-auto max-w-[40px] object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <span className="text-xs text-white/80 truncate">
              <span className="font-light">Sponsored by</span>
              {' '}
              <span className="font-semibold text-amber-300">
                {sponsorName || 'Partner'}
              </span>
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

