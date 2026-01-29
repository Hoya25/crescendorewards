import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Lock, Plus, RefreshCw, Heart, Star, Wrench, Calendar, Gift, Coins, AlertCircle, Infinity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GroundballReward } from '@/hooks/useGroundballStatus';

type SelectionState = 'available' | 'selected' | 'locked' | 'no-slots' | 'giveback' | 'redeemed';

interface GroundballRewardCardProps {
  reward: GroundballReward;
  state: SelectionState;
  onSelect: () => void;
  onSwap: () => void;
  onViewDetails: () => void;
  onHowToLevelUp: () => void;
  onGetBonusSlot: () => void;
  redeemedDate?: string;
}

// Tier styling configuration
const TIER_CONFIG = {
  any: { 
    label: 'All Members', 
    color: 'text-slate-300', 
    bgColor: 'bg-slate-600/30', 
    border: 'border-slate-500/40',
    emoji: '👤'
  },
  none: { 
    label: 'All Members', 
    color: 'text-slate-300', 
    bgColor: 'bg-slate-600/30', 
    border: 'border-slate-500/40',
    emoji: '👤'
  },
  bronze: { 
    label: 'Bronze', 
    color: 'text-[#CD7F32]', 
    bgColor: 'bg-[#CD7F32]/20', 
    border: 'border-[#CD7F32]/50',
    emoji: '🥉'
  },
  silver: { 
    label: 'Silver', 
    color: 'text-[#C0C0C0]', 
    bgColor: 'bg-[#C0C0C0]/20', 
    border: 'border-[#C0C0C0]/50',
    emoji: '🥈'
  },
  gold: { 
    label: 'Gold', 
    color: 'text-[#FFD700]', 
    bgColor: 'bg-[#FFD700]/20', 
    border: 'border-[#FFD700]/50',
    emoji: '🥇'
  },
};

// Category styling configuration
const CATEGORY_CONFIG: Record<string, { 
  icon: React.ElementType; 
  label: string; 
  color: string; 
  bgColor: string; 
  accentBorder: string;
  gradientFrom: string;
}> = {
  experiences: { 
    icon: Star, 
    label: 'Experience', 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500/20', 
    accentBorder: 'border-l-amber-500',
    gradientFrom: 'from-amber-900/40'
  },
  gear: { 
    icon: Wrench, 
    label: 'Gear', 
    color: 'text-sky-400', 
    bgColor: 'bg-sky-500/20', 
    accentBorder: 'border-l-sky-500',
    gradientFrom: 'from-sky-900/40'
  },
  'give-back': { 
    icon: Heart, 
    label: 'Give-Back', 
    color: 'text-emerald-400', 
    bgColor: 'bg-emerald-500/20', 
    accentBorder: 'border-l-emerald-500',
    gradientFrom: 'from-emerald-900/40'
  },
  giveback: { 
    icon: Heart, 
    label: 'Give-Back', 
    color: 'text-emerald-400', 
    bgColor: 'bg-emerald-500/20', 
    accentBorder: 'border-l-emerald-500',
    gradientFrom: 'from-emerald-900/40'
  },
};

const CADENCE_CONFIG: Record<string, { label: string; shortLabel: string }> = {
  daily: { label: 'Daily', shortLabel: 'Daily' },
  monthly: { label: 'Monthly', shortLabel: 'Mo.' },
  quarterly: { label: 'Quarterly', shortLabel: 'Qtr.' },
  annual: { label: 'Annual', shortLabel: 'Yr.' },
  one_time: { label: 'One-Time', shortLabel: '1x' },
};

export function GroundballRewardCard({
  reward,
  state,
  onSelect,
  onSwap,
  onViewDetails,
  onHowToLevelUp,
  onGetBonusSlot,
  redeemedDate,
}: GroundballRewardCardProps) {
  const requiredStatus = reward.required_status || 'any';
  const tierConfig = TIER_CONFIG[requiredStatus as keyof typeof TIER_CONFIG] || TIER_CONFIG.any;
  const category = reward.is_giveback ? 'give-back' : (reward.category?.toLowerCase() || 'gear');
  const categoryConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.gear;
  const cadence = reward.cadence || 'monthly';
  const cadenceConfig = CADENCE_CONFIG[cadence] || CADENCE_CONFIG.monthly;
  const isGiveback = reward.is_giveback || category === 'give-back' || category === 'giveback';
  const CategoryIcon = categoryConfig.icon;
  
  // Calculate remaining quantity
  const isLimited = reward.is_limited;
  const quantityAvailable = reward.quantity_available || 0;
  const quantityClaimed = reward.quantity_claimed || 0;
  const remaining = quantityAvailable - quantityClaimed;
  
  // Sponsor info
  const sponsorName = reward.sponsor_name || reward.sponsor;
  
  // Claims cost
  const claimsCost = reward.claims_cost || 25;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 border-l-4 flex flex-col',
        categoryConfig.accentBorder,
        state === 'locked' && 'opacity-50',
        state !== 'locked' && 'hover:scale-[1.02] hover:shadow-xl',
        state === 'selected' && 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20',
        state === 'redeemed' && 'opacity-75',
        isGiveback && 'bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 border-emerald-500/40',
        !isGiveback && category === 'experiences' && 'bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900',
        !isGiveback && category === 'gear' && 'bg-gradient-to-br from-slate-900 via-sky-950/20 to-slate-900',
      )}
    >
      {/* ============ HEADER SECTION ============ */}
      <div className={cn(
        "relative px-4 pt-4 pb-3",
        `bg-gradient-to-b ${categoryConfig.gradientFrom} to-transparent`
      )}>
        {/* Category Badge - Top Left */}
        <div className="flex items-center justify-between mb-2">
          <Badge className={cn(
            "text-xs font-semibold px-2 py-0.5",
            categoryConfig.bgColor,
            categoryConfig.color,
            "border-0"
          )}>
            <CategoryIcon className="w-3 h-3 mr-1" />
            {categoryConfig.label}
          </Badge>
          
          {/* Featured Badge */}
          {reward.is_featured && state !== 'locked' && (
            <Badge className="bg-amber-500/90 text-white text-xs border-0 shadow-lg">
              ⭐ Featured
            </Badge>
          )}
          
          {/* Selected Indicator */}
          {state === 'selected' && (
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
          )}
          
          {/* Lock Icon for locked rewards */}
          {state === 'locked' && (
            <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center">
              <Lock className="w-3 h-3 text-slate-400" />
            </div>
          )}
        </div>
        
        {/* Emoji + Title Row */}
        <div className="flex items-start gap-3">
          <span className={cn(
            "text-4xl transition-transform group-hover:scale-110 flex-shrink-0",
            state === 'locked' && "grayscale opacity-60"
          )}>
            {reward.image_emoji || '🎁'}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-bold text-base leading-tight line-clamp-2",
              state === 'locked' ? 'text-slate-400' : 'text-white'
            )}>
              {reward.title}
            </h3>
          </div>
        </div>
      </div>

      {/* ============ BODY SECTION ============ */}
      <CardContent className="px-4 pb-3 pt-0 flex-1 flex flex-col gap-2">
        {/* Description */}
        {reward.description && (
          <p className="text-[13px] text-slate-400 line-clamp-3 leading-relaxed">
            {reward.description}
          </p>
        )}
        
        {/* Sponsor Attribution */}
        {sponsorName && state !== 'locked' && (
          <p className="text-xs text-slate-500 italic">
            Sponsored by <span className="text-emerald-400 font-medium not-italic">{sponsorName}</span>
          </p>
        )}
        
        {/* Give-back slot notice */}
        {isGiveback && state !== 'locked' && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1.5 rounded-md border border-emerald-500/20">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span className="font-medium">Doesn't use a selection slot</span>
          </div>
        )}
        
        {/* Spacer to push footer to bottom */}
        <div className="flex-1" />
      </CardContent>

      {/* ============ FOOTER SECTION ============ */}
      <div className="px-4 pb-4 space-y-3">
        {/* Info Badges Row */}
        <div className="flex flex-wrap gap-1.5">
          {/* Tier Requirement Badge */}
          <Badge 
            variant="outline" 
            className={cn(
              'text-xs font-semibold px-2 py-0.5',
              tierConfig.bgColor,
              tierConfig.border,
              tierConfig.color
            )}
          >
            {tierConfig.emoji} {tierConfig.label}
          </Badge>
          
          {/* Claims Cost */}
          <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400 bg-amber-500/10 font-semibold px-2 py-0.5">
            <Coins className="w-3 h-3 mr-1" />
            {claimsCost} Claims
          </Badge>
          
          {/* Cadence Badge */}
          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300 bg-slate-800/50 px-2 py-0.5">
            <Calendar className="w-3 h-3 mr-1" />
            {cadenceConfig.label}
          </Badge>
        </div>
        
        {/* Limited Availability Indicator */}
        {isLimited && quantityAvailable > 0 && state !== 'locked' && (
          <div className="flex items-center gap-1.5 text-xs">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className={cn(
              "font-medium",
              remaining <= 5 ? "text-red-400" : remaining <= 20 ? "text-amber-400" : "text-slate-400"
            )}>
              Limited: {remaining} of {quantityAvailable} remaining
            </span>
          </div>
        )}
        
        {/* Unlimited for give-back */}
        {isGiveback && !isLimited && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <Infinity className="w-3.5 h-3.5" />
            <span className="font-medium">∞ Available</span>
          </div>
        )}
        
        {/* Redeemed Date */}
        {state === 'redeemed' && redeemedDate && (
          <p className="text-xs text-slate-400">
            Claimed on {new Date(redeemedDate).toLocaleDateString()}
          </p>
        )}
        
        {/* ============ ACTION BUTTONS ============ */}
        <div className="pt-2 border-t border-slate-700/50">
          {state === 'available' && (
            <Button
              onClick={onSelect}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-lg shadow-amber-500/25"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Select
            </Button>
          )}
          
          {state === 'giveback' && (
            <Button
              onClick={onSelect}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20"
              size="sm"
            >
              <Heart className="w-4 h-4 mr-1.5 fill-current" />
              Activate Give-Back
            </Button>
          )}
          
          {state === 'selected' && (
            <div className="flex gap-2">
              <Button
                onClick={onViewDetails}
                variant="outline"
                className="flex-1 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 font-medium"
                size="sm"
              >
                View Details
              </Button>
              <Button
                onClick={onSwap}
                variant="outline"
                className="flex-1 border-slate-600 hover:bg-slate-800 font-medium"
                size="sm"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Swap
              </Button>
            </div>
          )}
          
          {state === 'redeemed' && (
            <Button
              onClick={onViewDetails}
              variant="outline"
              className="w-full border-slate-600 text-slate-400"
              size="sm"
            >
              View Redemption Details
            </Button>
          )}
          
          {state === 'no-slots' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 text-center">All selection slots filled</p>
              <div className="flex gap-2">
                <Button
                  onClick={onSwap}
                  variant="outline"
                  className="flex-1 border-slate-600 text-xs"
                  size="sm"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Swap Another
                </Button>
                <Button
                  onClick={onGetBonusSlot}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-xs font-medium"
                  size="sm"
                >
                  Get Bonus Slot
                </Button>
              </div>
            </div>
          )}
          
          {state === 'locked' && (
            <div className="space-y-2">
              <Button
                onClick={onHowToLevelUp}
                variant="outline"
                className={cn(
                  "w-full font-medium",
                  tierConfig.border,
                  tierConfig.color,
                  "hover:bg-slate-800"
                )}
                size="sm"
              >
                <Lock className="w-3 h-3 mr-1.5" />
                Unlock at {tierConfig.label}
              </Button>
              <p className="text-xs text-center text-slate-500">
                {requiredStatus === 'bronze' && 'Lock 100 $GBS to unlock'}
                {requiredStatus === 'silver' && 'Lock 250 $GBS to unlock'}
                {requiredStatus === 'gold' && 'Lock 500 $GBS to unlock'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default GroundballRewardCard;
