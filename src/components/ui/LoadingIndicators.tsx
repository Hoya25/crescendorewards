import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

/**
 * Standardized loading spinner with optional text.
 * Used for inline loading states and button loading indicators.
 */
export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

interface LoadingOverlayProps {
  text?: string;
  className?: string;
}

/**
 * Full-screen or container loading overlay with backdrop.
 * Use for longer operations like form submissions.
 */
export function LoadingOverlay({ text = "Loading...", className }: LoadingOverlayProps) {
  return (
    <div className={cn(
      "absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50",
      className
    )}>
      <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-card border shadow-lg">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">{text}</p>
      </div>
    </div>
  );
}

interface ProgressIndicatorProps {
  progress: number;
  text?: string;
  showPercentage?: boolean;
  className?: string;
}

/**
 * Progress indicator for operations with known progress.
 */
export function ProgressIndicator({ 
  progress, 
  text, 
  showPercentage = true,
  className 
}: ProgressIndicatorProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={cn("space-y-2", className)}>
      {(text || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {text && <span className="text-muted-foreground">{text}</span>}
          {showPercentage && <span className="font-medium">{Math.round(clampedProgress)}%</span>}
        </div>
      )}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}
