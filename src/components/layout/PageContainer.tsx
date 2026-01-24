import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  /** Whether to include bottom padding for mobile nav (default: true) */
  withBottomNav?: boolean;
  /** Maximum width constraint (default: max-w-7xl) */
  maxWidth?: string;
}

/**
 * Standardized page container component for consistent mobile padding and spacing.
 * Use this wrapper on all pages for consistency.
 */
export function PageContainer({ 
  children, 
  className,
  withBottomNav = true,
  maxWidth = "max-w-7xl"
}: PageContainerProps) {
  return (
    <div 
      className={cn(
        "px-4 sm:px-6 md:px-8",
        maxWidth,
        "mx-auto",
        withBottomNav && "pb-24 md:pb-8",
        className
      )}
    >
      {children}
    </div>
  );
}
