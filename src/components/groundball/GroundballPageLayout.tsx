import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, Coins, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GroundballSecondaryNav } from './GroundballSecondaryNav';
import { GroundballStatusBadge } from './GroundballStatusBadge';
import { useGroundballStatus } from '@/hooks/useGroundballStatus';

interface GroundballPageLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  showStatusBadge?: boolean;
  showSecondaryNav?: boolean;
  headerActions?: ReactNode;
  className?: string;
}

export function GroundballPageLayout({
  children,
  title = 'GROUNDBALL',
  subtitle,
  showBackButton = false,
  showStatusBadge = false,
  showSecondaryNav = true,
  headerActions,
  className,
}: GroundballPageLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { claimsBalance } = useGroundballStatus();

  // Determine parent route for back navigation
  const getBackRoute = () => {
    const path = location.pathname;
    if (path === '/groundball') return '/dashboard';
    if (path.startsWith('/groundball/')) return '/groundball';
    return '/groundball';
  };

  // Generate breadcrumb trail
  const getBreadcrumbs = () => {
    const crumbs = [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'GROUNDBALL', path: '/groundball', icon: null },
    ];
    
    const path = location.pathname;
    if (path === '/groundball/rewards') {
      crumbs.push({ label: 'Rewards', path: '/groundball/rewards', icon: null });
    } else if (path === '/groundball/my-rewards') {
      crumbs.push({ label: 'My Rewards', path: '/groundball/my-rewards', icon: null });
    } else if (path === '/groundball/gear-vault') {
      crumbs.push({ label: 'Gear Vault', path: '/groundball/gear-vault', icon: null });
    }
    
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950",
      className
    )}>
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 border-b border-emerald-500/20 bg-slate-950/95 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          {/* Top Row: Navigation & Actions */}
          <div className="flex items-center justify-between py-3">
            {/* Left: Back + Breadcrumbs */}
            <div className="flex items-center gap-2">
              {/* Back Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(getBackRoute())}
                className="text-slate-400 hover:text-white h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              {/* Breadcrumbs */}
              <nav className="hidden sm:flex items-center gap-1 text-sm">
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb.path} className="flex items-center">
                    {i > 0 && <span className="text-slate-600 mx-1">/</span>}
                    {i === breadcrumbs.length - 1 ? (
                      <span className="text-white font-medium">{crumb.label}</span>
                    ) : (
                      <Link 
                        to={crumb.path}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                ))}
              </nav>
              
              {/* Mobile Title */}
              <div className="sm:hidden">
                <h1 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🥍</span> {title}
                </h1>
              </div>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Dashboard Quick Link */}
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden md:flex text-slate-400 hover:text-white"
              >
                <Link to="/dashboard">
                  <Home className="w-4 h-4 mr-1.5" />
                  Dashboard
                </Link>
              </Button>
              
              {/* Claims Balance */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">{claimsBalance}</span>
              </div>
              
              {/* Custom Header Actions */}
              {headerActions}
            </div>
          </div>
          
          {/* Title Row (Desktop) */}
          <div className="hidden sm:flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🥍</span>
              <div>
                <h1 className="text-xl font-bold text-white">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-slate-400">{subtitle}</p>
                )}
              </div>
            </div>
            
            {/* Inline Status Badge */}
            {showStatusBadge && (
              <GroundballStatusBadge size="sm" showProgress={false} showSelections />
            )}
          </div>
          
          {/* Secondary Navigation */}
          {showSecondaryNav && (
            <div className="py-3">
              <GroundballSecondaryNav />
            </div>
          )}
        </div>
      </header>
      
      {/* Page Content */}
      <main>
        {children}
      </main>
    </div>
  );
}

export default GroundballPageLayout;
