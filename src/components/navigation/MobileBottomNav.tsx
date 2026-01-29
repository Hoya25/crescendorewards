import { useState } from "react";
import { Home, Gift, Plus, UserPlus, User, Hexagon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ImpactEnginesSheet } from "./ImpactEnginesSheet";

interface NavItem {
  icon: React.ElementType;
  label: string;
  route?: string;
  highlight?: boolean;
  action?: 'engines';
}

const navItems: NavItem[] = [
  { icon: Home, label: "Home", route: "/dashboard" },
  { icon: Gift, label: "Rewards", route: "/rewards" },
  { icon: Plus, label: "Get Claims", route: "/buy-claims", highlight: true },
  { icon: Hexagon, label: "Engines", action: 'engines' },
  { icon: User, label: "Profile", route: "/profile" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [enginesSheetOpen, setEnginesSheetOpen] = useState(false);

  const isActive = (route?: string) => {
    if (!route) return false;
    if (route === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    // Check if we're in any engine route
    if (location.pathname.startsWith('/groundball') || 
        location.pathname.startsWith('/throttle') ||
        location.pathname.startsWith('/stardust') ||
        location.pathname.startsWith('/sweat') ||
        location.pathname.startsWith('/sisu')) {
      return false; // Don't highlight other nav items when in engine routes
    }
    return location.pathname.startsWith(route);
  };

  // Check if any engine is currently active
  const isEngineActive = location.pathname.startsWith('/groundball') || 
    location.pathname.startsWith('/throttle') ||
    location.pathname.startsWith('/stardust') ||
    location.pathname.startsWith('/sweat') ||
    location.pathname.startsWith('/sisu');

  const handleNavClick = (item: NavItem) => {
    if (item.action === 'engines') {
      setEnginesSheetOpen(true);
    } else if (item.route) {
      navigate(item.route);
    }
  };

  return (
    <>
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-lg border-t border-border safe-area-inset-bottom"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.action === 'engines' ? isEngineActive : isActive(item.route);
            
            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[60px] transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                  item.highlight && !active && "text-primary",
                  item.action === 'engines' && isEngineActive && "text-emerald-500"
                )}
              >
                {item.highlight ? (
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center -mt-4 shadow-lg transition-all",
                    active 
                      ? "bg-primary text-primary-foreground scale-110" 
                      : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                ) : (
                  <Icon className={cn(
                    "w-5 h-5 transition-all",
                    active && "scale-110",
                    item.action === 'engines' && isEngineActive && "text-emerald-500"
                  )} />
                )}
                <span className={cn(
                  "text-xs font-medium transition-colors",
                  item.highlight && "-mt-1",
                  item.action === 'engines' && isEngineActive && "text-emerald-500"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Impact Engines Sheet */}
      <ImpactEnginesSheet 
        open={enginesSheetOpen} 
        onOpenChange={setEnginesSheetOpen} 
      />
    </>
  );
}
