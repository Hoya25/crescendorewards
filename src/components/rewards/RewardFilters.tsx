import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Gift, Sparkles, ShoppingBag, CreditCard, Coins, X, 
  Package, ArrowUpDown, Search, Trophy, Heart, Wallet, SlidersHorizontal
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface RewardFiltersProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  priceFilter: string;
  onPriceFilterChange: (filter: string) => void;
  availabilityFilter: string;
  onAvailabilityFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  exclusiveFilter?: string;
  onExclusiveFilterChange?: (filter: string) => void;
  highValueFilter?: string;
  onHighValueFilterChange?: (filter: string) => void;
  affordableFilter?: boolean;
  onAffordableFilterChange?: (enabled: boolean) => void;
  featuredFilter?: boolean;
  onFeaturedFilterChange?: (enabled: boolean) => void;
  sponsoredFilter?: boolean;
  onSponsoredFilterChange?: (enabled: boolean) => void;
  resultsCount?: number;
  userBalance?: number;
}

// Simplified category tabs for main filter row
const quickCategories = [
  { key: 'all', label: 'All', icon: Gift },
  { key: 'free', label: 'Free', icon: Coins },
  { key: 'experiences', label: 'Experiences', icon: Sparkles },
  { key: 'merch', label: 'Merch', icon: ShoppingBag },
  { key: 'subscriptions', label: 'Subscriptions', icon: Trophy },
  { key: 'community', label: 'Community', icon: Heart },
];

export function RewardFilters({
  activeCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  priceFilter,
  onPriceFilterChange,
  availabilityFilter,
  onAvailabilityFilterChange,
  searchQuery,
  onSearchChange,
  exclusiveFilter = 'all',
  onExclusiveFilterChange,
  affordableFilter = false,
  onAffordableFilterChange,
  featuredFilter = false,
  onFeaturedFilterChange,
  sponsoredFilter = false,
  onSponsoredFilterChange,
  resultsCount = 0,
  userBalance = 0,
}: RewardFiltersProps) {
  const hasActiveFilters = priceFilter !== 'all' || availabilityFilter !== 'all' || exclusiveFilter !== 'all' || featuredFilter || sponsoredFilter;
  const activeFilterCount = [
    priceFilter !== 'all',
    availabilityFilter !== 'all',
    exclusiveFilter !== 'all',
    featuredFilter,
    sponsoredFilter
  ].filter(Boolean).length;

  const clearSpecialFilters = () => {
    onAffordableFilterChange?.(false);
    onFeaturedFilterChange?.(false);
    onSponsoredFilterChange?.(false);
    if (priceFilter === 'free') onPriceFilterChange('all');
  };

  const handleQuickCategory = (key: string) => {
    clearSpecialFilters();
    if (key === 'free') {
      onCategoryChange('all');
      onPriceFilterChange('free');
    } else {
      onCategoryChange(key);
    }
  };

  const getActiveTab = () => {
    if (priceFilter === 'free' && activeCategory === 'all') return 'free';
    return activeCategory;
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search rewards..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-background border-border"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
            onClick={() => onSearchChange('')}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Simplified Filter Row: Category Tabs + Sort + More Filters */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {/* Quick Category Tabs */}
        <Tabs value={getActiveTab()} className="flex-shrink-0">
          <TabsList className="h-9 p-1">
            {quickCategories.map(({ key, label, icon: Icon }) => (
              <TabsTrigger
                key={key}
                value={key}
                onClick={() => handleQuickCategory(key)}
                className="gap-1.5 px-3 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{key === 'affordable' ? '💰' : label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Divider */}
        <div className="h-6 w-px bg-border flex-shrink-0" />

        {/* Sort Dropdown */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[140px] h-9 bg-background border-border flex-shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border z-50">
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="priceLowToHigh">Price: Low-High</SelectItem>
            <SelectItem value="priceHighToLow">Price: High-Low</SelectItem>
            <SelectItem value="popularity">Popular</SelectItem>
          </SelectContent>
        </Select>

        {/* More Filters Drawer */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-9 flex-shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">More</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>Advanced Filters</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={activeCategory} onValueChange={onCategoryChange}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="experiences">Experiences</SelectItem>
                    <SelectItem value="merch">Merchandise</SelectItem>
                    <SelectItem value="subscriptions">Subscriptions</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="gift_cards">Gift Cards</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="wellness">Wellness</SelectItem>
                    <SelectItem value="alliance_tokens">Alliance Tokens</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Price Range</label>
                <Select value={priceFilter} onValueChange={onPriceFilterChange}>
                  <SelectTrigger className="w-full bg-background">
                    <Coins className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="under100">Under 100</SelectItem>
                    <SelectItem value="under500">Under 500</SelectItem>
                    <SelectItem value="over500">500+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Availability Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Availability</label>
                <Select value={availabilityFilter} onValueChange={onAvailabilityFilterChange}>
                  <SelectTrigger className="w-full bg-background">
                    <Package className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="inStock">In Stock</SelectItem>
                    <SelectItem value="lowStock">Low Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Exclusive Filter */}
              {onExclusiveFilterChange && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={exclusiveFilter} onValueChange={onExclusiveFilterChange}>
                    <SelectTrigger className="w-full bg-background">
                      <Trophy className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rewards</SelectItem>
                      <SelectItem value="exclusive">Exclusive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    onPriceFilterChange('all');
                    onAvailabilityFilterChange('all');
                    onExclusiveFilterChange?.('all');
                    onAffordableFilterChange?.(false);
                    onFeaturedFilterChange?.(false);
                    onSponsoredFilterChange?.(false);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Results Count */}
        <div className="ml-auto flex-shrink-0">
          <Badge variant="secondary" className="gap-1 text-xs">
            {resultsCount} {resultsCount === 1 ? 'reward' : 'rewards'}
          </Badge>
        </div>
      </div>
    </div>
  );
}
