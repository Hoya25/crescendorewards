import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useTierBenefits } from '@/hooks/useTierBenefits';

/** "{remaining} NCTR to {Tier} — opens {first reward} and {n-1} more". Replaces every percentage label. */
export function TierProgressLabel({ balance, className, style }: { balance?: number; className?: string; style?: React.CSSProperties }) {
  const { total360Locked } = useUnifiedUser();
  const { progressLabel } = useTierBenefits(balance ?? (total360Locked || 0));
  if (!progressLabel) return null;
  return <span className={className} style={style}>{progressLabel}</span>;
}
