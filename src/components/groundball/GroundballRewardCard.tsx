import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Lock, Plus, RefreshCw, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GroundballReward } from '@/hooks/useGroundballStatus';

type SelectionState = 'available' | 'selected' | 'locked' | 'no-slots' | 'giveback';

interface GroundballRewardCardProps {
  reward: GroundballReward;
  state: SelectionState;
  onSelect: () => void;
  onSwap: () => void;
  onViewDetails: () => void;
  onHowToLevelUp: () => void;
  onGetBonusSlot: () => void;
}

const STATUS_CONFIG = {
  any: { emoji: '💚', label: 'All Members', color: 'text-emerald-400', border: 'border-emerald-500/30' },
  bronze: { emoji: '🥉', label: 'Bronze', color: 'text-orange-400', border: 'border-orange-500/30' },
  silver: { emoji: '🥈', label: 'Silver', color: 'text-slate-300', border: 'border-slate-400/30' },
  gold: { emoji: '🥇', label: 'Gold', color: 'text-amber-400', border: 'border-amber-500/30' },
};

const CADENCE_LABELS: Record<string, string> = {
  daily: 'Daily',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
  one_time: 'One-Time',
};

export function GroundballRewardCard({
  reward,
  state,
  onSelect,
  onSwap,
  onViewDetails,
  onHowToLevelUp,
  onGetBonusSlot,
}: GroundballRewardCardProps) {
  const requiredStatus = reward.required_status || 'any';
  const statusConfig = STATUS_CONFIG[requiredStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.any;
  const cadenceLabel = reward.cadence ? CADENCE_LABELS[reward.cadence] || reward.cadence : null;
  const isGiveback = reward.is_giveback;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden bg-slate-900/50 transition-all duration-300',
        state !== 'locked' && 'hover:scale-[1.02]',
        state === 'selected' && 'ring-2 ring-emerald-500',
        state === 'locked' && 'opacity-60',
        statusConfig.border,
        'border'
      )}
    >
      {/* Image/Emoji Header */}
      <div className="h-24 relative bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
        <span className={cn("text-5xl", state === 'locked' && "grayscale opacity-50")}>
          {reward.image_emoji || '🎁'}
        </span>
        
        {/* Lock Overlay for locked rewards */}
        {state === 'locked' && (
          <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center">
            <Lock className="w-8 h-8 text-slate-400 mb-1" />
            <span className="text-xs font-medium text-slate-300">
              {requiredStatus === 'bronze' && 'Unlock at Bronze'}
              {requiredStatus === 'silver' && 'Requires Silver'}
              {requiredStatus === 'gold' && 'Requires Gold'}
            </span>
          </div>
        )}
        
        {/* Featured Badge */}
        {reward.is_featured && state !== 'locked' && (
          <Badge className="absolute top-2 right-2 bg-amber-500 text-white text-xs">
            ⭐ Featured
          </Badge>
        )}
        
        {/* Selected Indicator */}
        {state === 'selected' && (
          <div className="absolute top-2 left-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
        
        {/* Give-back Badge */}
        {isGiveback && state !== 'locked' && (
          <Badge className="absolute bottom-2 left-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <Heart className="w-3 h-3 mr-1" /> Give-Back
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4 space-y-3">
        {/* Sponsor */}
        {reward.sponsor && (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
            {reward.sponsor}
          </Badge>
        )}
        
        {/* Title */}
        <h3 className="font-semibold text-white text-lg leading-tight">
          {reward.title}
        </h3>
        
        {/* Description */}
        {reward.description && (
          <p className="text-sm text-slate-400 line-clamp-2">
            {reward.description}
          </p>
        )}
        
        {/* Badges Row */}
        <div className="flex flex-wrap gap-2">
          {/* Status Badge */}
          <Badge variant="outline" className={cn('text-xs', statusConfig.border, statusConfig.color)}>
            {statusConfig.emoji} {statusConfig.label}
          </Badge>
          
          {/* Cadence Badge */}
          {cadenceLabel && (
            <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
              {cadenceLabel}
            </Badge>
          )}
        </div>
        
        {/* Cadence Description */}
        {reward.cadence_description && (
          <p className="text-xs text-slate-500">
            {reward.cadence_description}
          </p>
        )}
        
        {/* Multiplier for give-back */}
        {isGiveback && reward.multiplier_text && (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
            ✨ {reward.multiplier_text}
          </Badge>
        )}
        
        {/* Give-back slot notice */}
        {isGiveback && (
          <p className="text-xs text-emerald-400/80">
            💚 Doesn't use a selection slot
          </p>
        )}
        
        {/* Action Buttons based on state */}
        <div className="pt-2 border-t border-slate-700">
          {state === 'available' && (
            <Button
              onClick={onSelect}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Select This Reward
            </Button>
          )}
          
          {state === 'giveback' && (
            <Button
              onClick={onSelect}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              size="sm"
            >
              <Heart className="w-4 h-4 mr-1" />
              Activate
            </Button>
          )}
          
          {state === 'selected' && (
            <div className="flex gap-2">
              <Button
                onClick={onViewDetails}
                variant="outline"
                className="flex-1 border-slate-600"
                size="sm"
              >
                View Details
              </Button>
              <Button
                onClick={onSwap}
                variant="outline"
                className="flex-1 border-slate-600"
                size="sm"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Swap Out
              </Button>
            </div>
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
                className="w-full border-slate-600 text-slate-400 hover:text-white hover:border-emerald-500/50"
                size="sm"
              >
                <Lock className="w-3 h-3 mr-1" />
                {requiredStatus === 'bronze' && 'Lock 100 $GBS to Unlock'}
                {requiredStatus === 'silver' && 'Lock 250 $GBS to Unlock'}
                {requiredStatus === 'gold' && 'Lock 500 $GBS to Unlock'}
              </Button>
              <p className="text-xs text-center text-slate-500">
                {statusConfig.emoji} Requires {statusConfig.label} Status
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default GroundballRewardCard;
