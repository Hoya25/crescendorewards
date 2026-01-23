import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { NCTRLogo } from '@/components/NCTRLogo';
import { addDays, format } from 'date-fns';

// NCTR rate: $0.05 per NCTR
const NCTR_RATE = 0.05;

interface LockOption {
  id: '30' | '90' | '360' | '720';
  label: string;
  days: number;
  multiplier: number;
  isRecommended?: boolean;
}

const LOCK_OPTIONS: LockOption[] = [
  { id: '30', label: '30LOCK', days: 30, multiplier: 1.2 },
  { id: '90', label: '90LOCK', days: 90, multiplier: 1.4 },
  { id: '360', label: '360LOCK', days: 360, multiplier: 2.0, isRecommended: true },
  { id: '720', label: '720LOCK', days: 720, multiplier: 3.0 },
];

interface LockOptionCardsProps {
  floorAmount: number;
  selectedLockOption: '30' | '90' | '360' | '720';
  onSelectLockOption: (option: '30' | '90' | '360' | '720') => void;
}

export function LockOptionCards({
  floorAmount,
  selectedLockOption,
  onSelectLockOption,
}: LockOptionCardsProps) {
  const calculations = useMemo(() => {
    const baseNCTR = floorAmount > 0 ? Math.round(floorAmount / NCTR_RATE) : 0;
    
    return LOCK_OPTIONS.map((option) => {
      const nctrAmount = Math.round(baseNCTR * option.multiplier);
      const dollarValue = nctrAmount * NCTR_RATE;
      const unlockDate = addDays(new Date(), option.days);
      
      return {
        ...option,
        baseNCTR,
        nctrAmount,
        dollarValue,
        unlockDate,
      };
    });
  }, [floorAmount]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {calculations.map((option) => {
          const isSelected = selectedLockOption === option.id;
          
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelectLockOption(option.id)}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-[#E85D04] bg-[#E85D04]/5 shadow-lg shadow-[#E85D04]/20'
                  : 'border-border bg-card hover:border-[#E85D04]/50 hover:bg-accent/50'
              }`}
            >
              {/* Recommended Badge */}
              {option.isRecommended && (
                <Badge 
                  className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#E85D04] text-white text-[10px] px-2 py-0.5"
                >
                  Recommended
                </Badge>
              )}

              {/* Lock Duration */}
              <div className="flex items-center gap-2 mb-3 mt-1">
                <Lock className={`h-4 w-4 ${isSelected ? 'text-[#E85D04]' : 'text-muted-foreground'}`} />
                <span className="font-bold text-lg">{option.label}</span>
              </div>

              {/* Multiplier Badge */}
              <Badge 
                variant="outline" 
                className={`mb-3 ${isSelected ? 'border-[#E85D04] text-[#E85D04]' : ''}`}
              >
                {option.multiplier}x
              </Badge>

              {/* NCTR Amount */}
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className={`h-4 w-4 ${isSelected ? 'text-[#E85D04]' : 'text-primary'}`} />
                <span className={`text-xl font-bold ${isSelected ? 'text-[#E85D04]' : 'text-foreground'}`}>
                  {option.nctrAmount.toLocaleString()}
                </span>
                <NCTRLogo size="xs" />
              </div>

              {/* Dollar Value */}
              <p className="text-sm text-muted-foreground mb-2">
                ${option.dollarValue.toFixed(2)} value
              </p>

              {/* Unlock Date */}
              <p className="text-xs text-muted-foreground">
                Unlocks {format(option.unlockDate, 'MMM d, yyyy')}
              </p>

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="h-5 w-5 text-[#E85D04]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Export constants for use in parent component
export { NCTR_RATE, LOCK_OPTIONS };
export type { LockOption };
