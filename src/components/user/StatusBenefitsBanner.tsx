import { useNavigate } from 'react-router-dom';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Sparkles, TrendingUp, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBenefitsBannerProps {
  className?: string;
  variant?: 'default' | 'compact';
}

// Status tier benefits mapping
const TIER_BENEFITS: Record<string, { discount: string; description: string }> = {
  droplet: { discount: 'Standard pricing', description: 'Access to all rewards' },
  eddy: { discount: 'up to 25% off', description: 'sponsored rewards' },
  spiral: { discount: 'up to 50% off', description: 'sponsored rewards' },
  surge: { discount: 'up to 75% off', description: 'sponsored rewards' },
  torus: { discount: 'FREE access', description: 'to exclusive rewards' },
};

const NEXT_TIER_BENEFITS: Record<string, string> = {
  droplet: 'Eddys get up to 25% off sponsored rewards',
  eddy: 'Spirals get up to 50% off sponsored rewards',
  spiral: 'Surges get up to 75% off sponsored rewards',
  surge: 'Torus members get FREE access to exclusive rewards',
  torus: '',
};

export function StatusBenefitsBanner({ className, variant = 'default' }: StatusBenefitsBannerProps) {
  const navigate = useNavigate();
  const { tier, nextTier, progressToNextTier, profile } = useUnifiedUser();
  
  const tierName = tier?.tier_name?.toLowerCase() || 'droplet';
  const currentBenefit = TIER_BENEFITS[tierName] || TIER_BENEFITS.droplet;
  const nextTierBenefit = NEXT_TIER_BENEFITS[tierName];
  const isCloseToLevelUp = progressToNextTier >= 70;

  // Get tier colors
  const tierColor = tier?.badge_color || 'hsl(var(--primary))';
  const tierEmoji = tier?.badge_emoji || '💧';
  const tierDisplayName = tier?.display_name || 'Droplet';

  if (variant === 'compact') {
    return (
      <div 
        className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-lg border",
          className
        )}
        style={{ 
          backgroundColor: `${tierColor}10`,
          borderColor: `${tierColor}30`
        }}
      >
        <span className="text-lg">{tierEmoji}</span>
        <p className="text-sm flex-1">
          <span className="font-medium">{tierDisplayName}:</span>{' '}
          <span className="text-muted-foreground">{currentBenefit.discount} {currentBenefit.description}</span>
        </p>
        {nextTier && isCloseToLevelUp && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/membership')}
            className="shrink-0"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Level Up
          </Button>
        )}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl border p-5",
        className
      )}
      style={{ 
        backgroundColor: `${tierColor}08`,
        borderColor: `${tierColor}25`
      }}
    >
      {/* Decorative gradient */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          background: `radial-gradient(circle at top right, ${tierColor}, transparent 70%)`
        }}
      />
      
      <div className="relative flex flex-col md:flex-row md:items-center gap-4">
        {/* Current status & benefit */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{tierEmoji}</span>
            <div>
              <p className="font-semibold" style={{ color: tierColor }}>
                As a {tierDisplayName}
              </p>
              <p className="text-sm text-muted-foreground">
                You get <span className="font-medium text-foreground">{currentBenefit.discount}</span> {currentBenefit.description}
              </p>
            </div>
          </div>
        </div>

        {/* Next tier teaser */}
        {nextTier && nextTierBenefit && (
          <div className="flex-1 flex items-start gap-3 md:border-l md:pl-4" style={{ borderColor: `${tierColor}20` }}>
            <Gift className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="text-sm text-muted-foreground">
                {nextTierBenefit}
              </p>
              
              {/* Progress indicator when close to level up */}
              {isCloseToLevelUp && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3" style={{ color: tierColor }} />
                      {progressToNextTier}% to {nextTier.display_name}
                    </span>
                  </div>
                  <Progress 
                    value={progressToNextTier} 
                    className="h-1.5"
                    style={{ 
                      ['--progress-background' as any]: `${tierColor}20`,
                      ['--progress-foreground' as any]: tierColor 
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        {nextTier && isCloseToLevelUp && (
          <Button 
            onClick={() => navigate('/membership')}
            size="sm"
            className="shrink-0 gap-2"
            style={{ 
              backgroundColor: tierColor,
              color: 'white'
            }}
          >
            Level Up
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
