import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { 
  X, Star, Package, Coins, Gift, Heart, Lock, CheckCircle2, 
  AlertTriangle, Sparkles, ShoppingBag, CreditCard, Trophy, Eye
} from 'lucide-react';
import { STATUS_TIERS, CATEGORY_LABELS, TIER_BADGES, getCategoryIcon } from '@/constants/rewards';
import { cn } from '@/lib/utils';
import type { DeliveryMethod } from '@/types/delivery';
import { DELIVERY_METHOD_LABELS } from '@/types/delivery';

interface RewardData {
  id?: string;
  title: string;
  description: string;
  category: string;
  cost: number;
  stock_quantity: number | null;
  image_url: string | null;
  is_featured: boolean;
  sponsor_enabled: boolean;
  sponsor_name: string | null;
  sponsor_logo: string | null;
  min_status_tier: string | null;
  status_tier_claims_cost: Record<string, number> | null;
  delivery_method: DeliveryMethod | null;
  delivery_instructions: string | null;
  token_gated?: boolean;
  token_name?: string | null;
  minimum_token_balance?: number;
}

interface RewardPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  reward: RewardData | null;
  imagePreviews?: string[];
}

export function RewardPreviewDialog({ 
  open, 
  onClose, 
  reward,
  imagePreviews = []
}: RewardPreviewDialogProps) {
  const [previewTier, setPreviewTier] = useState<string>('bronze');

  if (!reward) return null;

  const CategoryIcon = getCategoryIcon(reward.category);
  const categoryLabel = CATEGORY_LABELS[reward.category] || reward.category;
  
  // Calculate price for selected tier
  const getTierPrice = (): number => {
    if (reward.status_tier_claims_cost && reward.status_tier_claims_cost[previewTier] !== undefined) {
      return reward.status_tier_claims_cost[previewTier];
    }
    return reward.cost;
  };

  const tierPrice = getTierPrice();
  const isFree = tierPrice === 0;
  const tierInfo = STATUS_TIERS.find(t => t.value === previewTier);
  const tierBadge = TIER_BADGES[previewTier] || TIER_BADGES.bronze;

  // Check tier eligibility
  const checkTierEligibility = (): { eligible: boolean; message: string } => {
    if (!reward.min_status_tier || reward.min_status_tier === 'none') {
      return { eligible: true, message: 'Available to all members' };
    }
    
    const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const requiredIndex = tierOrder.indexOf(reward.min_status_tier);
    const userIndex = tierOrder.indexOf(previewTier);
    
    if (userIndex >= requiredIndex) {
      return { eligible: true, message: `Available for ${tierBadge.label} members` };
    }
    
    return { 
      eligible: false, 
      message: `Requires ${TIER_BADGES[reward.min_status_tier]?.label || reward.min_status_tier} or higher` 
    };
  };

  const eligibility = checkTierEligibility();

  // Display image - prefer preview, fall back to existing
  const displayImage = imagePreviews.length > 0 ? imagePreviews[0] : reward.image_url;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-muted-foreground" />
              <DialogTitle>Reward Preview</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <DialogDescription>
            Preview how this reward appears to users based on their membership tier
          </DialogDescription>
        </DialogHeader>

        {/* Tier Selector */}
        <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Preview as tier:</span>
          </div>
          <Select value={previewTier} onValueChange={setPreviewTier}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_TIERS.map((tier) => (
                <SelectItem key={tier.value} value={tier.value}>
                  <span className="flex items-center gap-2">
                    <span>{tier.emoji}</span>
                    <span>{tier.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preview Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
              {displayImage ? (
                <ImageWithFallback
                  src={displayImage}
                  alt={reward.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <CategoryIcon className="w-24 h-24 text-muted-foreground/30" />
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {reward.is_featured && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 shadow-lg">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {reward.sponsor_enabled && reward.sponsor_name && (
                  <Badge className="bg-primary text-primary-foreground border-0 shadow-lg">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Sponsored
                  </Badge>
                )}
                {!eligibility.eligible && (
                  <Badge variant="destructive" className="shadow-lg">
                    <Lock className="w-3 h-3 mr-1" />
                    Tier Locked
                  </Badge>
                )}
              </div>
            </div>

            {/* Additional Image Thumbnails */}
            {imagePreviews.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {imagePreviews.map((img, idx) => (
                  <div 
                    key={idx} 
                    className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 border-border"
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Title & Category */}
            <div>
              <Badge variant="secondary" className="mb-2">
                <CategoryIcon className="w-3 h-3 mr-1" />
                {categoryLabel}
              </Badge>
              <h2 className="text-2xl font-bold">{reward.title}</h2>
            </div>

            {/* Sponsor Attribution */}
            {reward.sponsor_enabled && reward.sponsor_name && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                {reward.sponsor_logo && (
                  <img 
                    src={reward.sponsor_logo} 
                    alt={reward.sponsor_name}
                    className="h-6 w-auto object-contain"
                  />
                )}
                <span className="text-sm">
                  Sponsored by <span className="font-semibold text-amber-600 dark:text-amber-400">{reward.sponsor_name}</span>
                </span>
              </div>
            )}

            {/* Pricing Card */}
            <Card className={cn(
              "border-2",
              isFree ? "border-emerald-500/50 bg-emerald-500/5" : "border-primary/30"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Price for {tierInfo?.emoji} {tierInfo?.label}
                  </span>
                  {reward.status_tier_claims_cost && (
                    <Badge variant="outline" className="text-xs">
                      Tier Pricing Active
                    </Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  {isFree ? (
                    <span className="text-3xl font-bold text-emerald-600">FREE</span>
                  ) : (
                    <>
                      <Coins className="w-6 h-6 text-primary" />
                      <span className="text-3xl font-bold">{tierPrice}</span>
                      <span className="text-muted-foreground">Claims</span>
                    </>
                  )}
                </div>

                {/* Show all tier prices if tier pricing is enabled */}
                {reward.status_tier_claims_cost && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">All tier prices:</p>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_TIERS.map((tier) => {
                        const price = reward.status_tier_claims_cost?.[tier.value] ?? reward.cost;
                        const isCurrentTier = tier.value === previewTier;
                        return (
                          <Badge 
                            key={tier.value} 
                            variant={isCurrentTier ? "default" : "outline"}
                            className={cn("gap-1", isCurrentTier && "ring-2 ring-primary/50")}
                          >
                            {tier.emoji}
                            {price === 0 ? 'FREE' : price}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Eligibility Status */}
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-lg",
              eligibility.eligible 
                ? "bg-green-500/10 text-green-700 dark:text-green-400" 
                : "bg-red-500/10 text-red-700 dark:text-red-400"
            )}>
              {eligibility.eligible ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{eligibility.message}</span>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{reward.description}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground block mb-1">Stock</span>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span className="font-medium">
                    {reward.stock_quantity !== null ? `${reward.stock_quantity} available` : 'Unlimited'}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground block mb-1">Delivery</span>
                <span className="font-medium">
                  {reward.delivery_method ? DELIVERY_METHOD_LABELS[reward.delivery_method]?.label : 'Email'}
                </span>
              </div>
            </div>

            {/* Token Gate Warning */}
            {reward.token_gated && reward.token_name && (
              <div className="flex items-center gap-2 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                <Lock className="w-5 h-5 text-purple-600" />
                <span className="text-sm">
                  Requires <span className="font-semibold">{reward.minimum_token_balance} {reward.token_name}</span> tokens
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
