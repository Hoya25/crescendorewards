import { useTheme } from './ThemeProvider';
import nctrGrey from '@/assets/nctr-grey.png';
import nctrYellow from '@/assets/nctr-yellow.png';

interface NCTRLogoProps {
  className?: string;
}

export function NCTRLogo({ className = "inline-block h-[8.1rem] w-auto mx-1 align-middle" }: NCTRLogoProps) {
  const { theme } = useTheme();

  return (
    <img 
      src={theme === 'dark' ? nctrYellow : nctrGrey}
      alt="NCTR"
      className={className}
    />
  );
}
