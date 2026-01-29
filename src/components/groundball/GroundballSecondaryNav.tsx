// Secondary navigation for /groundball/* routes
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { GROUNDBALL_NAV_TABS } from '@/constants/impactEngines';

interface GroundballSecondaryNavProps {
  className?: string;
}

export function GroundballSecondaryNav({ className }: GroundballSecondaryNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (tab: typeof GROUNDBALL_NAV_TABS[0]) => {
    if (tab.exact) {
      return location.pathname === tab.path;
    }
    return location.pathname.startsWith(tab.path);
  };

  return (
    <nav className={cn(
      "flex items-center gap-1 p-1 bg-slate-900/50 rounded-lg border border-emerald-500/20 overflow-x-auto",
      className
    )}>
      {GROUNDBALL_NAV_TABS.map((tab) => {
        const active = isActive(tab);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all",
              active 
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25" 
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

// Wrapper component that renders the secondary nav only on /groundball/* routes
export function GroundballSecondaryNavWrapper() {
  const location = useLocation();
  
  // Only show on /groundball routes
  if (!location.pathname.startsWith('/groundball')) {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-lg border-b border-emerald-500/20 py-3">
      <div className="container mx-auto px-4">
        <GroundballSecondaryNav />
      </div>
    </div>
  );
}
