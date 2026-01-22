import { useState } from "react";
import { NCTRLogo } from "./NCTRLogo";
import { useUnifiedUser } from "@/contexts/UnifiedUserContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp, Lock, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

interface PortfolioIndicatorProps {
  className?: string;
}

export function PortfolioIndicator({ className }: PortfolioIndicatorProps) {
  const { tier, total360Locked, nextTier, progressToNextTier, portfolio, loading, refreshUnifiedProfile } = useUnifiedUser();
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);

  // Calculate totals
  const total90Locked = portfolio?.reduce((sum, w) => sum + (w.nctr_90_locked || 0), 0) || 0;
  const totalBalance = portfolio?.reduce((sum, w) => sum + (w.nctr_balance || 0), 0) || 0;
  const totalNCTR = total360Locked + total90Locked + totalBalance;
  const hasPortfolioData = portfolio && portfolio.length > 0 && totalNCTR > 0;

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Please sign in", variant: "destructive" });
        return;
      }

      const response = await supabase.functions.invoke('sync-garden-portfolio', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw new Error(response.error.message);

      if (response.data?.portfolio?.length > 0) {
        toast({ title: "Portfolio synced!" });
        await refreshUnifiedProfile();
      } else {
        toast({ title: "Opening The Garden to sync...", description: "Link your wallet there first" });
        window.open('https://thegarden.nctr.live', '_blank');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({ title: "Sync failed", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-9 w-24 bg-muted animate-pulse rounded-full" />
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
            "hover:bg-accent/50 cursor-pointer",
            className
          )}
          style={{
            borderColor: tier?.badge_color ? `${tier.badge_color}40` : 'hsl(var(--border))',
            backgroundColor: tier?.badge_color ? `${tier.badge_color}10` : undefined
          }}
        >
          <span className="text-base">{tier?.badge_emoji || '💧'}</span>
          <span className="font-semibold text-sm flex items-center gap-1">
            {totalNCTR.toLocaleString()}
            <NCTRLogo className="w-3.5 h-3.5" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-4">
        <div className="space-y-4">
          {/* Tier Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{tier?.badge_emoji || '💧'}</span>
              <div>
                <p className="font-bold text-lg" style={{ color: tier?.badge_color }}>
                  {tier?.display_name || 'Bronze'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status Member
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleSync}
              disabled={syncing}
              title="Sync from The Garden"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {!hasPortfolioData ? (
            // No portfolio data prompt
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                No portfolio data. Sync from The Garden to see your NCTR holdings.
              </p>
              <Button 
                size="sm" 
                className="gap-2"
                onClick={handleSync}
                disabled={syncing}
              >
                {syncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                Sync Portfolio
              </Button>
            </div>
          ) : (
            <>
              {/* Balance Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Lock className="w-3 h-3" /> 360LOCK
                  </span>
                  <span className="font-medium">{total360Locked.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Lock className="w-3 h-3" /> 90LOCK
                  </span>
                  <span className="font-medium">{total90Locked.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Available
                  </span>
                  <span className="font-medium">{totalBalance.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex items-center justify-between text-sm font-semibold">
                  <span>Total NCTR</span>
                  <span className="flex items-center gap-1">
                    {totalNCTR.toLocaleString()}
                    <NCTRLogo className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Tier Progress */}
              {nextTier && (
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${nextTier.badge_color}10` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">
                      Next: {nextTier.badge_emoji} {nextTier.display_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(progressToNextTier)}%
                    </span>
                  </div>
                  <Progress value={progressToNextTier} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Lock {(nextTier.min_nctr_360_locked - total360Locked).toLocaleString()} more NCTR
                  </p>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs"
              onClick={() => navigate('/membership')}
            >
              View Benefits
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs gap-1"
              onClick={() => window.open('https://thegarden.nctr.live', '_blank')}
            >
              The Garden
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
