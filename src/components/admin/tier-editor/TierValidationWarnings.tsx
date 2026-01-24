import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StatusTier {
  id: string;
  tier_name: string;
  display_name: string;
  min_nctr_360_locked: number;
  max_nctr_360_locked: number | null;
  earning_multiplier: number;
  discount_percent: number;
  sort_order: number;
}

interface TierValidationWarningsProps {
  tiers: StatusTier[];
}

interface ValidationWarning {
  type: 'error' | 'warning';
  message: string;
}

export function TierValidationWarnings({ tiers }: TierValidationWarningsProps) {
  const sortedTiers = [...tiers].sort((a, b) => a.sort_order - b.sort_order);
  const warnings: ValidationWarning[] = [];

  // Check multiplier progression
  for (let i = 1; i < sortedTiers.length; i++) {
    const prevTier = sortedTiers[i - 1];
    const currTier = sortedTiers[i];
    
    if (currTier.earning_multiplier < prevTier.earning_multiplier) {
      warnings.push({
        type: 'error',
        message: `${currTier.display_name} has lower multiplier (${currTier.earning_multiplier}x) than ${prevTier.display_name} (${prevTier.earning_multiplier}x)`
      });
    }
    
    if (currTier.discount_percent < prevTier.discount_percent) {
      warnings.push({
        type: 'error',
        message: `${currTier.display_name} has lower discount (${currTier.discount_percent}%) than ${prevTier.display_name} (${prevTier.discount_percent}%)`
      });
    }
  }

  // Check NCTR threshold overlaps
  for (let i = 1; i < sortedTiers.length; i++) {
    const prevTier = sortedTiers[i - 1];
    const currTier = sortedTiers[i];
    
    if (prevTier.max_nctr_360_locked !== null && 
        currTier.min_nctr_360_locked <= prevTier.max_nctr_360_locked) {
      warnings.push({
        type: 'error',
        message: `NCTR threshold overlap: ${prevTier.display_name} max (${prevTier.max_nctr_360_locked?.toLocaleString()}) overlaps with ${currTier.display_name} min (${currTier.min_nctr_360_locked.toLocaleString()})`
      });
    }
  }

  if (warnings.length === 0) {
    return (
      <Alert className="bg-success/10 border-success/30">
        <CheckCircle className="h-4 w-4 text-success" />
        <AlertDescription className="text-success">
          All tier configurations are valid
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {warnings.map((warning, index) => (
        <Alert 
          key={index} 
          variant={warning.type === 'error' ? 'destructive' : 'default'}
          className={warning.type === 'warning' ? 'bg-warning/10 border-warning/30' : ''}
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{warning.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
