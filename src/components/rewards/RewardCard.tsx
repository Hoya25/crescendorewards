import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { 
  Gift, Sparkles, ShoppingBag, CreditCard, Coins, ZoomIn, 
  Lock, AlertTriangle, Package, Flame, Clock, Heart, Pencil 
} from 'lucide-react';

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
}: RewardCardProps) {
  const Icon = categoryIcons[reward.category as keyof typeof categoryIcons] || Gift;
  const affordable = claimBalance >= reward.cost;
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
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}

        {/* Badge Stack - Top Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
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
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-background/90 backdrop-blur-sm border border-primary/20 text-primary font-bold shadow-lg">
            <Coins className="w-3 h-3 mr-1" />
            {reward.cost}
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
        {/* Brand Avatar */}
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {reward.brand_name ? reward.brand_name.substring(0, 1) : reward.title.substring(0, 1)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {reward.brand_name ? `From ${reward.brand_name}` : 'by Partner Brand'}
            </p>
          </div>
        </div>

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

        {/* Action Button */}
        <Button
          className="w-full"
          variant={affordable && !outOfStock ? "default" : "secondary"}
          disabled={!affordable || outOfStock}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          {outOfStock ? 'Out of Stock' : affordable ? (
            <>
              <Gift className="w-4 h-4 mr-2" />
              Claim Reward
            </>
          ) : 'Insufficient Balance'}
        </Button>

        {/* Delivery Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
          <Clock className="w-3 h-3" />
          <span>Delivery: Within 24 hours</span>
        </div>
      </CardContent>
    </Card>
  );
}
