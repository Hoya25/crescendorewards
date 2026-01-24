import { Badge } from '@/components/ui/badge';
import { Coins, Lock, ArrowUpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getRewardPriceForUser, 
  canUserClaimReward, 
  getTierDisplayName,
  type Reward,
  type PriceResult,
  type ClaimEligibility
} from '@/utils/getRewardPrice';
import { Link } from 'react-router-dom';
import { STATUS_TIERS, TIER_EMOJIS } from '@/constants/rewards';

interface RewardPriceDisplayProps {
  reward: Reward;
  userTier: string;
  userBalance?: number;
  size?: 'sm' | 'md' | 'lg';
  showTierBenefit?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: {
    price: 'text-lg font-bold',
    free: 'text-xl font-black',
    original: 'text-xs',
    badge: 'text-[10px]',
    label: 'text-xs',
    icon: 'w-3 h-3',
  },
  md: {
    price: 'text-xl font-bold',
    free: 'text-2xl font-black',
    original: 'text-sm',
    badge: 'text-xs',
    label: 'text-sm',
    icon: 'w-4 h-4',
  },
  lg: {
    price: 'text-3xl font-bold',
    free: 'text-4xl font-black',
    original: 'text-base',
    badge: 'text-sm',
    label: 'text-base',
    icon: 'w-5 h-5',
  },
};

export function RewardPriceDisplay({
  reward,
  userTier,
  userBalance = 0,
  size = 'md',
  showTierBenefit = true,
  className,
}: RewardPriceDisplayProps) {
  const styles = sizeStyles[size];
  const pricing = getRewardPriceForUser(reward, userTier);
  const eligibility = canUserClaimReward(reward, userTier, userBalance);
  
  const tierDisplayName = getTierDisplayName(userTier);
  const isLocked = !eligibility.canClaim && eligibility.reason?.includes('Requires');

  // Locked state - user tier too low
  if (isLocked) {
    const requiredTier = reward.min_status_tier 
      ? getTierDisplayName(reward.min_status_tier)
      : 'higher tier';
    
    return (
      <div className={cn('space-y-1', className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Lock className={styles.icon} />
          <span className={cn(styles.price, 'text-muted-foreground')}>
            Unlock at {requiredTier}
          </span>
        </div>
        <Link 
          to="/membership" 
          className={cn(styles.label, 'text-primary hover:underline flex items-center gap-1')}
        >
          <ArrowUpCircle className="w-3 h-3" />
          How to level up
        </Link>
      </div>
    );
  }

  // FREE for user's tier - show tier name + Benefit instead of FREE
  if (pricing.isFree) {
    const tierEmoji = TIER_EMOJIS[userTier.toLowerCase()] || '✓';
    
    return (
      <div className={cn('space-y-1', className)}>
        <Badge 
          variant="outline" 
          className={cn(
            styles.badge, 
            'text-emerald-600 border-emerald-500/30 bg-emerald-500/10 px-2 py-1'
          )}
        >
          {tierDisplayName} {tierEmoji} Benefit
        </Badge>
        {pricing.originalPrice > 0 && showTierBenefit && (
          <p className={cn(styles.original, 'text-muted-foreground')}>
            Normally {pricing.originalPrice} claims
          </p>
        )}
      </div>
    );
  }

  // Discounted for user's tier
  if (pricing.discount > 0) {
    return (
      <div className={cn('space-y-1', className)}>
        <div className="flex items-center gap-2">
          <span className={cn(styles.price, 'text-primary flex items-center')}>
            <Coins className={cn(styles.icon, 'mr-1')} />
            {pricing.price}
          </span>
          <span className={cn(styles.original, 'text-muted-foreground line-through')}>
            {pricing.originalPrice}
          </span>
        </div>
        {showTierBenefit && (
          <Badge 
            variant="secondary" 
            className={cn(
              styles.badge, 
              'bg-emerald-500/10 text-emerald-600 border-0'
            )}
          >
            Save {pricing.discount}% as {tierDisplayName}
          </Badge>
        )}
      </div>
    );
  }

  // Regular price - no discount
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-1">
        <Coins className={cn(styles.icon, 'text-primary')} />
        <span className={cn(styles.price, 'text-primary')}>{pricing.price}</span>
        <span className={cn(styles.label, 'text-muted-foreground ml-1')}>claims</span>
      </div>
      <p className={cn(styles.label, 'text-muted-foreground flex items-center gap-1')}>
        🎫 {pricing.price} Claim{pricing.price !== 1 ? 's' : ''} required
      </p>
    </div>
  );
}

// Compact version for card display
export function RewardPriceCompact({
  reward,
  userTier,
  className,
}: {
  reward: Reward;
  userTier: string;
  className?: string;
}) {
  const pricing = getRewardPriceForUser(reward, userTier);
  const tierDisplayName = getTierDisplayName(userTier);
  const tierEmoji = TIER_EMOJIS[userTier.toLowerCase()] || '✓';
  
  // Check if locked - use metal tier order
  const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const normalizedUserTier = userTier.toLowerCase();
  const normalizedMinTier = reward.min_status_tier?.toLowerCase() || '';
  const userTierIndex = TIER_ORDER.indexOf(normalizedUserTier);
  const requiredTierIndex = TIER_ORDER.indexOf(normalizedMinTier);
  const isLocked = normalizedMinTier && userTierIndex !== -1 && requiredTierIndex !== -1 && userTierIndex < requiredTierIndex;

  if (isLocked) {
    return (
      <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
        <Lock className="w-4 h-4" />
        <span className="text-sm font-medium">
          Unlock at {getTierDisplayName(reward.min_status_tier || '')}
        </span>
      </div>
    );
  }

  // FREE for user's tier - show tier name + emoji + Benefit
  if (pricing.isFree) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10 text-sm px-2 py-1">
          {tierDisplayName} {tierEmoji} Benefit
        </Badge>
      </div>
    );
  }

  if (pricing.discount > 0) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="text-xl font-bold text-primary flex items-center">
          <Coins className="w-4 h-4 mr-1" />
          {pricing.price}
        </span>
        <span className="text-sm text-muted-foreground line-through">
          {pricing.originalPrice}
        </span>
        <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600">
          {tierDisplayName} Price
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Coins className="w-4 h-4 text-primary" />
      <span className="text-xl font-bold text-primary">{pricing.price}</span>
      <span className="text-sm text-muted-foreground ml-1">claims</span>
    </div>
  );
}
