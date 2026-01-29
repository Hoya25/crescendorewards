// Reusable rewards catalog component with URL-synced filters
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  REWARD_CATEGORY_OPTIONS,
  REWARD_CADENCE_OPTIONS,
  REWARD_STATUS_OPTIONS,
  type RewardCategoryFilter,
  type RewardCadenceFilter,
  type RewardStatusFilter,
} from '@/constants/impactEngines';
import type { GroundballReward } from '@/hooks/useGroundballStatus';

export interface RewardFilters {
  category: RewardCategoryFilter;
  cadence: RewardCadenceFilter;
  status: RewardStatusFilter;
  search: string;
}

const DEFAULT_FILTERS: RewardFilters = {
  category: 'all',
  cadence: 'all',
  status: 'all',
  search: '',
};

interface RewardsCatalogFiltersProps {
  filters: RewardFilters;
  onFiltersChange: (filters: RewardFilters) => void;
  activeFilterCount: number;
  onClearFilters: () => void;
}

export function RewardsCatalogFilters({
  filters,
  onFiltersChange,
  activeFilterCount,
  onClearFilters,
}: RewardsCatalogFiltersProps) {
  const updateFilter = <K extends keyof RewardFilters>(key: K, value: RewardFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search rewards..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
        />
        {filters.search && (
          <button
            onClick={() => updateFilter('search', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>Filters:</span>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {REWARD_CATEGORY_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={filters.category === option.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => updateFilter('category', option.value)}
              className={cn(
                'whitespace-nowrap rounded-full text-xs',
                filters.category === option.value
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <span className="mr-1">{option.emoji}</span>
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Dropdowns Row */}
      <div className="flex flex-wrap gap-3">
        {/* Cadence Select */}
        <Select
          value={filters.cadence}
          onValueChange={(value) => updateFilter('cadence', value as RewardCadenceFilter)}
        >
          <SelectTrigger className="w-[140px] bg-slate-900/50 border-slate-700 text-sm">
            <SelectValue placeholder="Cadence" />
          </SelectTrigger>
          <SelectContent>
            {REWARD_CADENCE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Select */}
        <Select
          value={filters.status}
          onValueChange={(value) => updateFilter('status', value as RewardStatusFilter)}
        >
          <SelectTrigger className="w-[130px] bg-slate-900/50 border-slate-700 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {REWARD_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>
    </div>
  );
}

// Hook to sync filters with URL params
export function useRewardFilters(): {
  filters: RewardFilters;
  setFilters: (filters: RewardFilters) => void;
  activeFilterCount: number;
  clearFilters: () => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: RewardFilters = useMemo(() => ({
    category: (searchParams.get('category') as RewardCategoryFilter) || 'all',
    cadence: (searchParams.get('cadence') as RewardCadenceFilter) || 'all',
    status: (searchParams.get('status') as RewardStatusFilter) || 'all',
    search: searchParams.get('search') || '',
  }), [searchParams]);

  const setFilters = (newFilters: RewardFilters) => {
    const params = new URLSearchParams();
    
    if (newFilters.category !== 'all') params.set('category', newFilters.category);
    if (newFilters.cadence !== 'all') params.set('cadence', newFilters.cadence);
    if (newFilters.status !== 'all') params.set('status', newFilters.status);
    if (newFilters.search) params.set('search', newFilters.search);
    
    setSearchParams(params, { replace: true });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'all') count++;
    if (filters.cadence !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.search) count++;
    return count;
  }, [filters]);

  const clearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  return { filters, setFilters, activeFilterCount, clearFilters };
}

// Filter function for rewards
export function filterRewards(
  rewards: GroundballReward[],
  filters: RewardFilters,
  userStatus?: string
): GroundballReward[] {
  return rewards.filter((reward) => {
    // Category filter
    if (filters.category !== 'all') {
      const rewardCategory = reward.is_giveback ? 'give-back' : (reward.category || 'all');
      if (rewardCategory !== filters.category) return false;
    }

    // Cadence filter
    if (filters.cadence !== 'all' && reward.cadence !== filters.cadence) {
      return false;
    }

    // Status filter
    if (filters.status !== 'all') {
      const requiredStatus = reward.required_status || 'any';
      // Map filter value to required status check
      const statusHierarchy = ['any', 'none', 'bronze', 'silver', 'gold'];
      const filterIdx = statusHierarchy.indexOf(filters.status);
      const requiredIdx = statusHierarchy.indexOf(requiredStatus);
      if (requiredIdx > filterIdx) return false;
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesTitle = reward.title.toLowerCase().includes(searchLower);
      const matchesDescription = reward.description?.toLowerCase().includes(searchLower);
      const matchesSponsor = reward.sponsor?.toLowerCase().includes(searchLower);
      if (!matchesTitle && !matchesDescription && !matchesSponsor) return false;
    }

    return true;
  });
}

// Export the catalog component for use in pages
interface RewardsCatalogProps {
  engine: string;
  rewards: GroundballReward[];
  isLoading?: boolean;
  renderReward: (reward: GroundballReward) => React.ReactNode;
  emptyState?: React.ReactNode;
}

export function RewardsCatalog({
  engine,
  rewards,
  isLoading,
  renderReward,
  emptyState,
}: RewardsCatalogProps) {
  const { filters, setFilters, activeFilterCount, clearFilters } = useRewardFilters();
  
  const filteredRewards = useMemo(
    () => filterRewards(rewards, filters),
    [rewards, filters]
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <RewardsCatalogFilters
        filters={filters}
        onFiltersChange={setFilters}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
      />

      {/* Results count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {filteredRewards.length} reward{filteredRewards.length !== 1 ? 's' : ''} found
        </span>
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
            {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
          </Badge>
        )}
      </div>

      {/* Rewards Grid */}
      {filteredRewards.length === 0 ? (
        emptyState || (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No rewards match your filters
            </h3>
            <p className="text-slate-400 mb-4">
              Try adjusting your filters or search term
            </p>
            <Button onClick={clearFilters} variant="outline">
              Clear All Filters
            </Button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRewards.map(renderReward)}
        </div>
      )}
    </div>
  );
}
