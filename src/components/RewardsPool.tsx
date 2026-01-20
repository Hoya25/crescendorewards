import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { Gift, Sparkles, ShoppingBag, CreditCard, Coins, ZoomIn, X, Clock, Package, Heart, Store, Trophy, User, ChevronDown, LogOut, LayoutDashboard, FileCheck, Receipt, BarChart3, Crown, ArrowLeft, Shield, Settings, Plus, Pencil } from 'lucide-react';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BuyClaims } from '@/components/BuyClaims';
import { RewardCard } from '@/components/rewards/RewardCard';
import { RewardFilters } from '@/components/rewards/RewardFilters';
import { FeaturedCarousel } from '@/components/rewards/FeaturedCarousel';
import { CrescendoLogo } from '@/components/CrescendoLogo';
import { BetaBadge } from '@/components/BetaBadge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FavoritesIndicator } from '@/components/FavoritesIndicator';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { SEO } from '@/components/SEO';
import { Footer } from '@/components/Footer';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { RewardsGridSkeleton } from '@/components/skeletons/RewardCardSkeleton';
import { NoRewardsEmpty } from '@/components/EmptyState';
import { DataErrorState } from '@/components/DataErrorState';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useWatchlist } from '@/hooks/useWatchlist';

interface Reward {
  id: string;
  title: string;
  description: string;
  category: 'alliance_tokens' | 'experiences' | 'merch' | 'gift_cards' | 'wellness';
  cost: number;
  image_url: string | null;
  stock_quantity: number | null;
  is_active: boolean;
  is_featured: boolean;
  created_at?: string;
  token_gated?: boolean;
  token_name?: string | null;
  token_symbol?: string | null;
  minimum_token_balance?: number;
  brand_id?: string | null;
  brand_name?: string | null;
  // Sponsorship fields
  sponsor_enabled?: boolean;
  sponsor_name?: string | null;
  sponsor_logo?: string | null;
  sponsor_link?: string | null;
  sponsor_start_date?: string | null;
  sponsor_end_date?: string | null;
}

interface RewardsPoolProps {
  claimBalance: number;
  onClaimSuccess: () => void;
  onSubmitReward?: () => void;
  onBack?: () => void;
  onNavigateToBrands?: () => void;
  onViewRewardDetail?: (rewardId: string) => void;
  carouselAutoplayDelay?: number;
}

const categoryIcons = {
  alliance_tokens: Coins,
  experiences: Sparkles,
  merch: ShoppingBag,
  gift_cards: CreditCard,
  wellness: Heart,
};

// Valid filter values for URL params
const VALID_SORTS = ['newest', 'oldest', 'priceLowToHigh', 'priceHighToLow', 'popularity'];
const VALID_CATEGORIES = ['all', 'alliance_tokens', 'experiences', 'merch', 'gift_cards', 'wellness'];
const VALID_PRICE_FILTERS = ['all', 'free', 'under100', 'under500', 'over500'];
const VALID_AVAILABILITY_FILTERS = ['all', 'inStock', 'lowStock'];

export function RewardsPool({ claimBalance, onClaimSuccess, onSubmitReward, onBack, onNavigateToBrands, onViewRewardDetail, carouselAutoplayDelay = 5000 }: RewardsPoolProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, signOut, setShowAuthModal, setAuthMode } = useAuthContext();
  const { profile } = useUnifiedUser();
  const { isAdmin } = useAdminRole();
  const { isWatching, toggleWatch, isAnimating: isWatchAnimating, getWatchCount, fetchWatchCounts } = useWatchlist();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [featuredRewards, setFeaturedRewards] = useState<Reward[]>([]);
  const [filteredRewards, setFilteredRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [retrying, setRetrying] = useState(false);
  
  // Initialize state from URL params with validation
  const getValidParam = (param: string | null, validValues: string[], defaultValue: string) => {
    return param && validValues.includes(param) ? param : defaultValue;
  };

  const [activeCategory, setActiveCategory] = useState<string>(() => 
    getValidParam(searchParams.get('category'), VALID_CATEGORIES, 'all')
  );
  const [sortBy, setSortBy] = useState<string>(() => 
    getValidParam(searchParams.get('sort'), VALID_SORTS, 'newest')
  );
  const [priceFilter, setPriceFilter] = useState<string>(() => 
    getValidParam(searchParams.get('price'), VALID_PRICE_FILTERS, 'all')
  );
  const [availabilityFilter, setAvailabilityFilter] = useState<string>(() => 
    getValidParam(searchParams.get('availability'), VALID_AVAILABILITY_FILTERS, 'all')
  );
  const [exclusiveFilter, setExclusiveFilter] = useState<string>(() => 
    getValidParam(searchParams.get('exclusive'), ['all', 'exclusive'], 'all')
  );
  const [highValueFilter, setHighValueFilter] = useState<string>(() => 
    getValidParam(searchParams.get('value'), ['all', 'highValue'], 'all')
  );
  const [searchQuery, setSearchQuery] = useState<string>(() => 
    searchParams.get('q') || ''
  );
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());
  const [animatingHearts, setAnimatingHearts] = useState<Set<string>>(new Set());
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });

  // Sync filter state to URL params
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    
    // Only add non-default values to keep URL clean
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (activeCategory !== 'all') params.set('category', activeCategory);
    if (priceFilter !== 'all') params.set('price', priceFilter);
    if (availabilityFilter !== 'all') params.set('availability', availabilityFilter);
    if (exclusiveFilter !== 'all') params.set('exclusive', exclusiveFilter);
    if (highValueFilter !== 'all') params.set('value', highValueFilter);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    
    setSearchParams(params, { replace: true });
  }, [sortBy, activeCategory, priceFilter, availabilityFilter, exclusiveFilter, highValueFilter, searchQuery, setSearchParams]);

  // Update URL when filters change
  useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSignIn = () => {
    setAuthMode('signin');
    setShowAuthModal(true);
  };

  useEffect(() => {
    loadRewards();
    loadWishlist();
  }, []);

  useEffect(() => {
    let filtered = activeCategory === 'all' 
      ? rewards.filter(r => !r.is_featured)
      : rewards.filter(r => r.category === activeCategory && !r.is_featured);
    
    let featured = activeCategory === 'all'
      ? rewards.filter(r => r.is_featured)
      : rewards.filter(r => r.is_featured && r.category === activeCategory);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(query) || 
        r.description.toLowerCase().includes(query)
      );
      featured = featured.filter(r => 
        r.title.toLowerCase().includes(query) || 
        r.description.toLowerCase().includes(query)
      );
    }

    // Apply price filter
    if (priceFilter === 'free') {
      filtered = filtered.filter(r => r.cost === 0);
    } else if (priceFilter === 'under100') {
      filtered = filtered.filter(r => r.cost < 100);
    } else if (priceFilter === 'under500') {
      filtered = filtered.filter(r => r.cost < 500);
    } else if (priceFilter === 'over500') {
      filtered = filtered.filter(r => r.cost >= 500);
    }

    // Apply availability filter
    if (availabilityFilter === 'inStock') {
      filtered = filtered.filter(r => r.stock_quantity === null || r.stock_quantity > 0);
    } else if (availabilityFilter === 'lowStock') {
      filtered = filtered.filter(r => r.stock_quantity !== null && r.stock_quantity > 0 && r.stock_quantity <= 10);
    }

    // Define customized rewards that should be prioritized
    const customizedRewardIds = [
      '72f47f23-1309-4632-bae0-0c749a2b1c26', // Florence and the Machine Tour 2026
      '796f68d6-7765-448c-a588-a1d95565a0cf', // Snow League Aspen
      '9ac902b4-38e9-4215-a99a-866cfd48c326', // VIP Access Passes to Outside Festival
      '15aae70a-2c59-4929-9bf7-cab97cc9a260'  // Gaming Setup Upgrade
    ];

    // Apply exclusive experiences filter
    if (exclusiveFilter === 'exclusive') {
      filtered = filtered.filter(r => customizedRewardIds.includes(r.id));
    }

    // Apply high-value rewards filter
    if (highValueFilter === 'highValue') {
      filtered = filtered.filter(r => r.cost >= 500);
    }

    // Apply sorting with prioritization for customized rewards
    const sortedFiltered = [...filtered].sort((a, b) => {
      // Prioritize customized rewards
      const aIsCustomized = customizedRewardIds.includes(a.id);
      const bIsCustomized = customizedRewardIds.includes(b.id);
      
      if (aIsCustomized && !bIsCustomized) return -1;
      if (!aIsCustomized && bIsCustomized) return 1;
      
      // Apply regular sorting for rewards in the same priority group
      switch (sortBy) {
        case 'priceLowToHigh':
          return a.cost - b.cost;
        case 'priceHighToLow':
          return b.cost - a.cost;
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'oldest':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'popularity':
          // For now, featured items are "popular", otherwise sort by lowest cost
          return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || a.cost - b.cost;
        default:
          return 0;
      }
    });

    const sortedFeatured = [...featured].sort((a, b) => {
      // Prioritize customized rewards in featured carousel too
      const aIsCustomized = customizedRewardIds.includes(a.id);
      const bIsCustomized = customizedRewardIds.includes(b.id);
      
      if (aIsCustomized && !bIsCustomized) return -1;
      if (!aIsCustomized && bIsCustomized) return 1;
      
      switch (sortBy) {
        case 'priceLowToHigh':
          return a.cost - b.cost;
        case 'priceHighToLow':
          return b.cost - a.cost;
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        default:
          return 0;
      }
    });

    setFilteredRewards(sortedFiltered);
    setFeaturedRewards(sortedFeatured);

    // Fetch watch counts for out-of-stock rewards
    const outOfStockIds = sortedFiltered
      .filter(r => r.stock_quantity !== null && r.stock_quantity <= 0)
      .map(r => r.id);
    if (outOfStockIds.length > 0) {
      fetchWatchCounts(outOfStockIds);
    }
  }, [activeCategory, rewards, sortBy, priceFilter, availabilityFilter, exclusiveFilter, highValueFilter, searchQuery, fetchWatchCounts]);

  const loadRewards = async (isRetry = false) => {
    try {
      if (isRetry) {
        setRetrying(true);
      }
      setLoading(true);
      setLoadError(null);
      
      const { data, error } = await supabase
        .from('rewards')
        .select('*, brands:brand_id(name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map brand name to rewards
      const rewardsWithBrandName = (data || []).map((reward: any) => ({
        ...reward,
        brand_name: reward.brands?.name || null,
        brands: undefined, // Clean up the nested object
      }));
      
      setRewards(rewardsWithBrandName as Reward[]);
    } catch (error) {
      console.error('Error loading rewards:', error);
      setLoadError(error instanceof Error ? error : new Error('Failed to load rewards'));
      if (!isRetry) {
        toast({
          title: 'Error',
          description: 'Failed to load rewards',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  const handleRetryLoad = () => {
    loadRewards(true);
  };

  const loadWishlist = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('reward_wishlists')
        .select('reward_id')
        .eq('user_id', session.user.id);

      if (error) throw error;
      const wishlistSet = new Set(data?.map(item => item.reward_id) || []);
      setWishlistItems(wishlistSet);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  };

  const toggleWishlist = async (rewardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Trigger animation
    setAnimatingHearts(prev => new Set([...prev, rewardId]));
    setTimeout(() => {
      setAnimatingHearts(prev => {
        const newSet = new Set(prev);
        newSet.delete(rewardId);
        return newSet;
      });
    }, 500);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to add items to your wishlist',
        variant: 'destructive',
      });
      return;
    }

    const isInWishlist = wishlistItems.has(rewardId);

    try {
      if (isInWishlist) {
        const { error } = await supabase
          .from('reward_wishlists')
          .delete()
          .eq('user_id', session.user.id)
          .eq('reward_id', rewardId);

        if (error) throw error;

        setWishlistItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(rewardId);
          return newSet;
        });

        toast({
          title: 'Removed from wishlist',
          description: 'Item removed from your wishlist',
        });
      } else {
        const { error } = await supabase
          .from('reward_wishlists')
          .insert({
            user_id: session.user.id,
            reward_id: rewardId,
          });

        if (error) throw error;

        setWishlistItems(prev => new Set([...prev, rewardId]));

        toast({
          title: 'Added to wishlist',
          description: 'Item added to your wishlist',
        });
      }
    } catch (error: any) {
      console.error('Error toggling wishlist:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update wishlist',
        variant: 'destructive',
      });
    }
  };


  const handleRewardClick = (reward: Reward) => {
    if (onViewRewardDetail) {
      onViewRewardDetail(reward.id);
    } else {
      setSelectedReward(reward);
      setShowDetailModal(true);
    }
  };

  const handleImageZoom = (imageUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomedImage(imageUrl);
    setShowImageZoom(true);
  };

  const handleClaimClick = async () => {
    if (!selectedReward) return;
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to claim rewards',
        variant: 'destructive',
      });
      return;
    }
    
    if (claimBalance < selectedReward.cost) {
      toast({
        title: 'Insufficient Balance',
        description: `You need ${selectedReward.cost - claimBalance} more tokens to claim this reward`,
        variant: 'destructive',
      });
      return;
    }

    if (selectedReward.stock_quantity !== null && selectedReward.stock_quantity <= 0) {
      toast({
        title: 'Out of Stock',
        description: 'This reward is currently out of stock',
        variant: 'destructive',
      });
      return;
    }

    setShowDetailModal(false);
    setShowClaimModal(true);
  };

  const handleClaim = async () => {
    if (!selectedReward) return;

    try {
      setClaiming(true);

      // Prepare shipping info only for physical items
      const needsShipping = selectedReward.category === 'merch' || selectedReward.category === 'experiences';
      const shippingData = needsShipping ? shippingInfo : null;

      const { data, error } = await supabase.rpc('claim_reward', {
        p_reward_id: selectedReward.id,
        p_shipping_info: shippingData,
      }) as { data: any; error: any };

      if (error) throw error;

      const result = data as { success: boolean; error?: string; new_balance?: number };

      if (!result.success) {
        throw new Error(result.error || 'Failed to claim reward');
      }

      toast({
        title: 'Success!',
        description: `You've claimed ${selectedReward.title}! New balance: ${result.new_balance} tokens`,
      });

      setShowClaimModal(false);
      setSelectedReward(null);
      setShippingInfo({
        name: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: '',
      });
      
      onClaimSuccess();
      loadRewards();
    } catch (error: any) {
      console.error('Error claiming reward:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to claim reward',
        variant: 'destructive',
      });
    } finally {
      setClaiming(false);
    }
  };

  const canAfford = (cost: number) => claimBalance >= cost;
  const needsShipping = selectedReward?.category === 'merch' || selectedReward?.category === 'experiences';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 pb-20 w-full max-w-[100vw] overflow-x-hidden">
      <SEO 
        title="Rewards Marketplace"
        description="Browse and claim exclusive rewards including experiences, merchandise, gift cards, and more. Member-built, member-owned."
      />
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b w-full">
        <div className="container mx-auto px-4 py-3 max-w-full">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Logo & Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="hover:opacity-80 transition-opacity cursor-pointer flex items-center"
              >
                <CrescendoLogo />
                <BetaBadge />
              </button>
              <div className="hidden md:flex items-center gap-2">
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/dashboard')}
                    className="gap-2"
                    size="sm"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                )}
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/membership')}
                    className="gap-2"
                    size="sm"
                  >
                    <Trophy className="w-4 h-4" />
                    Membership
                  </Button>
                )}
              </div>
            </div>

            {/* Right: Balance, Theme & Profile */}
            <div className="flex items-center gap-3">
              {/* Claim Balance */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                <Coins className="w-4 h-4 text-primary" />
                <span className="font-bold text-primary">{claimBalance}</span>
                <span className="text-xs text-muted-foreground">Claims</span>
              </div>
              
              <BuyClaims 
                currentBalance={claimBalance} 
                onPurchaseSuccess={onClaimSuccess}
              />
              
              <FavoritesIndicator />
              <NotificationsDropdown />
              <ThemeToggle />

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <User className="w-4 h-4" />
                      <span className="hidden md:inline">{profile?.display_name || profile?.email?.split('@')[0] || 'Account'}</span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/membership')}>
                      <Trophy className="w-4 h-4 mr-2" />
                      Membership
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/wishlist')}>
                      <Heart className="w-4 h-4 mr-2" />
                      Wishlist
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/my-submissions')}>
                      <FileCheck className="w-4 h-4 mr-2" />
                      My Submissions
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/purchase-history')}>
                      <Receipt className="w-4 h-4 mr-2" />
                      Purchase History
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/referrals')}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Referrals
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Crown className="w-4 h-4 mr-2" />
                        Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={handleSignIn} size="sm">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div className="bg-background/50 border-b w-full">
        <div className="container mx-auto px-4 py-4 max-w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Rewards Marketplace
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">Redeem your tokens for amazing rewards</p>
              </div>
            </div>
            
            {/* Mobile Balance Display */}
            <div className="flex sm:hidden items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
              <Coins className="w-4 h-4 text-primary" />
              <span className="font-bold text-primary">{claimBalance}</span>
              <span className="text-xs text-muted-foreground">Claims</span>
            </div>
          </div>
          
          <div className="mt-4">
            <RewardFilters
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
              priceFilter={priceFilter}
              onPriceFilterChange={setPriceFilter}
              availabilityFilter={availabilityFilter}
              onAvailabilityFilterChange={setAvailabilityFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              exclusiveFilter={exclusiveFilter}
              onExclusiveFilterChange={setExclusiveFilter}
              highValueFilter={highValueFilter}
              onHighValueFilterChange={setHighValueFilter}
              resultsCount={filteredRewards.length}
            />
          </div>
        </div>
      </div>

      {/* Featured Rewards Carousel */}
      {!loading && featuredRewards.length > 0 && (
        <FeaturedCarousel
          rewards={featuredRewards}
          onRewardClick={handleRewardClick}
          onImageZoom={handleImageZoom}
          wishlistItems={wishlistItems}
          onToggleWishlist={toggleWishlist}
          animatingHearts={animatingHearts}
          autoplayDelay={carouselAutoplayDelay}
          claimBalance={claimBalance}
        />
      )}

      {/* Regular Rewards Grid */}
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-full">
        {!loading && featuredRewards.length > 0 && (
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-primary" />
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">All Rewards</h2>
            <Badge variant="secondary" className="gap-1">
              {filteredRewards.length} Available
            </Badge>
          </div>
        )}
        
        {loading ? (
          <RewardsGridSkeleton count={6} />
        ) : loadError ? (
          <DataErrorState
            title="Failed to load rewards"
            message="We couldn't load the rewards. Please check your connection and try again."
            onRetry={handleRetryLoad}
            retrying={retrying}
          />
        ) : filteredRewards.length === 0 ? (
          <NoRewardsEmpty />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredRewards.map((reward) => {
              const outOfStock = reward.stock_quantity !== null && reward.stock_quantity <= 0;
              return (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  isInWishlist={wishlistItems.has(reward.id)}
                  onToggleWishlist={toggleWishlist}
                  onImageZoom={handleImageZoom}
                  onClick={() => handleRewardClick(reward)}
                  isAnimatingHeart={animatingHearts.has(reward.id)}
                  claimBalance={claimBalance}
                  isAdmin={isAdmin}
                  onAdminEdit={(rewardId) => navigate(`/admin?tab=rewards&edit=${rewardId}`)}
                  isWatching={outOfStock ? isWatching(reward.id) : false}
                  onToggleWatch={outOfStock ? toggleWatch : undefined}
                  isAnimatingWatch={outOfStock ? isWatchAnimating(reward.id) : false}
                  watchCount={outOfStock ? getWatchCount(reward.id) : 0}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      <Dialog open={showImageZoom} onOpenChange={setShowImageZoom}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-black/95">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => setShowImageZoom(false)}
          >
            <X className="w-6 h-6" />
          </Button>
          {zoomedImage && (
            <div className="w-full h-full flex items-center justify-center p-8">
              <img
                src={zoomedImage}
                alt="Zoomed view"
                className="max-w-full max-h-[80vh] object-contain animate-scale-in"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-2xl">
          {selectedReward && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedReward.title}</DialogTitle>
                <DialogDescription className="text-base">{selectedReward.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="relative group cursor-pointer rounded-lg overflow-hidden" onClick={(e) => selectedReward.image_url && handleImageZoom(selectedReward.image_url, e)}>
                  {selectedReward.image_url ? (
                    <>
                      <ImageWithFallback
                        src={selectedReward.image_url}
                        alt={selectedReward.title}
                        className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-transparent flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 px-4 py-2 rounded-full flex items-center gap-2 text-white text-sm">
                          <ZoomIn className="w-4 h-4" />
                          Click to zoom
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg">
                      {(() => {
                        const Icon = categoryIcons[selectedReward.category] || Gift;
                        return <Icon className="w-32 h-32 text-primary" />;
                      })()}
                    </div>
                  )}
                </div>
                
                <div className="grid gap-3 bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm font-medium">Cost:</span>
                    <Badge variant="default" className="text-base font-bold px-3 py-1">
                      {selectedReward.cost} tokens
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm font-medium">Your Balance:</span>
                    <span className="text-base font-bold text-primary">{claimBalance} tokens</span>
                  </div>
                  {selectedReward.stock_quantity !== null && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium">Available:</span>
                      <span className="text-base font-semibold">{selectedReward.stock_quantity} remaining</span>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowDetailModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleClaimClick} 
                  disabled={!canAfford(selectedReward.cost)}
                  className="flex-1"
                >
                  {canAfford(selectedReward.cost) ? 'Claim Reward' : 'Insufficient Balance'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Claim Modal with Shipping Info */}
      <Dialog open={showClaimModal} onOpenChange={setShowClaimModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Claim Reward</DialogTitle>
            <DialogDescription>
              {needsShipping
                ? 'Please provide your shipping information'
                : 'Confirm your reward claim'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {needsShipping && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={shippingInfo.name}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Textarea
                    id="address"
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                    placeholder="123 Main St"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={shippingInfo.city}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={shippingInfo.state}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                      placeholder="NY"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      value={shippingInfo.zip}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, zip: e.target.value })}
                      placeholder="10001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={shippingInfo.country}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                      placeholder="USA"
                    />
                  </div>
                </div>
              </>
            )}
            {!needsShipping && selectedReward && (
              <div className="text-center py-4">
                <p className="text-lg">
                  Confirm claim of <span className="font-bold">{selectedReward.title}</span> for{' '}
                  <span className="font-bold text-primary">{selectedReward.cost} tokens</span>?
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClaimModal(false)} disabled={claiming}>
              Cancel
            </Button>
            <Button onClick={handleClaim} disabled={claiming}>
              {claiming ? 'Claiming...' : 'Confirm Claim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Admin Bar */}
      {isAdmin && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-2xl px-4 py-2 flex items-center gap-3">
            <div className="flex items-center gap-2 pr-3 border-r border-white/30">
              <Crown className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Admin Mode</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 gap-2"
              onClick={() => navigate('/admin?tab=rewards')}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Manage Rewards</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 gap-2"
              onClick={() => navigate('/admin?tab=claims')}
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Claims</span>
            </Button>
            <Button
              size="sm"
              className="bg-white text-amber-600 hover:bg-white/90 gap-2"
              onClick={() => navigate('/admin')}
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Full Admin</span>
            </Button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
