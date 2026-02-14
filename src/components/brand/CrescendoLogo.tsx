import { useTheme } from '../ThemeProvider';
import crescendoLogoLight from '@/assets/crescendo-logo-light.png';
import crescendoLogoDark from '@/assets/crescendo-logo-dark.png';

interface CrescendoLogoProps {
  className?: string;
  showSubtitle?: boolean;
}

export function CrescendoLogo({ className = "", showSubtitle = true }: CrescendoLogoProps) {
  const { theme } = useTheme();
  
  // Use dark logo on dark theme (white text), light logo on light theme (dark text)
  const logoSrc = theme === 'dark' ? crescendoLogoDark : crescendoLogoLight;

  return (
    <img 
      src={logoSrc}
      alt="Crescendo Opportunity & Rewards Marketplace"
      className={`h-auto w-24 sm:w-28 md:w-30 object-contain ${className}`}
    />
  );
}
