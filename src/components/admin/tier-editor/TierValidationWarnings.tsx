import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
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
  /** When true, returns whether validation passes instead of rendering */
  validateOnly?: boolean;
}

export interface ValidationWarning {
  type: 'error' | 'warning';
  message: string;
}

export function validateTiers(tiers: StatusTier[]): ValidationWarning[] {
  const sortedTiers = [...tiers].sort((a, b) => a.min_nctr_360_locked - b.min_nctr_360_locked);
  const warnings: ValidationWarning[] = [];

  for (let i = 0; i < sortedTiers.length; i++) {
    const tier = sortedTiers[i];
    
    // Check min < max for non-top tiers
    if (tier.max_nctr_360_locked !== null && tier.min_nctr_360_locked >= tier.max_nctr_360_locked) {
      warnings.push({
        type: 'error',
        message: `${tier.display_name}: Minimum (${tier.min_nctr_360_locked.toLocaleString()}) must be less than maximum (${tier.max_nctr_360_locked.toLocaleString()})`
      });
    }
  }

  // Check for overlaps and gaps between tiers
  for (let i = 1; i < sortedTiers.length; i++) {
    const prevTier = sortedTiers[i - 1];
    const currTier = sortedTiers[i];
    
    // Check overlap: current min should be > previous max
    if (prevTier.max_nctr_360_locked !== null) {
      if (currTier.min_nctr_360_locked <= prevTier.max_nctr_360_locked) {
        warnings.push({
          type: 'error',
          message: `NCTR overlap: ${prevTier.display_name} max (${prevTier.max_nctr_360_locked.toLocaleString()}) overlaps with ${currTier.display_name} min (${currTier.min_nctr_360_locked.toLocaleString()})`
        });
      }
      
      // Check gap: ideal is current min = previous max + 1
      const expectedMin = prevTier.max_nctr_360_locked + 1;
      if (currTier.min_nctr_360_locked !== expectedMin) {
        warnings.push({
          type: 'warning',
          message: `Gap between tiers: ${prevTier.display_name} ends at ${prevTier.max_nctr_360_locked.toLocaleString()}, but ${currTier.display_name} starts at ${currTier.min_nctr_360_locked.toLocaleString()} (expected ${expectedMin.toLocaleString()})`
        });
      }
    }
  }

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

  return warnings;
}

export function hasValidationErrors(tiers: StatusTier[]): boolean {
  const warnings = validateTiers(tiers);
  return warnings.some(w => w.type === 'error');
}

export function TierValidationWarnings({ tiers }: TierValidationWarningsProps) {
  const warnings = validateTiers(tiers);
  const errors = warnings.filter(w => w.type === 'error');
  const warningsOnly = warnings.filter(w => w.type === 'warning');

  if (warnings.length === 0) {
    return (
      <Alert className="bg-success/10 border-success/30">
        <CheckCircle className="h-4 w-4 text-success" />
        <AlertDescription className="text-success">
          All tier configurations are valid — no overlaps or gaps
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {errors.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong className="block mb-1">Cannot save — {errors.length} error{errors.length > 1 ? 's' : ''} found:</strong>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      {warningsOnly.map((warning, index) => (
        <Alert 
          key={index} 
          className="bg-warning/10 border-warning/30"
        >
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning-foreground">{warning.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
