import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Lock, Wallet, TrendingUp, ExternalLink, RefreshCw, Clock } from "lucide-react";
import { NCTRLogo } from "./NCTRLogo";
import { useUnifiedUser } from "@/contexts/UnifiedUserContext";
import { Button } from "./ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { usePortfolioSync } from "@/hooks/usePortfolioSync";
import { NCTRHelp, LockHelp, TierHelp } from "@/components/ui/help-tooltip";

interface PortfolioSummaryCardProps {
  compact?: boolean;
  showLink?: boolean;
}

export function PortfolioSummaryCard({ compact = false, showLink = true }: PortfolioSummaryCardProps) {
  const { tier, portfolio, profile, total360Locked, nextTier, progressToNextTier, loading, refreshUnifiedProfile } = useUnifiedUser();
  const [syncing, setSyncing] = useState(false);
  
  // Use the portfolio sync hook for optimistic updates
  const { isSyncing: hookSyncing } = usePortfolioSync({ 
    userId: profile?.id,
    onSyncSuccess: () => refreshUnifiedProfile(),
  });

  const handleSyncFromGarden = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Not authenticated",
          description: "Please sign in to sync your portfolio",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke('sync-garden-portfolio', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      
      if (data.portfolio?.length > 0) {
        toast({
          title: "Portfolio synced!",
          description: `Found ${data.portfolio.length} wallet(s) with data`,
        });
        await refreshUnifiedProfile();
      } else {
        toast({
          title: "No portfolio data yet",
          description: "Your account is synced but no wallet data found. Link a wallet in The Garden first.",
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Failed to sync portfolio",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };
  
  const isCurrentlySyncing = syncing || hookSyncing;

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-5 bg-muted rounded w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-8 bg-muted rounded w-24" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals from portfolio
  const portfolioTotal90 = portfolio?.reduce((sum, w) => sum + (w.nctr_90_locked || 0), 0) || 0;
  const portfolioBalance = portfolio?.reduce((sum, w) => sum + (w.nctr_balance || 0), 0) || 0;
  const portfolioUnlocked = portfolio?.reduce((sum, w) => sum + (w.nctr_unlocked || 0), 0) || 0;
  
  // Fallback to crescendo_data if wallet_portfolio is empty
  const crescendoLocked = (profile?.crescendo_data?.locked_nctr as number) || 0;
  const crescendoAvailable = (profile?.crescendo_data?.available_nctr as number) || 0;
  const hasWalletData = portfolio && portfolio.length > 0 && (portfolioTotal90 > 0 || portfolioBalance > 0 || portfolioUnlocked > 0);
  
  // Use wallet data if available, otherwise use crescendo_data
  const total90Locked = hasWalletData ? portfolioTotal90 : 0;
  const totalBalance = hasWalletData ? portfolioBalance : crescendoAvailable;
  const totalUnlocked = hasWalletData ? portfolioUnlocked : 0;
  
  // Has data if either wallet_portfolio or crescendo_data has values
  const hasPortfolioData = (portfolio && portfolio.length > 0) || total360Locked > 0 || totalBalance > 0;
  
  // Get the most recent sync time from all wallets
  const lastSyncedAt = portfolio?.reduce((latest, w) => {
    if (!w.last_synced_at) return latest;
    const syncDate = new Date(w.last_synced_at);
    return !latest || syncDate > latest ? syncDate : latest;
  }, null as Date | null);
  
  // Fallback sync time from crescendo_data
  const crescendoSyncedAt = profile?.crescendo_data?.synced_at 
    ? new Date(profile.crescendo_data.synced_at as string) 
    : null;
  const displaySyncTime = lastSyncedAt || crescendoSyncedAt;

  if (compact) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <NCTRLogo className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total NCTR</p>
                <p className="text-xl font-bold">{(total360Locked + total90Locked + totalBalance).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {tier && (
                <Badge 
                  variant="outline" 
                  className="gap-1"
                  style={{ borderColor: tier.badge_color, color: tier.badge_color }}
                >
                  {tier.badge_emoji} {tier.display_name}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleSyncFromGarden}
                disabled={isCurrentlySyncing}
              >
                <RefreshCw className={`w-4 h-4 ${isCurrentlySyncing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Your NCTR
            <NCTRHelp />
          </CardTitle>
          <div className="flex items-center gap-2">
            {tier && (
              <Badge 
                variant="outline" 
                className="gap-1 px-3 py-1"
                style={{ borderColor: tier.badge_color, color: tier.badge_color }}
              >
                {tier.badge_emoji} {tier.display_name}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleSyncFromGarden}
              disabled={isCurrentlySyncing}
              title="Sync from The Garden"
            >
              <RefreshCw className={`w-4 h-4 ${isCurrentlySyncing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasPortfolioData ? (
          // No portfolio data - show sync prompt
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Wallet className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No portfolio data found</p>
              <p className="text-sm text-muted-foreground">
                Sync your wallet from The Garden to see your NCTR holdings
              </p>
            </div>
            <Button 
              onClick={handleSyncFromGarden}
              disabled={isCurrentlySyncing}
              className="gap-2"
            >
              {isCurrentlySyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Sync from The Garden
            </Button>
          </div>
        ) : (
          <>
            {/* Total Balance */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Total NCTR</span>
              <span className="text-2xl font-bold flex items-center gap-2">
                {(total360Locked + total90Locked + totalBalance).toLocaleString()}
                <NCTRLogo className="w-5 h-5" />
              </span>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-1 text-primary mb-1">
                  <Lock className="w-3 h-3" />
                  <span className="text-xs font-medium">360LOCK</span>
                  <LockHelp />
                </div>
                <p className="font-semibold">{total360Locked.toLocaleString()}</p>
              </div>
              
              <div className="p-3 rounded-lg bg-secondary/50 border border-secondary">
                <div className="flex items-center gap-1 text-secondary-foreground mb-1">
                  <Lock className="w-3 h-3" />
                  <span className="text-xs font-medium">90LOCK</span>
                </div>
                <p className="font-semibold">{total90Locked.toLocaleString()}</p>
              </div>
              
              <div className="p-3 rounded-lg bg-accent/50 border border-accent">
                <div className="flex items-center gap-1 text-accent-foreground mb-1">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs font-medium">Available</span>
                </div>
                <p className="font-semibold">{(totalBalance + totalUnlocked).toLocaleString()}</p>
              </div>
            </div>

            {/* Tier Progress */}
            {nextTier && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress to {nextTier.display_name}</span>
                  <span className="font-medium">{Math.round(progressToNextTier)}%</span>
                </div>
                <Progress value={progressToNextTier} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Lock {(nextTier.min_nctr_360_locked - total360Locked).toLocaleString()} more NCTR to reach {nextTier.display_name}
                </p>
              </div>
            )}
            {/* Last Synced Indicator */}
            {displaySyncTime && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Synced {formatDistanceToNow(displaySyncTime, { addSuffix: true })}</span>
              </div>
            )}
          </>
        )}

        {/* Link to The Garden */}
        {showLink && hasPortfolioData && (
          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={() => window.open('https://thegarden.nctr.live', '_blank')}
          >
            Manage in The Garden
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
