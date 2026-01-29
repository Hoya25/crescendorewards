import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { Sparkles, X, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DemoModeToggle() {
  const { demoMode, isDemoMode, toggleDemoMode, setDemoTier } = useDemoMode();
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show in development/preview
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Demo Mode Active Banner */}
      {isDemoMode && (
        <div className="bg-amber-500/90 text-slate-900 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          DEMO MODE: {demoMode.statusTier.toUpperCase()}
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
          className="w-72 bg-slate-900 border-slate-700 p-4"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Demo Mode
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
              Simulate different user statuses for demos and testing.
            </p>

            {/* Tier Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Select Status Tier</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDemoTier('bronze')}
                  className={cn(
                    "h-9 text-xs border-orange-500/50",
                    demoMode.statusTier === 'bronze' 
                      ? "bg-orange-500/20 text-orange-400 border-orange-500" 
                      : "text-slate-400 hover:text-orange-400 hover:border-orange-500"
                  )}
                >
                  🥉 Bronze
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDemoTier('silver')}
                  className={cn(
                    "h-9 text-xs border-slate-400/50",
                    demoMode.statusTier === 'silver' 
                      ? "bg-slate-400/20 text-slate-300 border-slate-400" 
                      : "text-slate-400 hover:text-slate-300 hover:border-slate-400"
                  )}
                >
                  🥈 Silver
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDemoTier('gold')}
                  className={cn(
                    "h-9 text-xs border-amber-500/50",
                    demoMode.statusTier === 'gold' 
                      ? "bg-amber-500/20 text-amber-400 border-amber-500" 
                      : "text-slate-400 hover:text-amber-400 hover:border-amber-500"
                  )}
                >
                  🥇 Gold
                </Button>
              </div>
            </div>

            {/* Demo Stats Preview */}
            {isDemoMode && (
              <div className="bg-slate-800/50 rounded-lg p-3 space-y-2 border border-slate-700">
                <h5 className="text-xs font-medium text-slate-300">Demo User Stats</h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">$GBS Locked:</span>
                    <span className="text-emerald-400 font-medium">{demoMode.groundballLocked}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Slots:</span>
                    <span className="text-white font-medium">{demoMode.selectionsUsed}/{demoMode.selectionsMax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Claims:</span>
                    <span className="text-amber-400 font-medium">{demoMode.claimsBalance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Free Swaps:</span>
                    <span className="text-sky-400 font-medium">{demoMode.freeSwapsRemaining}</span>
                  </div>
                </div>
              </div>
            )}

            <p className="text-[10px] text-slate-500 italic">
              Only visible in development/preview mode
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default DemoModeToggle;
