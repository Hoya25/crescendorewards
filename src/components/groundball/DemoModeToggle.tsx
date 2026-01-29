import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { useDemoMode, type DemoTier } from '@/contexts/DemoModeContext';
import { Sparkles, X, ChevronUp, ChevronDown, User, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const TIER_OPTIONS: { tier: DemoTier; label: string; emoji: string; color: string; description: string }[] = [
  { 
    tier: 'none', 
    label: 'Visitor', 
    emoji: '👤', 
    color: 'slate',
    description: '0 $GBS • No slots • New user view'
  },
  { 
    tier: 'bronze', 
    label: 'Bronze', 
    emoji: '🥉', 
    color: 'orange',
    description: '150 $GBS • 2 slots • Entry tier'
  },
  { 
    tier: 'silver', 
    label: 'Silver', 
    emoji: '🥈', 
    color: 'slate',
    description: '300 $GBS • 4 slots • Mid tier'
  },
  { 
    tier: 'gold', 
    label: 'Gold', 
    emoji: '🥇', 
    color: 'amber',
    description: '750 $GBS • 7 slots • Full access'
  },
];

export function DemoModeToggle() {
  const { demoMode, isDemoMode, toggleDemoMode, setDemoTier, enableDemoMode } = useDemoMode();
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show in development/preview
  if (import.meta.env.PROD) {
    return null;
  }

  const currentTierOption = TIER_OPTIONS.find(t => t.tier === demoMode.statusTier) || TIER_OPTIONS[3];

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Demo Mode Active Banner */}
      {isDemoMode && (
        <div className={cn(
          "px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg",
          demoMode.statusTier === 'gold' && "bg-amber-500/90 text-slate-900",
          demoMode.statusTier === 'silver' && "bg-slate-400/90 text-slate-900",
          demoMode.statusTier === 'bronze' && "bg-orange-500/90 text-white",
          demoMode.statusTier === 'none' && "bg-slate-600/90 text-white",
        )}>
          <Eye className="w-3.5 h-3.5" />
          DEMO: {currentTierOption.label.toUpperCase()}
        </div>
      )}

      <Popover open={isExpanded} onOpenChange={setIsExpanded}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            className={cn(
              "shadow-lg transition-all",
              isDemoMode 
                ? "bg-amber-500 hover:bg-amber-600 text-slate-900" 
                : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-600"
            )}
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Demo Mode
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 ml-1" />
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          side="top" 
          align="end" 
          className="w-80 bg-slate-900 border-slate-700 p-4"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Investor Demo Mode
              </h4>
              <Button
                size="sm"
                variant={isDemoMode ? "destructive" : "default"}
                onClick={toggleDemoMode}
                className={cn(
                  "h-7 text-xs",
                  !isDemoMode && "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                {isDemoMode ? (
                  <>
                    <X className="w-3 h-3 mr-1" /> Disable
                  </>
                ) : (
                  'Enable'
                )}
              </Button>
            </div>

            <p className="text-xs text-slate-400">
              Quickly switch between user states to showcase the full GROUNDBALL experience.
            </p>

            {/* Tier Selection - Vertical Layout */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Select Demo View</label>
              <div className="space-y-1.5">
                {TIER_OPTIONS.map((option) => (
                  <button
                    key={option.tier}
                    onClick={() => {
                      setDemoTier(option.tier);
                      if (!isDemoMode) {
                        enableDemoMode(option.tier);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left",
                      demoMode.statusTier === option.tier && isDemoMode
                        ? option.tier === 'gold' 
                          ? "bg-amber-500/20 border-amber-500 text-amber-400"
                          : option.tier === 'silver'
                          ? "bg-slate-400/20 border-slate-400 text-slate-300"
                          : option.tier === 'bronze'
                          ? "bg-orange-500/20 border-orange-500 text-orange-400"
                          : "bg-slate-600/20 border-slate-500 text-slate-300"
                        : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                    )}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{option.label}</div>
                      <div className="text-xs opacity-70">{option.description}</div>
                    </div>
                    {demoMode.statusTier === option.tier && isDemoMode && (
                      <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Demo Stats Preview */}
            {isDemoMode && (
              <div className="bg-slate-800/50 rounded-lg p-3 space-y-2 border border-slate-700">
                <h5 className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  Current Demo Stats
                </h5>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">$GBS Locked:</span>
                    <span className="text-emerald-400 font-bold">{demoMode.groundballLocked}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Slots:</span>
                    <span className="text-white font-bold">
                      {demoMode.selectionsUsed}/{demoMode.selectionsMax + demoMode.bonusSelections}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Claims:</span>
                    <span className="text-amber-400 font-bold">{demoMode.claimsBalance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Free Swaps:</span>
                    <span className="text-sky-400 font-bold">{demoMode.freeSwapsRemaining}</span>
                  </div>
                  {demoMode.bonusSelections > 0 && (
                    <div className="flex justify-between col-span-2">
                      <span className="text-slate-400">Bonus Slots:</span>
                      <span className="text-purple-400 font-bold">+{demoMode.bonusSelections}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="text-[10px] text-slate-500 italic text-center">
              🔒 Only visible in development/preview mode
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default DemoModeToggle;
