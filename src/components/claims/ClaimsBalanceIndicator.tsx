import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Ticket, Plus, TrendingUp, AlertCircle } from 'lucide-react';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { cn } from '@/lib/utils';

interface ClaimsBalanceIndicatorProps {
  compact?: boolean;
}

export function ClaimsBalanceIndicator({ compact = false }: ClaimsBalanceIndicatorProps) {
  const navigate = useNavigate();
  const { profile } = useUnifiedUser();
  
  const claimsBalance = profile?.crescendo_data?.claims_balance || 0;
  const isLow = claimsBalance < 10;
  const isEmpty = claimsBalance === 0;

  if (compact) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/buy-claims')}
        className={cn(
          "gap-1.5 h-8 px-2.5",
          isLow && "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20",
          isEmpty && "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 animate-pulse"
        )}
      >
        <Ticket className={cn(
          "w-3.5 h-3.5",
          isEmpty ? "text-red-600" : isLow ? "text-amber-600" : "text-violet-600"
        )} />
        <span className={cn(
          "font-semibold text-sm",
          isEmpty ? "text-red-700 dark:text-red-400" : isLow ? "text-amber-700 dark:text-amber-400" : ""
        )}>
          {claimsBalance}
        </span>
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 h-9 px-3 relative",
            isLow && "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30",
            isEmpty && "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20"
          )}
        >
          <Ticket className={cn(
            "w-4 h-4",
            isEmpty ? "text-red-600 dark:text-red-400" : isLow ? "text-amber-600 dark:text-amber-400" : "text-violet-600 dark:text-violet-400"
          )} />
          <span className={cn(
            "font-semibold",
            isEmpty ? "text-red-700 dark:text-red-400" : isLow ? "text-amber-700 dark:text-amber-400" : ""
          )}>
            {claimsBalance} Claims
          </span>
          {isLow && (
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Your Claims</span>
            <Badge variant={isEmpty ? "destructive" : isLow ? "secondary" : "default"} className={cn(
              !isEmpty && !isLow && "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400"
            )}>
              {isEmpty ? "Empty" : isLow ? "Low" : "Good"}
            </Badge>
          </div>
          
          <div className="flex items-baseline gap-2 mb-4">
            <span className={cn(
              "text-3xl font-bold",
              isEmpty ? "text-red-600" : isLow ? "text-amber-600" : "text-foreground"
            )}>
              {claimsBalance}
            </span>
            <span className="text-muted-foreground">claims available</span>
          </div>

          {isLow && (
            <div className={cn(
              "flex items-start gap-2 p-2.5 rounded-lg mb-4 text-sm",
              isEmpty 
                ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400" 
                : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
            )}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                {isEmpty 
                  ? "You need claims to unlock rewards. Get some now!" 
                  : "Running low on claims. Top up to keep claiming rewards."}
              </span>
            </div>
          )}

          <Button
            onClick={() => navigate('/buy-claims')}
            className={cn(
              "w-full gap-2",
              isLow 
                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" 
                : "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            )}
          >
            <Plus className="w-4 h-4" />
            Get More Claims
          </Button>
        </div>

        <div className="border-t bg-muted/30 p-3">
          <button
            onClick={() => navigate('/purchase-history')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            View purchase history
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
