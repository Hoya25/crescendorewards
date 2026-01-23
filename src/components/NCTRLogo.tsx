import { useTheme } from './ThemeProvider';
import nctrGrey from '@/assets/nctr-grey.png';
import nctrYellow from '@/assets/nctr-yellow.png';

interface NCTRLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** 
   * Force a specific variant regardless of theme
   * - 'dark': Use yellow/green logo (for dark backgrounds)
   * - 'light': Use grey logo (for light backgrounds)
   * - 'auto': Switch based on current theme (default)
   */
  variant?: 'dark' | 'light' | 'auto';
}

const sizeClasses = {
  xs: "inline-block h-12 w-auto mx-0.5 align-middle",
  sm: "inline-block h-[3.75rem] w-auto mx-1 align-middle",
  md: "inline-block h-[4.5rem] w-auto mx-1 align-middle",
  lg: "inline-block h-24 w-auto mx-1 align-middle",
  xl: "inline-block h-36 w-auto mx-2 align-middle"
};

export function NCTRLogo({ className, size = 'md', variant = 'auto' }: NCTRLogoProps) {
  const defaultClass = sizeClasses[size];
  const { theme } = useTheme();

  // Determine which logo to use based on variant or theme
  const useDarkVariant = variant === 'dark' || (variant === 'auto' && theme === 'dark');
  const logoSrc = useDarkVariant ? nctrYellow : nctrGrey;

  return (
    <img 
      src={logoSrc}
      alt="NCTR"
      className={className || defaultClass}
    />
  );
}
