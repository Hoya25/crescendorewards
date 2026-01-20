import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { 
  Gift, Sparkles, ShoppingBag, CreditCard, Coins,
  Heart, Trophy, Zap, Music, Ticket, Package
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

const tierOrder = ['droplet', 'eddy', 'spiral', 'surge', 'torus'];

function getTierDisplayName(tier: string): string {
  const names: Record<string, string> = {
    droplet: 'Droplet',
    eddy: 'Eddy',
    spiral: 'Spiral',
    surge: 'Surge',
    torus: 'Torus',
  };
  return names[tier.toLowerCase()] || tier;
}

function getFreeTierName(tierCosts: Record<string, number> | null | undefined): string | null {
  if (!tierCosts) return null;
  
  for (const [tier, cost] of Object.entries(tierCosts)) {
    if (cost === 0) {
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
  userTier = { tierName: 'Droplet', tierLevel: 1 },
  claimCount = 0,
}: VisualRewardCardProps) {
  const Icon = categoryIcons[reward.category] || Gift;
  const gradient = categoryGradients[reward.category] || 'from-gray-500/20 via-slate-500/10 to-zinc-500/20';
  
  const isSponsored = reward.is_sponsored || reward.sponsor_enabled;
  const sponsorName = reward.sponsor_name;
  const sponsorLogo = reward.sponsor_logo_url || reward.sponsor_logo;
  
  const freeTierName = getFreeTierName(reward.status_tier_claims_cost);
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
      {/* IMAGE SECTION - 60% of card */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
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
            <Icon className="w-20 h-20 text-muted-foreground/40" />
          </div>
        )}

        {/* Overlay Gradient for better badge visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

        {/* TOP-LEFT: Category Badge */}
        <Badge 
          className="absolute top-3 left-3 bg-black/50 text-white backdrop-blur-md border-0 text-xs font-medium"
        >
          <Icon className="w-3 h-3 mr-1" />
          {reward.category.replace('_', ' ')}
        </Badge>

        {/* TOP-RIGHT: Sponsored Badge */}
        {isSponsored && (
          <Badge 
            className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black border-0 text-xs font-bold shadow-lg"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            SPONSORED
          </Badge>
        )}

        {/* BOTTOM-LEFT: Sponsor Logo */}
        {isSponsored && sponsorLogo && (
          <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-black/70 backdrop-blur-md rounded-lg p-1.5 shadow-lg">
            <img 
              src={sponsorLogo} 
              alt={sponsorName || 'Sponsor'} 
              className="h-6 w-auto max-w-[80px] object-contain"
            />
          </div>
        )}

        {/* BOTTOM-RIGHT: Free for Tier Badge */}
        {freeTierName && (
          <Badge 
            className="absolute bottom-3 right-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 text-xs font-bold shadow-lg"
          >
            <Gift className="w-3 h-3 mr-1" />
            FREE for {freeTierName}
          </Badge>
        )}

        {/* Favorites Heart Button - Floating */}
        <button
          className={cn(
            "absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center",
            "bg-white/90 dark:bg-black/70 backdrop-blur-md shadow-lg",
            "transition-all duration-200 hover:scale-110",
            isSponsored && "right-[120px]"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorites(reward.id, e);
          }}
        >
          <Heart
            className={cn(
              "h-5 w-5 transition-all duration-200",
              isInFavorites
                ? "fill-red-500 text-red-500"
                : "text-gray-600 dark:text-gray-300",
              isAnimatingHeart && "animate-[heartBounce_0.3s_ease-in-out]"
            )}
          />
        </button>
      </div>

      {/* CONTENT SECTION - 40% of card */}
      <div className="p-4 space-y-3 bg-background">
        {/* Title */}
        <h3 className="font-bold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {reward.title}
        </h3>

        {/* Sponsor Name */}
        {isSponsored && sponsorName && (
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            Sponsored by {sponsorName}
          </p>
        )}

        {/* Price Section - using reusable component */}
        <RewardPriceCompact 
          reward={rewardForPricing} 
          userTier={userTier.tierName} 
        />

        {/* View Details Button - appears on hover */}
        <Button
          variant="default"
          size="sm"
          className={cn(
            "w-full opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            !isEligible && "pointer-events-none"
          )}
          disabled={!isEligible}
        >
          View Details
        </Button>

        {/* Footer Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
          <div className="flex items-center gap-3">
            {remainingStock !== null && (
              <span className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                {remainingStock} left
              </span>
            )}
            {claimCount > 0 && (
              <span className="flex items-center gap-1">
                <Gift className="w-3 h-3" />
                {claimCount} claimed
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
