import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors no-min-touch"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all duration-200 dark:-rotate-90 dark:scale-0 text-foreground" />
      <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all duration-200 dark:rotate-0 dark:scale-100 text-foreground" />
      <span className="sr-only">{isDark ? 'Switch to light mode' : 'Switch to dark mode'}</span>
    </Button>
  );
}
