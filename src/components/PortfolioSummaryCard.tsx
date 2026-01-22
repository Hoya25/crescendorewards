import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Lock, Wallet, TrendingUp, ExternalLink } from "lucide-react";
import { NCTRLogo } from "./NCTRLogo";
import { useUnifiedUser } from "@/contexts/UnifiedUserContext";
import { Button } from "./ui/button";

interface PortfolioSummaryCardProps {
  compact?: boolean;
  showLink?: boolean;
}

export function PortfolioSummaryCard({ compact = false, showLink = true }: PortfolioSummaryCardProps) {
  const { tier, portfolio, total360Locked, nextTier, progressToNextTier, loading } = useUnifiedUser();

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
  const total90Locked = portfolio?.reduce((sum, w) => sum + (w.nctr_90_locked || 0), 0) || 0;
  const totalBalance = portfolio?.reduce((sum, w) => sum + (w.nctr_balance || 0), 0) || 0;
  const totalUnlocked = portfolio?.reduce((sum, w) => sum + (w.nctr_unlocked || 0), 0) || 0;

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
            {tier && (
              <Badge 
                variant="outline" 
                className="gap-1"
                style={{ borderColor: tier.badge_color, color: tier.badge_color }}
              >
                {tier.badge_emoji} {tier.display_name}
              </Badge>
            )}
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
            Your NCTR Portfolio
          </CardTitle>
          {tier && (
            <Badge 
              variant="outline" 
              className="gap-1 px-3 py-1"
              style={{ borderColor: tier.badge_color, color: tier.badge_color }}
            >
              {tier.badge_emoji} {tier.display_name}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {/* Link to The Garden */}
        {showLink && (
          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={() => window.open('https://thegarden.app', '_blank')}
          >
            Manage in The Garden
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
