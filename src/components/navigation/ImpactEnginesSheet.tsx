// Mobile Impact Engines modal/sheet
import { useNavigate } from 'react-router-dom';
import { Hexagon, Lock, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IMPACT_ENGINES, type ImpactEngine } from '@/constants/impactEngines';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface ImpactEnginesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImpactEnginesSheet({ open, onOpenChange }: ImpactEnginesSheetProps) {
  const navigate = useNavigate();

  const handleEngineClick = (engine: ImpactEngine) => {
    if (engine.isActive) {
      navigate(engine.routes.root);
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-primary/20">
              <Hexagon className="w-5 h-5 text-emerald-500" />
            </div>
            Impact Engines
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Token-powered community reward engines
          </p>
        </SheetHeader>

        <div className="space-y-2 pb-8">
          {IMPACT_ENGINES.map((engine) => {
            const isDisabled = !engine.isActive;

            return (
              <button
                key={engine.slug}
                onClick={() => handleEngineClick(engine)}
                disabled={isDisabled}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left",
                  engine.isActive 
                    ? "bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/30 hover:border-emerald-500/50 active:scale-[0.98]"
                    : "bg-muted/30 border border-muted opacity-60"
                )}
              >
                {/* Engine Icon */}
                <div 
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                    engine.isActive 
                      ? "bg-emerald-500/20" 
                      : "bg-muted/50"
                  )}
                  style={engine.isActive ? { 
                    backgroundColor: `${engine.color}20`,
                  } : undefined}
                >
                  {engine.icon}
                </div>

                {/* Engine Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-semibold",
                      engine.isActive ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {engine.displayName}
                    </span>
                    {engine.isActive && (
                      <Badge 
                        variant="secondary" 
                        className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-xs"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">
                    {engine.isActive ? engine.description : engine.comingSoonText}
                  </p>
                </div>

                {/* Action indicator */}
                {engine.isActive ? (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Info */}
        <div className="pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            More engines launching throughout 2025
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
