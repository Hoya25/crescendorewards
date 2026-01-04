import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Gift, Sparkles, ShoppingBag, CreditCard, Coins, X, 
  Package, Zap, ArrowUpDown, Filter, Search, Trophy, Heart 
} from 'lucide-react';

const categoryIcons = {
  alliance_tokens: Coins,
  experiences: Sparkles,
  merch: ShoppingBag,
  gift_cards: CreditCard,
  wellness: Heart,
  opportunity: Trophy,
};

const categoryLabels = {
  alliance_tokens: 'Alliance Tokens',
  experiences: 'Experiences',
  merch: 'Merch',
  gift_cards: 'Gift Cards',
  wellness: 'Wellness & Health',
  opportunity: 'Opportunity',
};

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
  resultsCount?: number;
}

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
  highValueFilter = 'all',
  onHighValueFilterChange,
  resultsCount = 0,
}: RewardFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search rewards by name or description..."
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

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={onCategoryChange} className="w-full">
        <div className="w-full overflow-x-auto -mx-4 px-4">
          <TabsList className="w-max min-w-full justify-start flex-nowrap">
            <TabsTrigger value="all" className="flex items-center gap-2 whitespace-nowrap">
              <Gift className="w-4 h-4" />
              All
            </TabsTrigger>
            {Object.entries(categoryLabels).map(([key, label]) => {
              const Icon = categoryIcons[key as keyof typeof categoryIcons] || Gift;
              return (
                <TabsTrigger key={key} value={key} className="flex items-center gap-2 whitespace-nowrap">
                  <Icon className="w-4 h-4" />
                  {label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </Tabs>

      {/* Category Descriptions */}
      {activeCategory === 'alliance_tokens' && (
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Coins className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">About Alliance Tokens</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Alliance Tokens are digital rewards from our brand partners that represent shared values and commitments. 
                Each token type (like S.W.E.A.T. Tokens from Mike Rowe WORKS Foundation) embodies specific principles 
                and can be redeemed for exclusive benefits. Partner tokens unlock special experiences, merchandise, 
                and opportunities aligned with their organization&apos;s mission.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeCategory === 'experiences' && (
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Exclusive Experiences</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Redeem your claims for once-in-a-lifetime experiences like VIP concert access, meet-and-greets, 
                adventure packages, and exclusive events. These rewards create unforgettable memories.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeCategory === 'merch' && (
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <ShoppingBag className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Exclusive Merchandise</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Get your hands on limited-edition apparel, collectibles, and branded merchandise from our partners. 
                Show your support with exclusive gear you can&apos;t find anywhere else.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeCategory === 'gift_cards' && (
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Gift Cards & Vouchers</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Exchange your claims for gift cards from popular brands and retailers. Perfect for treating yourself 
                or giving as gifts to friends and family.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeCategory === 'wellness' && (
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Wellness & Health</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Invest in your wellbeing with health supplements, fitness gear, and wellness products. 
                Take care of yourself with rewards that support a healthy lifestyle.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Sorting */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filters:</span>
        </div>
        
        {/* Sort By */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px] bg-background border-border z-50">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border z-50">
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="priceLowToHigh">Price: Low to High</SelectItem>
            <SelectItem value="priceHighToLow">Price: High to Low</SelectItem>
            <SelectItem value="popularity">Most Popular</SelectItem>
          </SelectContent>
        </Select>

        {/* Price Filter */}
        <Select value={priceFilter} onValueChange={onPriceFilterChange}>
          <SelectTrigger className="w-[160px] bg-background border-border z-50">
            <Coins className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Price" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border z-50">
            <SelectItem value="all">All Prices</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="under100">Under 100</SelectItem>
            <SelectItem value="under500">Under 500</SelectItem>
            <SelectItem value="over500">500+</SelectItem>
          </SelectContent>
        </Select>

        {/* Availability Filter */}
        <Select value={availabilityFilter} onValueChange={onAvailabilityFilterChange}>
          <SelectTrigger className="w-[160px] bg-background border-border z-50">
            <Package className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border z-50">
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="inStock">In Stock</SelectItem>
            <SelectItem value="lowStock">Low Stock</SelectItem>
          </SelectContent>
        </Select>

        {/* Exclusive Experiences Filter */}
        {onExclusiveFilterChange && (
          <Select value={exclusiveFilter} onValueChange={onExclusiveFilterChange}>
            <SelectTrigger className="w-[200px] bg-background border-border z-50">
              <Trophy className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border z-50">
              <SelectItem value="all">All Rewards</SelectItem>
              <SelectItem value="exclusive">Exclusive Experiences</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* High-Value Filter */}
        {onHighValueFilterChange && (
          <Select value={highValueFilter} onValueChange={onHighValueFilterChange}>
            <SelectTrigger className="w-[180px] bg-background border-border z-50">
              <Zap className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Value" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border z-50">
              <SelectItem value="all">All Values</SelectItem>
              <SelectItem value="highValue">High-Value (500+)</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Results Count */}
        <div className="ml-auto text-sm text-muted-foreground">
          <Badge variant="secondary" className="gap-1">
            {resultsCount} {resultsCount === 1 ? 'reward' : 'rewards'}
          </Badge>
        </div>
      </div>
    </div>
  );
}
