import { Badge } from '@/components/ui/badge';

interface BetaBadgeProps {
  className?: string;
}

export function BetaBadge({ className = '' }: BetaBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={`ml-2 text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/30 font-semibold tracking-wide ${className}`}
    >
      BETA
    </Badge>
  );
}
