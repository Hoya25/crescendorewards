import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBounties, useBountyClaims, useMerchEligibility, useBountyStats, Bounty } from '@/hooks/useBounties';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { BountyCard } from '@/components/bounties/BountyCard';
import { BountyClaimDialog } from '@/components/bounties/BountyClaimDialog';
import { MerchBountiesHero } from '@/components/bounties/MerchBountiesHero';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Target } from 'lucide-react';

type FilterTab = 'all' | 'merch' | 'general';

export default function BountyBoardPage() {
  const { user } = useAuthContext();
  const { profile, tier, nextTier, total360Locked } = useUnifiedUser();
  const { data: bounties = [], isLoading } = useBounties();
  const { data: claims = [] } = useBountyClaims();
  const { data: merchEligibility = [] } = useMerchEligibility();
  const { data: stats } = useBountyStats();

  const [filter, setFilter] = useState<FilterTab>('all');
  const [claimTarget, setClaimTarget] = useState<Bounty | null>(null);
  const [claiming, setClaiming] = useState(false);

  const hasMerchEligibility = merchEligibility.length > 0;

  const filteredBounties = useMemo(() => {
    switch (filter) {
      case 'merch':
        return bounties.filter(b => b.bounty_tier.startsWith('merch_'));
      case 'general':
        return bounties.filter(b => b.bounty_tier === 'general');
      default:
        return bounties;
    }
  }, [bounties, filter]);

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

  const showMerchHero = filter === 'merch';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" /> Bounty Board
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete bounties to earn NCTR. Merch bounties earn 3x with 360LOCK commitment.
        </p>
      </div>

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
        <TabsList>
          <TabsTrigger value="all">All Bounties</TabsTrigger>
          <TabsTrigger value="merch">Merch Bounties</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Merch hero */}
      {showMerchHero && stats && (
        <MerchBountiesHero
          activeMerchCount={stats.activeMerchCount}
          totalNctrEarned={stats.totalNctrEarned}
          currentTier={tier}
        />
      )}

      {/* Bounty grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : filteredBounties.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No bounties available</p>
          <p className="text-sm mt-1">Check back soon for new opportunities to earn.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBounties.map(bounty => (
            <BountyCard
              key={bounty.id}
              bounty={bounty}
              userTier={tier}
              total360Locked={total360Locked}
              nextTier={nextTier}
              claims={claims}
              hasMerchEligibility={hasMerchEligibility}
              onClaim={setClaimTarget}
            />
          ))}
        </div>
      )}

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
