import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  formatOptions?: Intl.NumberFormatOptions;
}

export function AnimatedCounter({ 
  value, 
  duration = 800, 
  className,
  formatOptions = {}
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousValue = useRef(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Skip animation on initial mount
    if (previousValue.current === value) return;

    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();
    
    setIsAnimating(true);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: easeOutExpo for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = Math.round(startValue + (endValue - startValue) * easeProgress);
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        setIsAnimating(false);
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  // Update ref when value changes without animation (initial mount)
  useEffect(() => {
    if (previousValue.current !== value && !isAnimating) {
      previousValue.current = value;
      setDisplayValue(value);
    }
  }, [value, isAnimating]);

  const formattedValue = displayValue.toLocaleString(undefined, formatOptions);

  return (
    <span 
      className={cn(
        "tabular-nums transition-colors duration-300",
        isAnimating && "text-primary",
        className
      )}
    >
      {formattedValue}
    </span>
  );
}
