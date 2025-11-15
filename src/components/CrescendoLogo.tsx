import { useTheme } from './ThemeProvider';

interface CrescendoLogoProps {
  className?: string;
  showSubtitle?: boolean;
}

export function CrescendoLogo({ className = "", showSubtitle = true }: CrescendoLogoProps) {
  const { theme } = useTheme();

  // Simple text logo as placeholder - can be replaced with actual logo image
  return (
    <div className={`${theme === 'light' ? 'text-gray-900' : 'text-white'} ${className} font-bold text-3xl`} style={{
      width: '300px',
      minWidth: '300px'
    }}>
      Crescendo
      {showSubtitle && <div className="text-sm font-normal text-gray-600 dark:text-gray-400">Rewards Alliance</div>}
    </div>
  );
}
