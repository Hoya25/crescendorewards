import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Lock, Plus, RefreshCw, Heart, Star, Wrench, Calendar, Gift } from 'lucide-react';
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

const STATUS_CONFIG = {
  any: { emoji: '💚', label: 'All Members', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
  bronze: { emoji: '🥉', label: 'Bronze', color: 'text-orange-400', bgColor: 'bg-orange-500/20', border: 'border-orange-500/30' },
  silver: { emoji: '🥈', label: 'Silver', color: 'text-slate-300', bgColor: 'bg-slate-400/20', border: 'border-slate-400/30' },
  gold: { emoji: '🥇', label: 'Gold', color: 'text-amber-400', bgColor: 'bg-amber-500/20', border: 'border-amber-500/30' },
};

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string; bgColor: string; accentBorder: string }> = {
  experiences: { icon: Star, label: 'Experience', color: 'text-amber-400', bgColor: 'bg-amber-500/20', accentBorder: 'border-l-amber-500' },
  gear: { icon: Wrench, label: 'Gear', color: 'text-sky-400', bgColor: 'bg-sky-500/20', accentBorder: 'border-l-sky-500' },
  'give-back': { icon: Heart, label: 'Give-Back', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', accentBorder: 'border-l-emerald-500' },
};

const CADENCE_CONFIG: Record<string, { label: string; icon: string }> = {
  daily: { label: 'Daily', icon: '📅' },
  monthly: { label: 'Monthly', icon: '🗓️' },
  quarterly: { label: 'Quarterly', icon: '📆' },
  annual: { label: 'Annual', icon: '🎊' },
  one_time: { label: 'One-Time', icon: '🎁' },
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
  const statusConfig = STATUS_CONFIG[requiredStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.any;
  const category = reward.category?.toLowerCase() || 'gear';
  const categoryConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.gear;
  const cadence = reward.cadence || 'monthly';
  const cadenceConfig = CADENCE_CONFIG[cadence] || CADENCE_CONFIG.monthly;
  const isGiveback = reward.is_giveback;
  const CategoryIcon = categoryConfig.icon;

  // Determine card styling based on category
  const getCategoryCardStyle = () => {
    if (state === 'locked') return 'opacity-60';
    if (isGiveback || category === 'give-back') {
      return 'bg-gradient-to-br from-slate-900/80 via-emerald-950/30 to-slate-900/80 border-emerald-500/40';
    }
    if (category === 'experiences') {
      return 'bg-gradient-to-br from-slate-900/80 via-amber-950/20 to-slate-900/80 border-amber-500/30';
    }
    if (category === 'gear') {
      return 'bg-gradient-to-br from-slate-900/80 via-sky-950/20 to-slate-900/80 border-sky-500/30';
    }
    return 'bg-slate-900/50';
  };

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 border-l-4',
        getCategoryCardStyle(),
        categoryConfig.accentBorder,
        state !== 'locked' && 'hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10',
        state === 'selected' && 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20',
        state === 'redeemed' && 'opacity-80'
      )}
    >
      {/* Image/Emoji Header */}
      <div className={cn(
        "h-28 relative flex items-center justify-center",
        category === 'experiences' && "bg-gradient-to-br from-amber-900/30 to-slate-900",
        category === 'gear' && "bg-gradient-to-br from-sky-900/30 to-slate-900",
        category === 'give-back' && "bg-gradient-to-br from-emerald-900/30 to-slate-900",
        !['experiences', 'gear', 'give-back'].includes(category) && "bg-gradient-to-br from-slate-800 to-slate-900"
      )}>
        <span className={cn(
          "text-5xl transition-transform group-hover:scale-110",
          state === 'locked' && "grayscale opacity-50"
        )}>
          {reward.image_emoji || '🎁'}
        </span>
        
        {/* Lock Overlay for locked rewards */}
        {state === 'locked' && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px] flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mb-2 border border-slate-600">
              <Lock className="w-6 h-6 text-slate-400" />
            </div>
            <span className="text-sm font-medium text-slate-300">
              {requiredStatus === 'bronze' && 'Unlock at Bronze'}
              {requiredStatus === 'silver' && 'Requires Silver'}
              {requiredStatus === 'gold' && 'Requires Gold'}
            </span>
          </div>
        )}
        
        {/* Category Badge - Top Left */}
        <Badge className={cn(
          "absolute top-2 left-2 text-xs font-medium",
          categoryConfig.bgColor,
          categoryConfig.color,
          "border-0"
        )}>
          <CategoryIcon className="w-3 h-3 mr-1" />
          {categoryConfig.label}
        </Badge>
        
        {/* Featured Badge */}
        {reward.is_featured && state !== 'locked' && (
          <Badge className="absolute top-2 right-2 bg-amber-500/90 text-white text-xs border-0 shadow-lg">
            ⭐ Featured
          </Badge>
        )}
        
        {/* Selected Indicator */}
        {state === 'selected' && (
          <div className="absolute top-2 right-2 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
        
        {/* Redeemed Badge */}
        {state === 'redeemed' && (
          <Badge className="absolute top-2 right-2 bg-slate-600 text-slate-200 text-xs border-0">
            <Check className="w-3 h-3 mr-1" /> Claimed
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4 space-y-3">
        {/* Sponsor Attribution */}
        {reward.sponsor && state !== 'locked' && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Gift className="w-3 h-3" />
            <span>Sponsored by <span className="text-emerald-400 font-medium">{reward.sponsor}</span></span>
          </div>
        )}
        
        {/* Title */}
        <h3 className={cn(
          "font-bold text-lg leading-tight",
          state === 'locked' ? 'text-slate-400' : 'text-white'
        )}>
          {reward.title}
        </h3>
        
        {/* Description */}
        {reward.description && (
          <p className="text-sm text-slate-400 line-clamp-2">
            {reward.description}
          </p>
        )}
        
        {/* Info Badges Row */}
        <div className="flex flex-wrap gap-1.5">
          {/* Tier Badge */}
          <Badge variant="outline" className={cn(
            'text-xs font-medium',
            statusConfig.bgColor,
            statusConfig.border,
            statusConfig.color
          )}>
            {statusConfig.emoji} {statusConfig.label}
          </Badge>
          
          {/* Cadence Badge */}
          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300 bg-slate-800/50">
            <Calendar className="w-3 h-3 mr-1" />
            {cadenceConfig.label}
          </Badge>
        </div>
        
        {/* Cadence Description */}
        {reward.cadence_description && (
          <p className="text-xs text-slate-500 italic">
            {reward.cadence_description}
          </p>
        )}
        
        {/* Redeemed Date */}
        {state === 'redeemed' && redeemedDate && (
          <p className="text-xs text-slate-400">
            Claimed on {new Date(redeemedDate).toLocaleDateString()}
          </p>
        )}
        
        {/* Multiplier for give-back */}
        {isGiveback && reward.multiplier_text && (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
            ✨ {reward.multiplier_text}
          </Badge>
        )}
        
        {/* Give-back slot notice */}
        {isGiveback && state !== 'locked' && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400/90 bg-emerald-500/10 px-2 py-1.5 rounded-md">
            <Heart className="w-3.5 h-3.5" />
            <span>Doesn't use a selection slot</span>
          </div>
        )}
        
        {/* Action Buttons based on state */}
        <div className="pt-3 border-t border-slate-700/50">
          {state === 'available' && (
            <Button
              onClick={onSelect}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-lg shadow-emerald-500/20"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Select This Reward
            </Button>
          )}
          
          {state === 'giveback' && (
            <Button
              onClick={onSelect}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-lg shadow-emerald-500/20"
              size="sm"
            >
              <Heart className="w-4 h-4 mr-1.5" />
              Activate Give-Back
            </Button>
          )}
          
          {state === 'selected' && (
            <div className="flex gap-2">
              <Button
                onClick={onViewDetails}
                variant="outline"
                className="flex-1 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                size="sm"
              >
                View Details
              </Button>
              <Button
                onClick={onSwap}
                variant="outline"
                className="flex-1 border-slate-600 hover:bg-slate-800"
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
              <p className="text-xs text-slate-400 text-center">All slots filled</p>
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
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-xs"
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
                className="w-full border-slate-600 text-slate-400 hover:text-white hover:border-emerald-500/50 hover:bg-emerald-500/10"
                size="sm"
              >
                <Lock className="w-3 h-3 mr-1.5" />
                {requiredStatus === 'bronze' && 'Lock 100 $GBS to Unlock'}
                {requiredStatus === 'silver' && 'Lock 250 $GBS to Unlock'}
                {requiredStatus === 'gold' && 'Lock 500 $GBS to Unlock'}
              </Button>
              <p className="text-xs text-center text-slate-500">
                {statusConfig.emoji} Requires {statusConfig.label}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default GroundballRewardCard;
