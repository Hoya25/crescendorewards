import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { NCTRLogo } from '@/components/NCTRLogo';
import { Lock, DollarSign, Calendar } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { NCTR_RATE, LOCK_OPTIONS } from './LockOptionCards';

interface CompensationSummaryProps {
  floorAmount: number;
  selectedLockOption: '30' | '90' | '360' | '720';
}

export function CompensationSummary({
  floorAmount,
  selectedLockOption,
}: CompensationSummaryProps) {
  const summary = useMemo(() => {
    const option = LOCK_OPTIONS.find((o) => o.id === selectedLockOption);
    if (!option || floorAmount <= 0) return null;

    const baseNCTR = Math.round(floorAmount / NCTR_RATE);
    const nctrAmount = Math.round(baseNCTR * option.multiplier);
    const dollarValue = nctrAmount * NCTR_RATE;
    const unlockDate = addDays(new Date(), option.days);

    return {
      nctrAmount,
      dollarValue,
      unlockDate,
      lockLabel: option.label,
    };
  }, [floorAmount, selectedLockOption]);

  if (!summary) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-[#E85D04]/10 via-primary/5 to-[#E85D04]/10 border border-[#E85D04]/30 rounded-xl p-5">
      <p className="text-sm text-muted-foreground mb-3">You're requesting:</p>
      
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-foreground">
            {summary.nctrAmount.toLocaleString()}
          </span>
          <NCTRLogo size="sm" />
        </div>
        <Badge className="bg-[#E85D04] text-white">
          <Lock className="h-3 w-3 mr-1" />
          {summary.lockLabel}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-4 w-4" />
          <span>Current value: <span className="font-medium text-foreground">${summary.dollarValue.toFixed(2)}</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          <span>Unlocks: <span className="font-medium text-foreground">{format(summary.unlockDate, 'MMM d, yyyy')}</span></span>
        </div>
      </div>
    </div>
  );
}
