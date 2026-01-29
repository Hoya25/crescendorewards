// Impact Engines collapsible navigation group for main sidebar
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Hexagon, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IMPACT_ENGINES, type ImpactEngine } from '@/constants/impactEngines';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

interface ImpactEnginesNavProps {
  onNavigate?: () => void;
}

export function ImpactEnginesNav({ onNavigate }: ImpactEnginesNavProps) {
  const { open } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);

  const isEngineActive = (engine: ImpactEngine) => {
    return location.pathname.startsWith(engine.routes.root);
  };

  const anyEngineActive = IMPACT_ENGINES.some(e => isEngineActive(e));

  const handleEngineClick = (engine: ImpactEngine) => {
    if (engine.isActive) {
      navigate(engine.routes.root);
      onNavigate?.();
    }
  };

  // Collapsed sidebar view - show only the icon
  if (!open) {
    return (
      <SidebarGroup className="px-2">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/groundball')}
                className={cn(
                  "cursor-pointer",
                  anyEngineActive && "bg-emerald-500/10 text-emerald-500"
                )}
                title="Impact Engines"
              >
                <Hexagon className={cn(
                  "h-4 w-4",
                  anyEngineActive ? "text-emerald-500" : "text-muted-foreground"
                )} />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <SidebarGroup className="py-0">
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel
            className={cn(
              "cursor-pointer flex items-center justify-between px-2 py-2 text-xs font-semibold uppercase tracking-wider rounded-md",
              "hover:bg-accent/50 transition-colors",
              anyEngineActive && "text-emerald-500"
            )}
          >
            <div className="flex items-center gap-2">
              <Hexagon className={cn(
                "h-3.5 w-3.5",
                anyEngineActive ? "text-emerald-500" : "text-muted-foreground"
              )} />
              <span>Impact Engines</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </SidebarGroupLabel>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {IMPACT_ENGINES.map((engine) => {
                const isActive = isEngineActive(engine);
                const isDisabled = !engine.isActive;

                return (
                  <SidebarMenuItem key={engine.slug}>
                    <SidebarMenuButton
                      onClick={() => handleEngineClick(engine)}
                      disabled={isDisabled}
                      className={cn(
                        "cursor-pointer pl-6 relative",
                        isActive && "bg-emerald-500/10 text-emerald-500",
                        isDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
                      )}
                    >
                      <span className="text-base mr-2">{engine.icon}</span>
                      <div className="flex items-center justify-between flex-1">
                        <span className={cn(
                          "font-medium text-sm",
                          isActive && "text-emerald-500",
                          isDisabled && "text-muted-foreground"
                        )}>
                          {engine.displayName}
                        </span>
                        {isDisabled && (
                          <Badge 
                            variant="secondary" 
                            className="text-[10px] px-1.5 py-0 h-4 bg-muted/50 text-muted-foreground"
                          >
                            Soon
                          </Badge>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
