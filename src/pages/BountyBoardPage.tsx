import { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBounties, useBountyClaims, useMerchEligibility, useBountyStats, Bounty } from '@/hooks/useBounties';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { BountyCard } from '@/components/bounties/BountyCard';
import { BountyClaimDialog } from '@/components/bounties/BountyClaimDialog';
import { BountyBoardHero } from '@/components/bounties/BountyBoardHero';
import { LockedBountiesSection } from '@/components/bounties/LockedBountiesSection';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

type FilterTab = 'all' | 'available' | 'merch' | 'recurring';

const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

function isTierSufficient(userTierName: string | undefined, requiredTier: string | null): boolean {
  if (!requiredTier) return true;
  if (!userTierName) return false;
  return TIER_ORDER.indexOf(userTierName.toLowerCase()) >= TIER_ORDER.indexOf(requiredTier.toLowerCase());
}

export default function BountyBoardPage() {
  const { user } = useAuthContext();
  const { profile, tier, nextTier, total360Locked } = useUnifiedUser();
  const { data: bounties = [], isLoading } = useBounties();
  const { data: claims = [] } = useBountyClaims();
  const { data: merchEligibility = [] } = useMerchEligibility();

  const hasCompletedAny = claims.length > 0;

  // Default to 'available' for new users, 'all' for returning
  const [filter, setFilter] = useState<FilterTab>(hasCompletedAny ? 'all' : 'available');
  const [claimTarget, setClaimTarget] = useState<Bounty | null>(null);
  const [claiming, setClaiming] = useState(false);

  // Update default filter when claims load
  useEffect(() => {
    if (!hasCompletedAny) setFilter('available');
  }, [hasCompletedAny]);

  const hasMerchEligibility = merchEligibility.length > 0;
  const userTierName = tier?.tier_name?.toLowerCase();

  // Split bounties: available vs locked (by status)
  const { availableBounties, lockedBounties } = useMemo(() => {
    const available: Bounty[] = [];
    const locked: Bounty[] = [];
    for (const b of bounties) {
      const meets = isTierSufficient(userTierName, b.min_status_required);
      const needsPurchase = b.requires_purchase && !hasMerchEligibility;
      if (!meets || needsPurchase) {
        locked.push(b);
      } else {
        available.push(b);
      }
    }
    return { availableBounties: available, lockedBounties: locked };
  }, [bounties, userTierName, hasMerchEligibility]);

  // Filter counts
  const counts = useMemo(() => {
    const recurring = availableBounties.filter(b => b.is_recurring);
    const merch = availableBounties.filter(b => b.bounty_tier?.startsWith('merch_'));
    return {
      all: availableBounties.length,
      available: availableBounties.length,
      merch: merch.length,
      recurring: recurring.length,
    };
  }, [availableBounties]);

  const filteredBounties = useMemo(() => {
    switch (filter) {
      case 'available':
        return availableBounties;
      case 'merch':
        return availableBounties.filter(b => b.bounty_tier?.startsWith('merch_'));
      case 'recurring':
        return availableBounties.filter(b => b.is_recurring);
      default:
        return availableBounties;
    }
  }, [availableBounties, filter]);

  const handleClaim = async () => {
    if (!claimTarget || !profile?.id) return;
    setClaiming(true);
    try {
      const multipliedReward = claimTarget.requires_360lock
        ? claimTarget.nctr_reward * claimTarget.lock_multiplier
        : claimTarget.nctr_reward;

      const { error } = await supabase.from('bounty_claims').insert({
        user_id: profile.id,
        bounty_id: claimTarget.id,
        nctr_earned: multipliedReward,
        multiplier_applied: claimTarget.requires_360lock ? claimTarget.lock_multiplier : 1,
        locked_to_360: claimTarget.requires_360lock,
        status: 'pending',
      });

      if (error) throw error;

      toast.success(
        `Bounty claimed! You earned ${multipliedReward.toLocaleString()} NCTR${claimTarget.requires_360lock ? ` (${claimTarget.lock_multiplier}x multiplier)` : ''}`,
      );
      setClaimTarget(null);
    } catch (err) {
      console.error('Claim error:', err);
      toast.error('Failed to claim bounty. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hero explainer */}
      <BountyBoardHero
        tier={tier}
        availableCount={counts.available}
        totalCount={bounties.length}
      />

      {/* Filter tabs with counts */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="available">Available to Me ({counts.available})</TabsTrigger>
            <TabsTrigger value="merch">Merch Bounties ({counts.merch})</TabsTrigger>
            <TabsTrigger value="recurring">Recurring ({counts.recurring})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Bounty grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : filteredBounties.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="font-medium">No bounties in this category</p>
          <p className="text-sm mt-1">Try a different filter or check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredBounties.map((bounty, idx) => (
            <BountyCard
              key={bounty.id}
              bounty={bounty}
              userTier={tier}
              total360Locked={total360Locked}
              nextTier={nextTier}
              claims={claims}
              hasMerchEligibility={hasMerchEligibility}
              onClaim={setClaimTarget}
              isFirstAvailable={idx === 0}
              hasCompletedAny={hasCompletedAny}
            />
          ))}
        </div>
      )}

      {/* Locked bounties aspiration section */}
      <LockedBountiesSection bounties={lockedBounties} tierName={userTierName} />

      {/* Claim confirmation dialog */}
      <BountyClaimDialog
        bounty={claimTarget}
        open={!!claimTarget}
        onClose={() => setClaimTarget(null)}
        onConfirm={handleClaim}
        claiming={claiming}
        total360Locked={total360Locked}
        currentTier={tier}
        nextTier={nextTier}
      />
    </div>
  );
}
