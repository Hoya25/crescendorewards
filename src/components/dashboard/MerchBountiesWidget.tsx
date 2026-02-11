import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Lock, ChevronRight, Sparkles, ArrowUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUnifiedUser } from "@/contexts/UnifiedUserContext";

const TIER_HIERARCHY = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

const NEXT_TIER_INFO: Record<string, { name: string; maxNctr: string }> = {
  bronze: { name: 'Silver', maxNctr: '1,000' },
  silver: { name: 'Gold', maxNctr: '5,000' },
  gold: { name: 'Platinum', maxNctr: '15,000' },
  platinum: { name: 'Diamond', maxNctr: '50,000' },
};

export function MerchBountiesWidget() {
  const { profile, tier, nextTier, progressToNextTier, total360Locked } = useUnifiedUser();
  const tierName = (tier?.tier_name || 'bronze').toLowerCase();
  const tierIndex = TIER_HIERARCHY.indexOf(tierName);

  // Check if user has any merch purchases
  const { data: eligibility, isLoading: eligLoading } = useQuery({
    queryKey: ['merch-bounty-eligibility', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase
        .from('merch_purchase_bounty_eligibility')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!profile?.id,
  });

  // Get merch bounty counts by accessibility
  const { data: bountyCounts, isLoading: bountyLoading } = useQuery({
    queryKey: ['merch-bounty-counts', tierName],
    queryFn: async () => {
      const { data: allBounties, error } = await supabase
        .from('bounties')
        .select('id, min_status_required')
        .eq('is_active', true)
        .eq('requires_purchase', true)
        .in('bounty_tier', ['merch_tier1', 'merch_tier2', 'merch_tier3', 'merch_recurring']);

      if (error) throw error;

      const accessibleStatuses: (string | null)[] = [null];
      for (let i = 0; i <= tierIndex; i++) {
        accessibleStatuses.push(TIER_HIERARCHY[i]);
      }

      let accessible = 0;
      let locked = 0;
      for (const bounty of allBounties || []) {
        const req = bounty.min_status_required?.toLowerCase() || null;
        if (req === null || accessibleStatuses.includes(req)) {
          accessible++;
        } else {
          locked++;
        }
      }

      return { accessible, locked, total: (allBounties || []).length };
    },
  });

  const isLoading = eligLoading || bountyLoading;

  // Only show widget if user has merch purchases or there are bounties
  if (!isLoading && !eligibility && (!bountyCounts || bountyCounts.total === 0)) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  const nextTierInfo = NEXT_TIER_INFO[tierName];
  const isGoldOrAbove = tierIndex >= 2;

  // Calculate NCTR needed for next tier
  const nctrToNextTier = nextTier?.min_nctr_360_locked
    ? Math.max(0, nextTier.min_nctr_360_locked - (total360Locked || 0))
    : 0;

  // Count locked bounties at the next tier
  const lockedBountyValue = tierName === 'bronze' ? '1,500' : tierName === 'silver' ? '3,000' : '0';

  return (
    <Card className="border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-amber-500" />
          Merch Bounties
          {eligibility && (
            <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs">
              Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bounty Counts */}
        <div className="flex items-center gap-4">
          <div className="flex-1 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
            <p className="text-2xl font-bold text-emerald-500">{bountyCounts?.accessible || 0}</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
          {(bountyCounts?.locked || 0) > 0 && (
            <div className="flex-1 p-3 rounded-lg bg-muted/50 border border-border text-center">
              <div className="flex items-center justify-center gap-1">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <p className="text-2xl font-bold text-muted-foreground">{bountyCounts.locked}</p>
              </div>
              <p className="text-xs text-muted-foreground">Locked</p>
            </div>
          )}
        </div>

        {/* 360LOCK CTA */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium">Earn 3x with 360LOCK</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Complete bounties with 360LOCK to earn 3x and level up your Crescendo status
          </p>
        </div>

        {/* Status Progress (below Gold) */}
        {!isGoldOrAbove && nextTierInfo && (
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium flex items-center gap-1">
                <ArrowUp className="w-3 h-3 text-primary" />
                {tier?.display_name || 'Bronze'} → {nextTierInfo.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {nctrToNextTier.toLocaleString()} more NCTR to lock
              </span>
            </div>
            <Progress value={progressToNextTier || 0} className="h-1.5 mb-2" />
            <p className="text-xs text-muted-foreground">
              Reaching {nextTierInfo.name} unlocks {bountyCounts?.locked || 0} more merch bounties worth up to {lockedBountyValue} NCTR
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to="/bounties">
              View Bounties
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
          <Button asChild size="sm" className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
            <a href="https://nctr-merch.myshopify.com" target="_blank" rel="noopener noreferrer">
              Shop Merch
              <ShoppingBag className="w-4 h-4 ml-1" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default MerchBountiesWidget;
