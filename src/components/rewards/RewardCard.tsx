import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { RewardPlaceholderCard } from '@/components/rewards/RewardPlaceholderCard';
import { SponsorBadge } from '@/components/rewards/SponsorBadge';
import { 
  Gift, Sparkles, ShoppingBag, CreditCard, Coins, ZoomIn, 
  Lock, AlertTriangle, Package, Flame, Clock, Heart, Pencil,
  Bell, BellOff, Eye, Check, Percent
} from 'lucide-react';
import { getRewardPriceForUser } from '@/utils/getRewardPrice';

export interface RewardCardData {
  id: string;
  title: string;
  description: string;
  category: string;
  cost: number;
  image_url: string | null;
  stock_quantity: number | null;
  is_active: boolean;
  is_featured: boolean;
  token_gated?: boolean | null;
  token_name?: string | null;
  token_symbol?: string | null;
  minimum_token_balance?: number | null;
  brand_id?: string | null;
  brand_name?: string | null;
  // Sponsorship fields
  sponsor_enabled?: boolean;
  sponsor_name?: string | null;
  sponsor_logo?: string | null;
  sponsor_link?: string | null;
  sponsor_start_date?: string | null;
  sponsor_end_date?: string | null;
  // Tier pricing fields
  is_sponsored?: boolean | null;
  status_tier_claims_cost?: Record<string, number> | null;
  min_status_tier?: string | null;
}

const categoryIcons = {
  alliance_tokens: Coins,
  experiences: Sparkles,
  merch: ShoppingBag,
  gift_cards: CreditCard,
  wellness: Heart,
};

interface RewardCardProps {
  reward: RewardCardData;
  isInWishlist: boolean;
  onToggleWishlist: (rewardId: string, e: React.MouseEvent) => void;
  onImageZoom: (imageUrl: string, e: React.MouseEvent) => void;
  onClick: () => void;
  isAnimatingHeart?: boolean;
  claimBalance?: number;
  isAdmin?: boolean;
  onAdminEdit?: (rewardId: string) => void;
  // Watchlist props
  isWatching?: boolean;
  onToggleWatch?: (rewardId: string, e: React.MouseEvent) => void;
  isAnimatingWatch?: boolean;
  watchCount?: number;
  // Tier-based pricing props
  userTier?: string;
}

export function RewardCard({
  reward,
  isInWishlist,
  onToggleWishlist,
  onImageZoom,
  onClick,
  isAnimatingHeart = false,
  claimBalance = 0,
  isAdmin = false,
  onAdminEdit,
  isWatching = false,
  onToggleWatch,
  isAnimatingWatch = false,
  watchCount = 0,
  userTier = 'droplet',
}: RewardCardProps) {
  const Icon = categoryIcons[reward.category as keyof typeof categoryIcons] || Gift;
  
  // Calculate tier-based pricing
  const tierPricing = getRewardPriceForUser(
    { id: reward.id, cost: reward.cost, is_sponsored: reward.is_sponsored, status_tier_claims_cost: reward.status_tier_claims_cost },
    userTier
  );
  
  const affordable = claimBalance >= tierPricing.price;
  const outOfStock = reward.stock_quantity !== null && reward.stock_quantity <= 0;
  const stockPercentage = reward.stock_quantity !== null ? (reward.stock_quantity / 100) * 100 : 100;

  // Define customized rewards that should show "Limited" badge
  const limitedRewardIds = [
    '796f68d6-7765-448c-a588-a1d95565a0cf',
    '72f47f23-1309-4632-bae0-0c749a2b1c26'
  ];

  return (
    <Card
      className="group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl overflow-hidden"
      onClick={onClick}
    >
      <div className="relative w-full h-56 bg-gradient-to-br from-muted/50 to-muted/20">
        {reward.image_url ? (
          <ImageWithFallback
            src={reward.image_url}
            alt={reward.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <RewardPlaceholderCard title={reward.title} category={reward.category} />
        )}

        {/* Badge Stack - Top Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {/* Community Contributed Badge */}
          {(reward as any).is_contributed && (
            <Badge className="bg-primary/20 text-primary backdrop-blur-sm border-0 shadow-lg text-xs flex items-center gap-1">
              <Gift className="h-3 w-3" />
              Community
            </Badge>
          )}
          {/* Status Access Badge */}
          {reward.min_status_tier && (() => {
            const tierHexColors: Record<string, string> = {
              bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FFD700', platinum: '#E5E4E2', diamond: '#B9F2FF'
            };
            const tierTextClass: Record<string, string> = {
              bronze: 'text-white', silver: 'text-gray-800', gold: 'text-gray-900', platinum: 'text-gray-800', diamond: 'text-gray-900'
            };
            const tierEmojis: Record<string, string> = {
              bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎', diamond: '👑'
            };
            const bgColor = tierHexColors[reward.min_status_tier] || '#CD7F32';
            const textClass = tierTextClass[reward.min_status_tier] || 'text-white';
            const emoji = tierEmojis[reward.min_status_tier] || '🥉';
            return (
              <Badge 
                className={`backdrop-blur-sm border-0 shadow-lg text-xs ${textClass}`}
                style={{ backgroundColor: bgColor }}
              >
                {emoji}
                <span className="ml-1 capitalize">{reward.min_status_tier}+</span>
              </Badge>
            );
          })()}
          {reward.token_gated && reward.token_symbol && (
            <Badge className="bg-purple-500/90 text-white backdrop-blur-sm border-0 shadow-lg text-xs">
              <Lock className="w-3 h-3 mr-1" />
              {reward.minimum_token_balance}+ {reward.token_symbol}
            </Badge>
          )}
          {reward.cost === 0 && (
            <Badge className="bg-green-500/90 text-white backdrop-blur-sm border-0 shadow-lg text-xs">
              <Gift className="w-3 h-3 mr-1" />
              FREE
            </Badge>
          )}
          {limitedRewardIds.includes(reward.id) && (
            <Badge className="bg-orange-500/90 text-white backdrop-blur-sm border-0 shadow-lg text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Limited
            </Badge>
          )}
          {outOfStock && (
            <Badge className="bg-destructive/90 backdrop-blur-sm border-0 shadow-lg text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Limited
            </Badge>
          )}
          {reward.category === 'experiences' && !limitedRewardIds.includes(reward.id) && (
            <Badge className="bg-orange-500/90 text-white backdrop-blur-sm border-0 shadow-lg text-xs">
              <Flame className="w-3 h-3 mr-1" />
              Trending
            </Badge>
          )}
        </div>

        {/* Admin Edit Button - Top Right (before heart) */}
        {isAdmin && onAdminEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-14 z-10 bg-amber-500/90 hover:bg-amber-600 backdrop-blur-sm h-9 w-9 rounded-full shadow-lg border-0 text-white"
            onClick={(e) => {
              e.stopPropagation();
              onAdminEdit(reward.id);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}

        {/* Wishlist Heart Button - Top Right */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 z-10 bg-background/90 hover:bg-background backdrop-blur-sm h-9 w-9 rounded-full shadow-lg border border-border/20"
          onClick={(e) => onToggleWishlist(reward.id, e)}
        >
          <Heart
            className={`h-5 w-5 transition-colors ${
              isInWishlist
                ? 'fill-red-500 text-red-500'
                : 'text-muted-foreground'
            } ${isAnimatingHeart ? 'animate-heart-bounce' : ''}`}
          />
        </Button>

        {/* Cost Badge - Bottom Left */}
        <div className="absolute bottom-3 left-3 flex flex-col gap-1 items-start">
          {tierPricing.discount > 0 && (
            <Badge className="bg-emerald-500/90 text-white backdrop-blur-sm border-0 shadow-lg text-xs">
              <Percent className="w-3 h-3 mr-1" />
              {tierPricing.discount}% Off
            </Badge>
          )}
          <Badge className="bg-background/90 backdrop-blur-sm border border-primary/20 text-primary font-bold shadow-lg">
            <Coins className="w-3 h-3 mr-1" />
            {tierPricing.isFree ? 'FREE' : tierPricing.price}
            {tierPricing.discount > 0 && (
              <span className="ml-1 line-through text-muted-foreground text-xs font-normal">
                {tierPricing.originalPrice}
              </span>
            )}
          </Badge>
        </div>

        {/* Zoom Button */}
        {reward.image_url && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-3 right-3 z-10 bg-background/90 hover:bg-background backdrop-blur-sm h-9 w-9 rounded-full shadow-lg border border-border/20 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => onImageZoom(reward.image_url!, e)}
          >
            <ZoomIn className="w-4 h-4 text-primary" />
          </Button>
        )}
      </div>

      <CardContent className="p-6 space-y-4">

        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {reward.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{reward.description}</p>
        </div>

        {/* Stock Info */}
        {reward.stock_quantity !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                {reward.stock_quantity}/100 left
              </span>
              <span>{Math.round(stockPercentage)}%</span>
            </div>
            <Progress value={stockPercentage} className="h-1.5" />
          </div>
        )}

        {/* Watching Count Badge */}
        {outOfStock && watchCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1.5">
            <Eye className="w-3 h-3" />
            <span>{watchCount} {watchCount === 1 ? 'person' : 'people'} watching</span>
          </div>
        )}

        {/* Action Button */}
        {outOfStock ? (
          <Button
            className={`w-full transition-all ${isAnimatingWatch ? 'scale-95' : ''}`}
            variant={isWatching ? "secondary" : "outline"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatch?.(reward.id, e);
            }}
          >
            {isWatching ? (
              <>
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Watching
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Notify Me
              </>
            )}
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={affordable ? "default" : "secondary"}
            disabled={!affordable}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            {affordable ? (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Claim Reward
              </>
            ) : 'Insufficient Balance'}
          </Button>
        )}

        {/* Delivery Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
          <Clock className="w-3 h-3" />
          <span>Delivery: Within 24 hours</span>
        </div>

        {/* Sponsor Badge */}
        {reward.sponsor_enabled && (
          <div className="pt-2">
            <SponsorBadge
              sponsorData={{
                sponsor_enabled: reward.sponsor_enabled,
                sponsor_name: reward.sponsor_name || null,
                sponsor_logo: reward.sponsor_logo || null,
                sponsor_link: reward.sponsor_link || null,
                sponsor_start_date: reward.sponsor_start_date || null,
                sponsor_end_date: reward.sponsor_end_date || null,
              }}
              variant="card"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
