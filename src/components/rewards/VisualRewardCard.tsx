import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { 
  Gift, Sparkles, ShoppingBag, CreditCard, Coins,
  Heart, Trophy, Zap, Music, Ticket, Package, Pencil, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getRewardPriceForUser, 
  canUserClaimReward,
  getTierDisplayName,
  type Reward 
} from '@/utils/getRewardPrice';
import { useAuthContext } from '@/contexts/AuthContext';
import { CreatorShowcase, CreatorHandles } from '@/components/creators/CreatorShowcase';
import { useRewardCreators } from '@/hooks/useFeaturedCreators';

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
  is_sponsored?: boolean;
  sponsor_name?: string | null;
  sponsor_logo_url?: string | null;
  sponsor_logo?: string | null;
  min_status_tier?: string | null;
  status_tier_claims_cost?: Record<string, number> | null;
  campaign_id?: string | null;
  sponsor_enabled?: boolean;
  sponsor_link?: string | null;
  showcase_mode?: string | null;
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

const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

const tierColors: Record<string, string> = {
  bronze: 'bg-amber-700 text-white',
  silver: 'bg-gray-400 text-white',
  gold: 'bg-yellow-500 text-white',
  platinum: 'bg-slate-300 text-slate-800',
  diamond: 'bg-cyan-400 text-white',
};

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
  const { isAuthenticated, setShowAuthModal, setAuthMode } = useAuthContext();
  const Icon = categoryIcons[reward.category] || Gift;
  
  // Load featured creators for this reward
  const showcaseMode = reward.showcase_mode || 'default';
  const { creators: rewardCreators } = useRewardCreators(
    showcaseMode !== 'default' ? reward.id : undefined
  );
  const hasCreatorShowcase = showcaseMode !== 'default' && rewardCreators.length > 0;
  
  const isSponsored = reward.is_sponsored || reward.sponsor_enabled;
  const sponsorName = reward.sponsor_name;
  const sponsorLogo = reward.sponsor_logo_url || reward.sponsor_logo;
  
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

  const pricing = getRewardPriceForUser(rewardForPricing, userTier.tierName);
  const canClaim = isAuthenticated && isEligible && claimBalance >= pricing.price && pricing.price >= 0;
  const requiredTier = reward.min_status_tier ? getTierDisplayName(reward.min_status_tier) : null;
  const tierColorClass = reward.min_status_tier ? tierColors[reward.min_status_tier.toLowerCase()] || 'bg-amber-500 text-white' : '';

  const handleCtaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setAuthMode('signup');
      setShowAuthModal(true);
      return;
    }
    onClick();
  };

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-2xl",
        "rounded-xl border bg-card",
        "shadow-md",
        isSponsored 
          ? "border-amber-400/40 ring-1 ring-amber-400/20" 
          : "border-border/60"
      )}
      onClick={onClick}
    >
      {/* HERO IMAGE — large, prominent */}
      <div className="relative aspect-[4/3] sm:aspect-[4/3] w-full overflow-hidden">
        {hasCreatorShowcase && (showcaseMode === 'single' || showcaseMode === 'carousel') ? (
          <CreatorShowcase
            creators={rewardCreators}
            mode={showcaseMode as 'single' | 'carousel'}
            className="w-full h-full"
          />
        ) : reward.image_url ? (
          <ImageWithFallback
            src={reward.image_url}
            alt={reward.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Icon className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}

        {/* Dark gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* TOP-LEFT: Tier badge overlay */}
        {reward.min_status_tier && (
          <Badge className={cn(
            "absolute top-3 left-3 text-xs font-semibold shadow-lg border-0 px-2.5 py-1",
            tierColorClass
          )}>
            {isEligible ? getTierDisplayName(reward.min_status_tier) + '+' : (
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {getTierDisplayName(reward.min_status_tier)}
              </span>
            )}
          </Badge>
        )}

        {/* TOP-RIGHT: Favorites Heart */}
        <button
          className={cn(
            "absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center",
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
            className="absolute top-3 right-14 z-10 w-9 h-9 rounded-full flex items-center justify-center bg-amber-500/90 hover:bg-amber-600 backdrop-blur-md shadow-lg transition-all duration-200 hover:scale-110"
            onClick={(e) => {
              e.stopPropagation();
              onAdminEdit(reward.id);
            }}
          >
            <Pencil className="h-3.5 w-3.5 text-white" />
          </button>
        )}

        {/* BOTTOM of image: Title + Sponsor */}
        <div className="absolute left-0 right-0 bottom-0 p-4">
          {isSponsored && sponsorName && (
            <div className="flex items-center gap-1.5 mb-1.5">
              {sponsorLogo && (
                <img 
                  src={sponsorLogo} 
                  alt={sponsorName} 
                  className="h-3.5 w-auto max-w-[36px] object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <span className="text-[11px] text-white/70">
                Sponsored by <span className="font-medium text-amber-300">{sponsorName}</span>
              </span>
            </div>
          )}
          <h3 className="font-bold text-base sm:text-lg text-white leading-tight line-clamp-2 drop-shadow-lg">
            {reward.title}
          </h3>
        </div>
      </div>

      {/* CONTENT — Creators + Price + CTA */}
      <div className="p-3.5 space-y-2.5 bg-card">
        {/* Creator collage (when mode is collage) */}
        {hasCreatorShowcase && showcaseMode === 'collage' && (
          <CreatorShowcase creators={rewardCreators} mode="collage" size="sm" />
        )}
        
        {/* Creator handles */}
        {rewardCreators.length > 0 && showcaseMode !== 'default' && (
          <CreatorHandles creators={rewardCreators} max={2} />
        )}
        {/* Price row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {pricing.isFree ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-sm font-semibold px-2 py-0.5">
                FREE
              </Badge>
            ) : (
              <>
                <Coins className="w-4 h-4 text-primary" />
                <span className="text-lg font-bold text-foreground">{pricing.price}</span>
                <span className="text-sm text-muted-foreground">claims</span>
                {pricing.discount > 0 && (
                  <span className="text-sm text-muted-foreground line-through ml-1">{pricing.originalPrice}</span>
                )}
              </>
            )}
          </div>
          {remainingStock !== null && remainingStock <= 20 && remainingStock > 0 && (
            <span className={cn(
              "text-xs flex items-center gap-1",
              remainingStock <= 5 ? "text-orange-500 font-medium" : "text-muted-foreground"
            )}>
              <Package className="w-3 h-3" />
              {remainingStock} left
            </span>
          )}
        </div>

        {/* CTA Button */}
        <Button
          className={cn(
            "w-full font-semibold text-sm h-9",
            !isAuthenticated
              ? "bg-primary hover:bg-primary/90 text-primary-foreground"
              : !isEligible
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : canClaim
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
          )}
          onClick={handleCtaClick}
          disabled={isAuthenticated && !isEligible}
        >
          {!isAuthenticated ? (
            'Sign Up to Claim'
          ) : !isEligible ? (
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Unlock at {requiredTier}
            </span>
          ) : (
            'Claim Now'
          )}
        </Button>
      </div>
    </Card>
  );
}
