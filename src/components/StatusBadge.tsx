import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StatusTier } from '@/contexts/UnifiedUserContext';

interface StatusBadgeProps {
  tier: StatusTier | null;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export function StatusBadge({ 
  tier, 
  size = 'md', 
  showName = true, 
  showTooltip = true,
  className 
}: StatusBadgeProps) {
  if (!tier) {
    return (
      <Badge 
        variant="secondary" 
        className={cn(
          "gap-1",
          size === 'sm' && 'text-xs px-2 py-0.5',
          size === 'md' && 'text-sm px-2.5 py-1',
          size === 'lg' && 'text-base px-3 py-1.5',
          className
        )}
      >
        <span>💧</span>
        {showName && <span>Droplet</span>}
      </Badge>
    );
  }

  const BadgeContent = (
    <Badge 
      className={cn(
        "gap-1.5 border-0 transition-transform hover:scale-105",
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'md' && 'text-sm px-2.5 py-1',
        size === 'lg' && 'text-base px-3 py-1.5',
        className
      )}
      style={{ 
        backgroundColor: tier.badge_color + '20',
        color: tier.badge_color,
        borderColor: tier.badge_color + '40'
      }}
    >
      <span className={cn(
        size === 'sm' && 'text-sm',
        size === 'md' && 'text-base',
        size === 'lg' && 'text-lg'
      )}>
        {tier.badge_emoji}
      </span>
      {showName && (
        <span className="font-semibold">{tier.display_name}</span>
      )}
    </Badge>
  );

  if (!showTooltip) {
    return BadgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {BadgeContent}
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="max-w-xs p-4"
          style={{ borderColor: tier.badge_color + '40' }}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{tier.badge_emoji}</span>
              <div>
                <p className="font-bold" style={{ color: tier.badge_color }}>
                  {tier.display_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tier.min_nctr_360_locked}+ NCTR 360LOCK
                </p>
              </div>
            </div>
            
            {tier.benefits && tier.benefits.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Benefits
                </p>
                <ul className="space-y-1">
                  {tier.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <Check 
                        className="w-3 h-3 mt-0.5 shrink-0" 
                        style={{ color: tier.badge_color }}
                      />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Component to show tier with progress to next
interface TierProgressProps {
  currentTier: StatusTier | null;
  nextTier: StatusTier | null;
  total360Locked: number;
  progressPercent: number;
  showDetails?: boolean;
  className?: string;
}

export function TierProgress({
  currentTier,
  nextTier,
  total360Locked,
  progressPercent,
  showDetails = true,
  className
}: TierProgressProps) {
  const currentColor = currentTier?.badge_color || '#60A5FA';
  const nextColor = nextTier?.badge_color || currentColor;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <StatusBadge tier={currentTier} size="sm" showTooltip={false} />
        {nextTier && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>{nextTier.badge_emoji} {nextTier.display_name}</span>
          </div>
        )}
      </div>
      
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ 
            width: `${progressPercent}%`,
            background: `linear-gradient(90deg, ${currentColor}, ${nextColor})`
          }}
        />
      </div>
      
      {showDetails && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{total360Locked.toLocaleString()} NCTR locked</span>
          {nextTier && (
            <span>
              {(nextTier.min_nctr_360_locked - total360Locked).toLocaleString()} to {nextTier.display_name}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Compact badge for headers/navbars
interface CompactStatusBadgeProps {
  tier: StatusTier | null;
  className?: string;
}

export function CompactStatusBadge({ tier, className }: CompactStatusBadgeProps) {
  return (
    <StatusBadge 
      tier={tier} 
      size="sm" 
      showName={false}
      className={className}
    />
  );
}

// Benefits list component
interface BenefitsListProps {
  benefits: string[];
  unlocked: boolean;
  tierColor?: string;
  className?: string;
}

export function BenefitsList({ 
  benefits, 
  unlocked, 
  tierColor = '#60A5FA',
  className 
}: BenefitsListProps) {
  return (
    <ul className={cn("space-y-2", className)}>
      {benefits.map((benefit, idx) => (
        <li 
          key={idx} 
          className={cn(
            "flex items-start gap-2 text-sm",
            !unlocked && "text-muted-foreground"
          )}
        >
          {unlocked ? (
            <Check 
              className="w-4 h-4 mt-0.5 shrink-0" 
              style={{ color: tierColor }}
            />
          ) : (
            <Lock className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/50" />
          )}
          <span>{benefit}</span>
        </li>
      ))}
    </ul>
  );
}
