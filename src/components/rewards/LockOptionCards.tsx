import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Lock, CheckCircle2 } from 'lucide-react';
import { NCTRLogo } from '@/components/NCTRLogo';
import { addDays, format } from 'date-fns';

// NCTR rate: $0.05 per NCTR (easy to update when live pricing available)
export const NCTR_RATE = 0.05;

interface LockOption {
  id: '30' | '90' | '360' | '720';
  label: string;
  days: number;
  multiplier: number;
  isRecommended?: boolean;
}

export const LOCK_OPTIONS: LockOption[] = [
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
    // Calculate base NCTR from floor amount
    const baseNCTR = floorAmount > 0 ? Math.round(floorAmount / NCTR_RATE) : 0;
    
    return LOCK_OPTIONS.map((option) => {
      // Apply multiplier to get final NCTR amount
      const nctrAmount = Math.round(baseNCTR * option.multiplier);
      // Calculate dollar value at current rate
      const dollarValue = nctrAmount * NCTR_RATE;
      // Calculate unlock date
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
    <div className="space-y-3">
      {/* NCTR Rate Display */}
      {floorAmount > 0 && (
        <p className="text-sm text-muted-foreground">
          Current NCTR Rate: <span className="font-medium text-foreground">${NCTR_RATE.toFixed(2)}</span>
          {' | '}
          Your ${floorAmount.toLocaleString()} = <span className="font-medium text-foreground">{calculations[0]?.baseNCTR.toLocaleString()}</span> base NCTR
        </p>
      )}

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

              {/* Lock Duration + Multiplier Row */}
              <div className="flex items-center justify-between mb-2 mt-1">
                <div className="flex items-center gap-1.5">
                  <Lock className={`h-4 w-4 ${isSelected ? 'text-[#E85D04]' : 'text-muted-foreground'}`} />
                  <span className="font-bold">{option.label}</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${isSelected ? 'border-[#E85D04] text-[#E85D04]' : ''}`}
                >
                  {option.multiplier}x
                </Badge>
              </div>

              {/* NCTR Amount - Most Prominent */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`text-2xl font-bold ${isSelected ? 'text-[#E85D04]' : 'text-foreground'}`}>
                  {option.nctrAmount.toLocaleString()}
                </span>
                <NCTRLogo size="sm" />
              </div>

              {/* Dollar Value - Medium */}
              <p className={`text-base font-medium mb-2 ${isSelected ? 'text-[#E85D04]/80' : 'text-muted-foreground'}`}>
                ${option.dollarValue.toFixed(2)} value
              </p>

              {/* Unlock Date - Smallest */}
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

export type { LockOption };
