import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Calculator, Lock, Coins, Sparkles, TrendingUp, ArrowRight, Info } from 'lucide-react';
import { NCTRLogo } from '@/components/NCTRLogo';
import { cn } from '@/lib/utils';

interface LockPeriodOption {
  days: number;
  label: string;
  nctrPerClaim: number;
  recommended?: boolean;
}

const LOCK_PERIODS: LockPeriodOption[] = [
  { days: 90, label: '90 days', nctrPerClaim: 75 },
  { days: 360, label: '360 days', nctrPerClaim: 200, recommended: true },
];

interface ClaimsToNCTRCalculatorProps {
  className?: string;
  compact?: boolean;
  defaultClaims?: number;
  selectedLockRate?: '90' | '360';
  onLockRateChange?: (rate: '90' | '360') => void;
}

export function ClaimsToNCTRCalculator({
  className,
  compact = false,
  defaultClaims = 10,
  selectedLockRate,
  onLockRateChange,
}: ClaimsToNCTRCalculatorProps) {
  const [claimsInput, setClaimsInput] = useState(defaultClaims);
  const [internalLockPeriod, setInternalLockPeriod] = useState<number>(
    selectedLockRate ? parseInt(selectedLockRate) : 360
  );

  const lockPeriod = selectedLockRate ? parseInt(selectedLockRate) : internalLockPeriod;

  const calculations = useMemo(() => {
    const claims = Math.max(0, claimsInput);
    
    return LOCK_PERIODS.map(period => ({
      ...period,
      totalNCTR: claims * period.nctrPerClaim,
      isSelected: period.days === lockPeriod,
    }));
  }, [claimsInput, lockPeriod]);

  const selectedCalc = calculations.find(c => c.isSelected) || calculations[1];

  const handleLockPeriodChange = (days: number) => {
    if (onLockRateChange) {
      onLockRateChange(days === 360 ? '360' : '90');
    } else {
      setInternalLockPeriod(days);
    }
  };

  if (compact) {
    return (
      <div className={cn('bg-muted/30 rounded-xl p-4 border border-border/50', className)}>
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Quick Conversion</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              type="number"
              min={1}
              value={claimsInput}
              onChange={(e) => setClaimsInput(parseInt(e.target.value) || 0)}
              className="h-9 text-center font-bold"
            />
            <span className="text-xs text-muted-foreground block text-center mt-1">Claims</span>
          </div>
          
          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-lg font-bold text-primary">{selectedCalc.totalNCTR.toLocaleString()}</span>
              <NCTRLogo size="xs" />
            </div>
            <span className="text-xs text-muted-foreground">{selectedCalc.label} lock</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary rounded-xl">
            <Calculator className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg">Claims → NCTR Calculator</CardTitle>
            <CardDescription>
              See how your Claims convert to NCTR
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        {/* Claims Input */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Coins className="w-4 h-4 text-primary" />
            Number of Claims
          </Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[claimsInput]}
              onValueChange={([value]) => setClaimsInput(value)}
              min={1}
              max={100}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              min={1}
              value={claimsInput}
              onChange={(e) => setClaimsInput(parseInt(e.target.value) || 0)}
              className="w-20 text-center font-bold"
            />
          </div>
        </div>

        {/* Lock Period Options */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Lock Period
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {LOCK_PERIODS.map((period) => {
              const calc = calculations.find(c => c.days === period.days)!;
              return (
                <button
                  key={period.days}
                  type="button"
                  onClick={() => handleLockPeriodChange(period.days)}
                  className={cn(
                    'relative p-4 rounded-xl border-2 text-left transition-all',
                    calc.isSelected
                      ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                      : 'border-border hover:border-primary/40 bg-background'
                  )}
                >
                  {period.recommended && (
                    <Badge className="absolute -top-2 -right-2 text-[10px] bg-emerald-500">
                      Best Value
                    </Badge>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className={cn('w-4 h-4', calc.isSelected ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="font-semibold">{period.label}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {period.nctrPerClaim} NCTR per Claim
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversion Result */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Your Conversion</span>
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              {selectedCalc.label} lock
            </Badge>
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center">
                <Coins className="w-5 h-5 text-muted-foreground" />
                <span className="text-3xl font-bold">{claimsInput}</span>
              </div>
              <span className="text-sm text-muted-foreground">Claims</span>
            </div>
            
            <ArrowRight className="w-6 h-6 text-primary" />
            
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center">
                <NCTRLogo size="sm" />
                <span className="text-3xl font-bold text-primary">
                  {selectedCalc.totalNCTR.toLocaleString()}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">NCTR</span>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            All Lock Period Rates
          </Label>
          <div className="bg-muted/30 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="py-2 px-3 text-left font-medium text-muted-foreground">Lock Period</th>
                  <th className="py-2 px-3 text-center font-medium text-muted-foreground">Rate</th>
                  <th className="py-2 px-3 text-right font-medium text-muted-foreground">Total NCTR</th>
                </tr>
              </thead>
              <tbody>
                {calculations.map((calc) => (
                  <tr
                    key={calc.days}
                    className={cn(
                      'border-b border-border/30 last:border-0 transition-colors',
                      calc.isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                    )}
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <Lock className={cn('w-3.5 h-3.5', calc.isSelected ? 'text-primary' : 'text-muted-foreground')} />
                        <span className={cn(calc.isSelected && 'font-medium')}>{calc.label}</span>
                        {calc.recommended && (
                          <Badge variant="secondary" className="text-[9px] py-0 px-1.5">
                            Best
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-muted-foreground">{calc.nctrPerClaim} NCTR/Claim</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className={cn('font-bold', calc.isSelected ? 'text-primary' : 'text-foreground')}>
                          {calc.totalNCTR.toLocaleString()}
                        </span>
                        <NCTRLogo size="xs" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Note */}
        <div className="flex gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
          <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Longer commitment periods earn more NCTR. The 360-day commitment provides <span className="font-semibold text-primary">2.67x more NCTR</span> than the 90-day commitment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
