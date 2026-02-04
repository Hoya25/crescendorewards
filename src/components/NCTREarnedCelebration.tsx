import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { Coins, Lock, BarChart3, Target, Sparkles, ExternalLink, Lightbulb } from 'lucide-react';

interface NCTREarnedProps {
  nctrEarned: number;
  brandName: string;
  totalBalance: number;
  currentTier: {
    name: string;
    emoji: string;
    color: string;
  };
  nextTier: {
    name: string;
    emoji: string;
    color: string;
  } | null;
  nctrToNextTier: number | null;
  progressToNextTier: number;
  isOpen: boolean;
  onClose: () => void;
}

export function NCTREarnedCelebration({
  nctrEarned,
  brandName,
  totalBalance,
  currentTier,
  nextTier,
  nctrToNextTier,
  progressToNextTier,
  isOpen,
  onClose
}: NCTREarnedProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && nctrEarned > 0) {
      // Celebration confetti burst
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: [currentTier.color, '#FFD700', '#00CED1']
      });

      // Side cannons
      setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: [currentTier.color, '#FFD700']
        });
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: [currentTier.color, '#FFD700']
        });
      }, 200);
    }
  }, [isOpen, nctrEarned, currentTier.color]);

  const handleExplorebenefits = () => {
    onClose();
    navigate('/benefits');
  };

  const handleBackToGarden = () => {
    onClose();
    window.open('https://thegarden.nctr.live/', '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Celebration Header */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 text-center">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl animate-pulse" />
          </div>
          
          <div className="relative">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center mb-4 animate-scale-in shadow-lg">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2 animate-fade-in">
              You Just Earned NCTR!
            </h2>
            <p className="text-sm text-muted-foreground animate-fade-in">
              Your purchase through <span className="font-semibold">{brandName || 'The Garden'}</span> just added to your stake.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* NCTR Earned Amount */}
          <div className="text-center p-5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">NCTR Earned</span>
            </div>
            <p className="text-4xl font-bold text-primary animate-scale-in">
              +{nctrEarned.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Added to your 360LOCK commitment
            </p>
          </div>

          {/* What This Means - Educational */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">What just happened?</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{nctrEarned.toLocaleString()} NCTR</span> was added to your 360LOCK — a commitment that grows your membership stake and unlocks benefits.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Your total balance is now <span className="font-semibold text-foreground">{totalBalance.toLocaleString()} NCTR</span>, putting you at{' '}
                  <span className="font-semibold" style={{ color: currentTier.color }}>
                    {currentTier.emoji} {currentTier.name}
                  </span>{' '}
                  status.
                </p>
              </div>

              {nextTier && nctrToNextTier && nctrToNextTier > 0 && (
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You're <span className="font-semibold text-foreground">{nctrToNextTier.toLocaleString()} NCTR</span> away from{' '}
                    <span className="font-semibold" style={{ color: nextTier.color }}>
                      {nextTier.emoji} {nextTier.name}
                    </span>{' '}
                    — which unlocks even more benefits!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tier Progress Bar */}
          {nextTier && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium" style={{ color: currentTier.color }}>
                  {currentTier.emoji} {currentTier.name}
                </span>
                <span className="font-medium" style={{ color: nextTier.color }}>
                  {nextTier.emoji} {nextTier.name}
                </span>
              </div>
              <Progress value={progressToNextTier} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {Math.round(progressToNextTier)}% to {nextTier.name}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button onClick={handleExplorebenefits} className="w-full">
              Explore My Benefits
            </Button>
            <Button onClick={handleBackToGarden} variant="outline" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Keep Earning — Back to The Garden
            </Button>
            <Button onClick={onClose} variant="ghost" className="w-full text-muted-foreground">
              Got it, thanks!
            </Button>
          </div>

          {/* Educational Footer */}
          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">How it works:</span> Every purchase through The Garden earns you NCTR — real digital asset stakes that grow your membership. The more you earn, the more benefits you unlock. You never buy NCTR — you earn it by living your life.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NCTREarnedCelebration;
