import { Home, Compass, Gift, UserPlus, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", route: "/dashboard" },
  { icon: Compass, label: "Discover", route: "/discover" },
  { icon: Gift, label: "Rewards", route: "/rewards" },
  { icon: UserPlus, label: "Invite", route: "/invite" },
  { icon: User, label: "Account", route: "/profile" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (route?: string) => {
    if (!route) return false;
    if (route === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(route);
  };

  const handleClick = (item: typeof navItems[0]) => {
    if ((item as any).external) {
      window.open((item as any).external, '_blank');
    } else if (item.route) {
      navigate(item.route);
    }
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-lg border-t border-border safe-area-inset-bottom"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.route);
          
          return (
            <button
              key={item.label}
              onClick={() => handleClick(item)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[60px] transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-all", active && "scale-110")} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
