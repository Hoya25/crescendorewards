import { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  disabled?: boolean;
}

/**
 * Pull-to-refresh wrapper component for mobile.
 * Wraps content and provides pull-down gesture to trigger a refresh.
 * 
 * @example
 * <PullToRefresh onRefresh={async () => await refetch()}>
 *   <YourContent />
 * </PullToRefresh>
 */
export function PullToRefresh({ 
  children, 
  onRefresh, 
  className,
  disabled = false 
}: PullToRefreshProps) {
  const {
    isRefreshing,
    pullDistance,
    containerRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = usePullToRefresh({ onRefresh, disabled });

  const threshold = 80;
  const showIndicator = pullDistance > 10 || isRefreshing;
  const isTriggered = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-0 right-0 flex items-center justify-center transition-all duration-200 pointer-events-none z-10",
          showIndicator ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: 0,
          height: isRefreshing ? 48 : pullDistance,
          transform: `translateY(${isRefreshing ? 0 : -10}px)`,
        }}
      >
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full bg-background border shadow-sm transition-transform",
            isRefreshing && "animate-spin"
          )}
          style={{
            transform: isRefreshing 
              ? 'rotate(0deg)' 
              : `rotate(${Math.min(pullDistance * 3, 360)}deg)`,
          }}
        >
          <RefreshCw 
            className={cn(
              "w-5 h-5 transition-colors",
              isTriggered ? "text-primary" : "text-muted-foreground"
            )} 
          />
        </div>
      </div>

      {/* Content with pull offset */}
      <div
        style={{
          transform: `translateY(${isRefreshing ? 48 : pullDistance}px)`,
          transition: pullDistance === 0 && !isRefreshing ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
