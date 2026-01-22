import { AlertTriangle, TestTube, CreditCard } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface BetaTestingNoticeProps {
  variant?: 'rewards' | 'claims' | 'compact';
  className?: string;
}

export function BetaTestingNotice({ variant = 'rewards', className }: BetaTestingNoticeProps) {
  if (variant === 'claims') {
    return (
      <Alert className={cn(
        "border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/10",
        className
      )}>
        <CreditCard className="h-4 w-4 text-emerald-600" />
        <AlertTitle className="text-emerald-700 dark:text-emerald-400 font-semibold">
          Beta Investment Protection
        </AlertTitle>
        <AlertDescription className="text-emerald-600/90 dark:text-emerald-300/90 text-sm">
          Any Claims you purchase during Beta will be <span className="font-semibold">credited to your account</span> when rewards go live. 
          Your investment is protected!
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm",
        className
      )}>
        <TestTube className="h-4 w-4 shrink-0" />
        <span>
          <span className="font-medium">Beta Testing:</span> Rewards claimed now are for testing purposes only.
        </span>
      </div>
    );
  }

  // Default 'rewards' variant
  return (
    <Alert className={cn(
      "border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10",
      className
    )}>
      <TestTube className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-700 dark:text-amber-400 font-semibold">
        Beta Testing Mode
      </AlertTitle>
      <AlertDescription className="text-amber-600/90 dark:text-amber-300/90 text-sm">
        Rewards claimed during Beta are for <span className="font-semibold">testing purposes only</span>.
        When we go live, you'll have the opportunity to claim real rewards!
      </AlertDescription>
    </Alert>
  );
}
