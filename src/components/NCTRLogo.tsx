import { useTheme } from './ThemeProvider';

interface NCTRLogoProps {
  className?: string;
}

export function NCTRLogo({ className = "inline-block h-[2.7rem] w-auto mx-1 align-middle" }: NCTRLogoProps) {
  const { theme } = useTheme();

  // Simple text logo as placeholder - can be replaced with actual logo images
  return (
    <div className={`${className} flex items-center justify-center font-bold text-2xl ${theme === 'dark' ? 'text-yellow-500' : 'text-gray-700'}`}>
      NCTR
    </div>
  );
}
