import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Filter, Sparkles, Plus, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGroundballStatus, type GroundballReward, BONUS_SLOT_COST, SWAP_COST } from '@/hooks/useGroundballStatus';
import { GroundballStatusBadge } from '@/components/groundball/GroundballStatusBadge';
import { GroundballRewardCard } from '@/components/groundball/GroundballRewardCard';
import { SelectRewardModal } from '@/components/groundball/SelectRewardModal';
import { SwapRewardModal } from '@/components/groundball/SwapRewardModal';
import { BonusSlotModal } from '@/components/groundball/BonusSlotModal';

type StatusFilter = 'available' | 'all' | 'my-selections';
type CategoryFilter = 'all' | 'experiences' | 'gear' | 'apparel' | 'services' | 'giveback';
type CadenceFilter = 'all' | 'daily' | 'monthly' | 'quarterly' | 'annual' | 'one_time';

const CATEGORY_OPTIONS: { key: CategoryFilter; label: string; emoji: string }[] = [
  { key: 'all', label: 'All', emoji: '🎯' },
  { key: 'experiences', label: 'Experiences', emoji: '⭐' },
  { key: 'gear', label: 'Gear', emoji: '🥍' },
  { key: 'apparel', label: 'Apparel', emoji: '👕' },
  { key: 'services', label: 'Services', emoji: '📹' },
  { key: 'giveback', label: 'Give Back', emoji: '💚' },
];

const CADENCE_OPTIONS: { key: CadenceFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'daily', label: 'Daily' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly' },
  { key: 'annual', label: 'Annual' },
  { key: 'one_time', label: 'One-Time' },
];

const STATUS_HIERARCHY = ['any', 'none', 'bronze', 'silver', 'gold'];

export default function GroundballRewardsPage() {
  const {
    status,
    rewards,
    selections,
    isLoading,
    selectReward,
    swapReward,
    purchaseBonusSlot,
    getSelectionState,
    totalSlots,
    usedSlots,
    freeSwaps,
    bonusSlots,
    claimsBalance,
    canAffordBonusSlot,
  } = useGroundballStatus();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('available');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [cadenceFilter, setCadenceFilter] = useState<CadenceFilter>('all');
  const [sponsorFilter, setSponsorFilter] = useState<string>('all');
  
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [bonusSlotModalOpen, setBonusSlotModalOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<GroundballReward | null>(null);
  const [selectedSelectionId, setSelectedSelectionId] = useState<string | null>(null);

  const userTier = status?.status_tier || 'none';
  const hasNoSlotsRemaining = usedSlots >= totalSlots;

  // Get unique sponsors for filter
  const sponsors = [...new Set(rewards.filter(r => r.sponsor).map(r => r.sponsor!))];

  // Filter rewards
  const filteredRewards = rewards.filter(reward => {
    // Status filter
    if (statusFilter === 'available') {
      const requiredTier = reward.required_status || 'any';
      const meetsStatus = STATUS_HIERARCHY.indexOf(userTier) >= STATUS_HIERARCHY.indexOf(requiredTier);
      if (!meetsStatus) return false;
    }
    if (statusFilter === 'my-selections') {
      const isSelected = selections.some(s => s.reward_id === reward.id);
      if (!isSelected) return false;
    }
    
    // Category filter
    if (categoryFilter !== 'all' && reward.category !== categoryFilter) return false;
    
    // Cadence filter
    if (cadenceFilter !== 'all' && reward.cadence !== cadenceFilter) return false;
    
    // Sponsor filter
    if (sponsorFilter !== 'all' && reward.sponsor !== sponsorFilter) return false;
    
    return true;
  });

  // Handlers
  const handleSelectClick = (reward: GroundballReward) => {
    setSelectedReward(reward);
    setSelectModalOpen(true);
  };

  const handleSwapClick = (reward: GroundballReward) => {
    const selection = selections.find(s => s.reward_id === reward.id);
    if (selection) {
      setSelectedReward(reward);
      setSelectedSelectionId(selection.id);
      setSwapModalOpen(true);
    }
  };

  const handleConfirmSelect = () => {
    if (selectedReward) {
      selectReward.mutate(selectedReward.id, {
        onSuccess: () => setSelectModalOpen(false),
      });
    }
  };

  const handleConfirmSwap = (useFreeSwap: boolean) => {
    if (selectedSelectionId) {
      swapReward.mutate(
        { selectionId: selectedSelectionId, useFreeSwap },
        { onSuccess: () => setSwapModalOpen(false) }
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-emerald-500/20 bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">🥍</span> GROUNDBALL Rewards
                </h1>
                <p className="text-sm text-slate-400">Select your rewards</p>
              </div>
            </div>
            
            {/* Claims Balance & Selections Counter */}
            <div className="flex items-center gap-4">
              {/* Claims Balance */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">{claimsBalance} Claims</span>
              </div>

              {/* Selections */}
              <div className="text-right">
                <div className="text-sm text-slate-400">Selections</div>
                <div className="font-semibold text-white">
                  {usedSlots} of {totalSlots}
                  {bonusSlots > 0 && (
                    <span className="text-amber-400 text-xs ml-1">+{bonusSlots} bonus</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: totalSlots }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-3 h-3 rounded-full',
                      i < usedSlots ? 'bg-emerald-500' : 'bg-slate-600'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* No Slots Remaining Banner */}
          {hasNoSlotsRemaining && (
            <div className="mt-3 flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-sm">No slots remaining</span>
              </div>
              <Button
                size="sm"
                onClick={() => setBonusSlotModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Bonus Slot • {BONUS_SLOT_COST} Claims
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Status Badge Section */}
      <section className="container mx-auto px-4 py-6">
        <div className="max-w-md">
          <GroundballStatusBadge size="md" showProgress showSelections={false} />
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-[73px] z-40 border-b border-emerald-500/20 bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 space-y-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="flex gap-2">
              {[
                { key: 'available' as StatusFilter, label: 'Available to Me' },
                { key: 'all' as StatusFilter, label: 'All Rewards' },
                { key: 'my-selections' as StatusFilter, label: 'My Selections' },
              ].map(opt => (
                <Button
                  key={opt.key}
                  variant={statusFilter === opt.key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter(opt.key)}
                  className={cn(
                    'rounded-full text-xs',
                    statusFilter === opt.key
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  {opt.label}
                  {opt.key === 'my-selections' && selections.length > 0 && (
                    <Badge className="ml-1 bg-emerald-500 text-xs px-1.5 py-0">
                      {selections.length}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORY_OPTIONS.map(cat => (
              <Button
                key={cat.key}
                variant={categoryFilter === cat.key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCategoryFilter(cat.key)}
                className={cn(
                  'whitespace-nowrap rounded-full text-xs',
                  categoryFilter === cat.key
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <span className="mr-1">{cat.emoji}</span>
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Cadence & Sponsor Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Cadence:</span>
              <select
                value={cadenceFilter}
                onChange={e => setCadenceFilter(e.target.value as CadenceFilter)}
                className="text-xs bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-slate-300"
              >
                {CADENCE_OPTIONS.map(opt => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            {sponsors.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Sponsor:</span>
                <select
                  value={sponsorFilter}
                  onChange={e => setSponsorFilter(e.target.value)}
                  className="text-xs bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-slate-300"
                >
                  <option value="all">All</option>
                  {sponsors.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Rewards Grid */}
      <section className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : filteredRewards.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🥍</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {statusFilter === 'my-selections' 
                ? 'No selections yet'
                : 'No rewards match your filters'
              }
            </h3>
            <p className="text-slate-400">
              {statusFilter === 'my-selections'
                ? 'Browse rewards and start selecting!'
                : 'Try adjusting your filters.'}
            </p>
            {statusFilter === 'my-selections' && (
              <Button
                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setStatusFilter('available')}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Browse Available Rewards
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRewards.map(reward => (
              <GroundballRewardCard
                key={reward.id}
                reward={reward}
                state={getSelectionState(reward.id)}
                onSelect={() => handleSelectClick(reward)}
                onSwap={() => handleSwapClick(reward)}
                onViewDetails={() => {/* TODO: Open details modal */}}
                onHowToLevelUp={() => {/* TODO: Navigate to level up guide */}}
                onGetBonusSlot={() => setBonusSlotModalOpen(true)}
              />
            ))}
          </div>
        )}
      </section>

      {/* How to Earn Section */}
      <section className="container mx-auto px-4 py-12 border-t border-emerald-500/20">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-white mb-4">How to Earn GROUNDBALL</h3>
          <p className="text-slate-400 mb-8">
            Contribute to the lacrosse community and earn tokens for rewards.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link 
              to="/groundball/gear-vault" 
              className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 transition-all hover:bg-slate-800"
            >
              <div className="text-3xl mb-2">🥍</div>
              <div className="font-semibold text-white">Donate Gear</div>
              <div className="text-sm text-slate-400">Contribute to Gear Vault</div>
            </Link>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="text-3xl mb-2">📣</div>
              <div className="font-semibold text-white">Share & Engage</div>
              <div className="text-sm text-slate-400">Grow the community</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="text-3xl mb-2">🎯</div>
              <div className="font-semibold text-white">Complete Missions</div>
              <div className="text-sm text-slate-400">Seasonal challenges</div>
            </div>
          </div>
        </div>
      </section>

      {/* Selection Modal */}
      <SelectRewardModal
        open={selectModalOpen}
        onOpenChange={setSelectModalOpen}
        reward={selectedReward}
        usedSlots={usedSlots}
        totalSlots={totalSlots}
        onConfirm={handleConfirmSelect}
        isLoading={selectReward.isPending}
      />

      {/* Swap Modal */}
      <SwapRewardModal
        open={swapModalOpen}
        onOpenChange={setSwapModalOpen}
        selection={selections.find(s => s.id === selectedSelectionId) || null}
        reward={selectedReward}
        freeSwapsRemaining={freeSwaps}
        swapCost={SWAP_COST}
        onConfirm={handleConfirmSwap}
        isLoading={swapReward.isPending}
      />

      {/* Bonus Slot Modal */}
      <BonusSlotModal
        open={bonusSlotModalOpen}
        onOpenChange={setBonusSlotModalOpen}
        currentSlots={totalSlots}
        bonusSlots={bonusSlots}
        claimsBalance={claimsBalance}
        onConfirm={() => {
          purchaseBonusSlot.mutate(undefined, {
            onSuccess: () => setBonusSlotModalOpen(false),
          });
        }}
        isLoading={purchaseBonusSlot.isPending}
      />
    </div>
  );
}
