import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Crown, Sparkles, TrendingUp } from 'lucide-react';
import { MembershipTier } from '@/utils/membershipLevels';

interface TierUpgradeCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  newTier: MembershipTier;
  oldTier: MembershipTier;
}

export function TierUpgradeCelebration({ 
  isOpen, 
  onClose, 
  newTier, 
  oldTier 
}: TierUpgradeCelebrationProps) {
  
  useEffect(() => {
    if (isOpen) {
      // Initial burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: [newTier.color, '#FFD700', '#FFA500']
      });

      // Side cannons
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: [newTier.color, '#FFD700']
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: [newTier.color, '#FFD700']
        });
      }, 250);

      // Stars from top
      setTimeout(() => {
        confetti({
          particleCount: 30,
          spread: 360,
          startVelocity: 25,
          origin: { y: 0.3, x: 0.5 },
          shapes: ['star'],
          colors: [newTier.color, '#FFD700', '#FFA500', '#FF69B4']
        });
      }, 500);

      // Final cascade
      setTimeout(() => {
        confetti({
          particleCount: 75,
          spread: 100,
          origin: { y: 0.4 },
          colors: [newTier.color, '#FFD700']
        });
      }, 750);

      // Auto close after celebration
      const timer = setTimeout(() => {
        onClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, newTier, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="text-center space-y-6 py-6">
          {/* Animated crown */}
          <div className="relative mx-auto w-24 h-24 animate-scale-in">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="relative flex items-center justify-center w-full h-full bg-primary/10 rounded-full">
              <Crown 
                className="w-12 h-12 animate-bounce" 
                style={{ color: newTier.color }}
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <h2 className="text-2xl font-bold">Congratulations!</h2>
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground">You've upgraded your membership!</p>
          </div>

          {/* Tier transition */}
          <div className="flex items-center justify-center gap-4 animate-fade-in">
            <Badge 
              variant="outline" 
              className="text-lg px-4 py-2"
              style={{ 
                borderColor: oldTier.color,
                color: oldTier.color 
              }}
            >
              {oldTier.name}
            </Badge>
            <TrendingUp className="w-6 h-6 text-primary animate-pulse" />
            <Badge 
              className="text-lg px-4 py-2 animate-scale-in"
              style={{ 
                backgroundColor: newTier.color,
                borderColor: newTier.color 
              }}
            >
              {newTier.name}
            </Badge>
          </div>

          {/* New benefits preview */}
          <div 
            className="p-4 rounded-lg border-2 animate-fade-in"
            style={{ 
              borderColor: newTier.color,
              backgroundColor: `${newTier.bgColor}20`
            }}
          >
            <p className="font-semibold mb-2">New Benefits Unlocked:</p>
            <ul className="text-sm space-y-1 text-left">
              {newTier.benefits.slice(0, 3).map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: newTier.color }} />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Multiplier highlight */}
          <div className="text-sm text-muted-foreground animate-fade-in">
            Now earning <span className="font-bold" style={{ color: newTier.color }}>{newTier.multiplier}x NCTR</span> on all activities!
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
