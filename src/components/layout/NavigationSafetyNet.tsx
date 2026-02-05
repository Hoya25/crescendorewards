import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

/**
 * Safety net component that shows a "Back to Dashboard" button
 * if navigation elements are somehow not present.
 * 
 * This acts as a fallback to prevent users from getting trapped.
 */
export function NavigationSafetyNet() {
  const navigate = useNavigate();
  const [showSafetyNet, setShowSafetyNet] = useState(false);

  useEffect(() => {
    // Check if sidebar or main navigation is present after a short delay
    const checkNavigation = () => {
      const sidebar = document.querySelector('[data-sidebar]');
      const sidebarTrigger = document.querySelector('[data-sidebar-trigger]');
      const mainNav = document.querySelector('[data-main-nav]');
      
      // If no navigation elements found, show the safety net
      const hasNavigation = sidebar || sidebarTrigger || mainNav;
      setShowSafetyNet(!hasNavigation);
    };

    // Check after DOM has rendered
    const timeoutId = setTimeout(checkNavigation, 500);
    
    // Re-check on route changes
    window.addEventListener('popstate', checkNavigation);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('popstate', checkNavigation);
    };
  }, []);

  if (!showSafetyNet) return null;

  return (
    <div className="fixed top-4 left-4 z-[100] flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => navigate(-1)}
        className="gap-2 shadow-lg bg-white dark:bg-neutral-900 border"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={() => navigate('/dashboard')}
        className="gap-2 shadow-lg"
      >
        <Home className="w-4 h-4" />
        Dashboard
      </Button>
    </div>
  );
}

export default NavigationSafetyNet;
