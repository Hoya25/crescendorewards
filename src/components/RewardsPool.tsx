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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Gift, Sparkles, ShoppingBag, CreditCard, Coins, ZoomIn, X, Clock, Package, Heart, Store, Trophy, User, ChevronDown, ChevronRight, LogOut, LayoutDashboard, FileCheck, Receipt, BarChart3, Crown, ArrowLeft, Shield, Settings, Plus, Pencil, Search, ArrowUpDown, LayoutGrid, List, SlidersHorizontal, Star, Megaphone } from 'lucide-react';
import { MonthlyDrops } from '@/components/rewards/MonthlyDrops';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BuyClaims } from '@/components/BuyClaims';
import { RewardCard } from '@/components/rewards/RewardCard';
import { VisualRewardCard } from '@/components/rewards/VisualRewardCard';
import { RewardFilters } from '@/components/rewards/RewardFilters';
import { FeaturedRewardsCarousel } from '@/components/rewards/FeaturedRewardsCarousel';
import { StickyStatusBar } from '@/components/rewards/StickyStatusBar';
import { SponsoredRewardsCarousel } from '@/components/rewards/SponsoredRewardsCarousel';
import { SponsoredBanner } from '@/components/rewards/SponsoredBanner';
import { StatusBenefitsBanner } from '@/components/user/StatusBenefitsBanner';
import { CrescendoLogo } from '@/components/CrescendoLogo';
import { BetaBadge } from '@/components/BetaBadge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FavoritesIndicator } from '@/components/FavoritesIndicator';
import { ClaimsBalanceIndicator } from '@/components/claims/ClaimsBalanceIndicator';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { SEO } from '@/components/SEO';
import { Footer } from '@/components/Footer';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { RewardsGridSkeleton } from '@/components/skeletons/RewardCardSkeleton';
import { NoRewardsEmpty } from '@/components/EmptyState';
import { DataErrorState } from '@/components/DataErrorState';
import { BetaTestingNotice } from '@/components/BetaTestingNotice';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

interface Reward {
  id: string;
  title: string;
  description: string;
  category: 'alliance_tokens' | 'experiences' | 'merch' | 'gift_cards' | 'wellness' | 'subscriptions';
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
  min_status_tier?: string | null;
  is_sponsored?: boolean | null;
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

import { CATEGORY_LABELS, CATEGORY_ICONS, VALID_CATEGORY_VALUES } from '@/constants/rewards';

const categoryIcons = CATEGORY_ICONS;
const categoryLabels = CATEGORY_LABELS;

// Valid filter values for URL params
const VALID_SORTS = ['newest', 'oldest', 'priceLowToHigh', 'priceHighToLow', 'popularity'];
const VALID_CATEGORIES = ['all', ...VALID_CATEGORY_VALUES];
const VALID_PRICE_FILTERS = ['all', 'free', 'under100', 'under500', 'over500'];
const VALID_AVAILABILITY_FILTERS = ['all', 'inStock', 'lowStock'];

export function RewardsPool({ claimBalance, onClaimSuccess, onSubmitReward, onBack, onNavigateToBrands, onViewRewardDetail, carouselAutoplayDelay = 5000 }: RewardsPoolProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, signOut, setShowAuthModal, setAuthMode } = useAuthContext();
  const { profile, tier } = useUnifiedUser();
  const { isAdmin } = useAdminRole();
  const { isWatching, toggleWatch, isAnimating: isWatchAnimating, getWatchCount, fetchWatchCounts } = useWatchlist();
  const { favorites, toggleFavorite, animatingIds: favAnimatingIds } = useFavorites();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [sponsoredRewards, setSponsoredRewards] = useState<Reward[]>([]);
  const [featuredRewards, setFeaturedRewards] = useState<Reward[]>([]);
  const [filteredRewards, setFilteredRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  
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
  const [affordableFilter, setAffordableFilter] = useState<boolean>(() => 
    searchParams.get('affordable') === 'true'
  );
  const [sponsoredFilter, setSponsoredFilter] = useState<boolean>(() => 
    searchParams.get('sponsored') === 'true'
  );
  const [featuredFilter, setFeaturedFilter] = useState<boolean>(() => 
    searchParams.get('featured') === 'true'
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
    if (affordableFilter) params.set('affordable', 'true');
    if (sponsoredFilter) params.set('sponsored', 'true');
    if (featuredFilter) params.set('featured', 'true');
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    
    setSearchParams(params, { replace: true });
  }, [sortBy, activeCategory, priceFilter, availabilityFilter, exclusiveFilter, highValueFilter, affordableFilter, sponsoredFilter, featuredFilter, searchQuery, setSearchParams]);

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

    // Apply affordable filter - show only rewards user can afford
    if (affordableFilter) {
      filtered = filtered.filter(r => r.cost <= claimBalance);
    }

    // Apply free filter - show only free rewards (cost = 0)
    if (sponsoredFilter) {
      filtered = filtered.filter(r => r.cost === 0);
    }

    // Apply featured filter - show only featured rewards
    if (featuredFilter) {
      // Include featured rewards from the main list too
      filtered = rewards.filter(r => r.is_featured);
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
  }, [activeCategory, rewards, sortBy, priceFilter, availabilityFilter, exclusiveFilter, highValueFilter, affordableFilter, sponsoredFilter, featuredFilter, claimBalance, searchQuery, fetchWatchCounts]);

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
      
      // Filter sponsored rewards
      const sponsored = rewardsWithBrandName.filter((r: any) => 
        r.sponsor_enabled || r.is_sponsored
      );
      setSponsoredRewards(sponsored as Reward[]);
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
    <div className="min-h-screen bg-background pb-20 w-full max-w-[100vw] overflow-x-hidden">
      <SEO 
        title="Rewards"
        description="Browse and claim exclusive rewards including experiences, merchandise, subscriptions, and more."
      />

      {/* Simple nav bar for unauthenticated users (authenticated get AppLayout header) */}
      {!isAuthenticated && (
        <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="container mx-auto px-4 py-1 flex items-center justify-between max-w-full">
            <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
              <CrescendoLogo />
            </button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/how-it-works')}>How It Works</Button>
              <Button variant="outline" size="sm" onClick={handleSignIn}>Sign In</Button>
              <Button size="sm" onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}>Join Free</Button>
            </div>
          </div>
        </nav>
      )}

      {/* Zero Claims Banner */}
      {isAuthenticated && claimBalance === 0 && !localStorage.getItem('dismiss-zero-claims-banner') && (
        <div className="container mx-auto px-4 max-w-full">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 my-1 rounded-md" style={{ backgroundColor: '#141416', borderLeft: '2px solid #C8FF00' }}>
            <p className="text-sm text-neutral-300">
              You have <span className="font-semibold text-white">0 Claims</span>. Get some to start claiming rewards{' '}
              <button onClick={() => navigate('/buy-claims')} className="font-semibold hover:underline" style={{ color: '#C8FF00' }}>→</button>
            </p>
            <button
              onClick={(e) => { localStorage.setItem('dismiss-zero-claims-banner', 'true'); (e.target as HTMLElement).closest('[style]')?.remove(); }}
              className="text-neutral-500 hover:text-neutral-300 text-lg leading-none px-1"
              aria-label="Dismiss"
            >×</button>
          </div>
        </div>
      )}

      {/* Combined sticky bar: tier + categories + filters */}
      <div className={cn(
        "sticky z-30 bg-background/95 backdrop-blur border-b",
        isAuthenticated ? "top-[42px] md:top-[46px]" : "top-[42px] md:top-[46px]"
      )}>
        {/* Tier info row (auth only) */}
        {isAuthenticated && (
          <div className="container mx-auto px-4 max-w-full border-b">
            <div className="flex items-center justify-between h-8">
              <div className="flex items-center gap-2 text-sm">
                <span>{tier?.badge_emoji || '💧'}</span>
                <span className="font-semibold" style={{ color: tier?.badge_color }}>{tier?.display_name || 'Member'}</span>
                <span className="text-muted-foreground">|</span>
                <span className="font-medium">{claimBalance}</span>
                <span className="text-muted-foreground text-xs">claims</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/membership')} className="text-xs gap-1 h-7">
                Level Up <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Category pills row */}
        <div className="container mx-auto px-4 max-w-full">
          <div className="relative">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 -mx-4 px-4 scrollbar-hide">
            {[
              { key: 'all', label: 'All', icon: Gift, filter: 'category' },
              { key: 'free', label: 'Free', icon: Coins, filter: 'free' },
              { key: 'experiences', label: 'Experiences', icon: Sparkles, filter: 'category' },
              { key: 'merch', label: 'Merch', icon: ShoppingBag, filter: 'category' },
              { key: 'subscriptions', label: 'Subscriptions', icon: Trophy, filter: 'category' },
              { key: 'community', label: 'Community', icon: Heart, filter: 'category' },
            ].map(({ key, label, icon: Icon, filter }) => {
              const isActive = 
                key === 'free' ? sponsoredFilter :
                key === 'featured' ? featuredFilter :
                filter === 'category' && activeCategory === key && !sponsoredFilter && !featuredFilter;
              
              return (
                <Button
                  key={key}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    "flex-shrink-0 gap-1.5 rounded-full h-7 text-xs px-3",
                    isActive && "shadow-sm"
                  )}
                  onClick={() => {
                    if (key === 'featured') {
                      setFeaturedFilter(true);
                      setSponsoredFilter(false);
                      setAffordableFilter(false);
                      setActiveCategory('all');
                      setPriceFilter('all');
                    } else if (key === 'free') {
                      setSponsoredFilter(true);
                      setFeaturedFilter(false);
                      setAffordableFilter(false);
                      setActiveCategory('all');
                      setPriceFilter('all');
                    } else {
                      setAffordableFilter(false);
                      setSponsoredFilter(false);
                      setFeaturedFilter(false);
                      setActiveCategory(key);
                      setPriceFilter('all');
                    }
                  }}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </Button>
              );
            })}
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
          </div>
        </div>

        {/* Search + Sort + View row */}
        <div className="container mx-auto px-4 py-1.5 max-w-full border-t">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search rewards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 bg-background"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] h-9 bg-background">
                <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="priceLowToHigh">Price: Low-High</SelectItem>
                <SelectItem value="priceHighToLow">Price: High-Low</SelectItem>
                <SelectItem value="popularity">Popular</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex items-center border rounded-lg overflow-hidden h-9">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-full px-2.5"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-full px-2.5"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* More Filters Button */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-9"
              onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">More</span>
              {(priceFilter !== 'all' && priceFilter !== 'free') || availabilityFilter !== 'all' || exclusiveFilter !== 'all' ? (
                <Badge variant="secondary" className="h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                  {[priceFilter !== 'all' && priceFilter !== 'free', availabilityFilter !== 'all', exclusiveFilter === 'exclusive'].filter(Boolean).length}
                </Badge>
              ) : null}
            </Button>

            {/* Clear Filters (if active) */}
            {(affordableFilter || sponsoredFilter || priceFilter !== 'all' || activeCategory !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-muted-foreground"
                onClick={() => {
                  setAffordableFilter(false);
                  setSponsoredFilter(false);
                  setPriceFilter('all');
                  setActiveCategory('all');
                  setAvailabilityFilter('all');
                  setExclusiveFilter('all');
                }}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
            )}

            {/* Results Count */}
            <div className="ml-auto">
              <Badge variant="secondary" className="gap-1 text-xs">
                {filteredRewards.length} {filteredRewards.length === 1 ? 'reward' : 'rewards'}
              </Badge>
            </div>
          </div>

          {/* Expanded Advanced Filters */}
          {showFiltersDrawer && (
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t animate-fade-in">
              {/* Category Filter */}
              <Select value={activeCategory} onValueChange={(val) => {
                setActiveCategory(val);
                setAffordableFilter(false);
              }}>
                <SelectTrigger className="w-[150px] h-9 bg-background">
                  <Gift className="w-3.5 h-3.5 mr-1.5" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="experiences">Experiences</SelectItem>
                  <SelectItem value="subscriptions">Subscriptions</SelectItem>
                  <SelectItem value="gift_cards">Gift Cards</SelectItem>
                  <SelectItem value="merch">Merchandise</SelectItem>
                  <SelectItem value="alliance_tokens">Alliance Tokens</SelectItem>
                  <SelectItem value="wellness">Wellness</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="w-[130px] h-9 bg-background">
                  <Coins className="w-3.5 h-3.5 mr-1.5" />
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

              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="w-[130px] h-9 bg-background">
                  <Package className="w-3.5 h-3.5 mr-1.5" />
                  <SelectValue placeholder="Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="inStock">In Stock</SelectItem>
                  <SelectItem value="lowStock">Low Stock</SelectItem>
                </SelectContent>
              </Select>

              <Select value={exclusiveFilter} onValueChange={setExclusiveFilter}>
                <SelectTrigger className="w-[150px] h-9 bg-background">
                  <Crown className="w-3.5 h-3.5 mr-1.5" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rewards</SelectItem>
                  <SelectItem value="exclusive">Exclusive Only</SelectItem>
                </SelectContent>
              </Select>

              {/* Admin-only quick filters */}
              {isAdmin && (
                <>
                  <div className="h-6 w-px bg-border" />
                  <span className="text-xs text-muted-foreground font-medium">Admin:</span>
                  <Button
                    variant={affordableFilter ? 'default' : 'outline'}
                    size="sm"
                    className="h-9 gap-1.5"
                    onClick={() => {
                      setAffordableFilter(!affordableFilter);
                      if (!affordableFilter) {
                        setSponsoredFilter(false);
                        setPriceFilter('all');
                      }
                    }}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    Accessible
                  </Button>
                  <Button
                    variant={priceFilter === 'free' ? 'default' : 'outline'}
                    size="sm"
                    className="h-9 gap-1.5"
                    onClick={() => {
                      setPriceFilter(priceFilter === 'free' ? 'all' : 'free');
                      if (priceFilter !== 'free') {
                        setAffordableFilter(false);
                        setSponsoredFilter(false);
                      }
                    }}
                  >
                    <Gift className="w-3.5 h-3.5" />
                    Free
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Drops Section */}
      {!loading && (
        <MonthlyDrops
          userTierName={tier?.tier_name || 'Bronze'}
          onViewReward={(rewardId) => navigate(`/rewards/${rewardId}`)}
        />
      )}

      {/* Main Rewards Grid — starts immediately */}
      <div className="container mx-auto px-4 pt-4 pb-8 max-w-full">
        {/* Section Header — compact */}
        {!loading && (
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold">
              {activeCategory === 'all' ? 'All Rewards' : categoryLabels[activeCategory] || 'Rewards'}
            </h2>
            <Badge variant="secondary" className="text-xs">
              {filteredRewards.length}
            </Badge>
          </div>
        )}
        
        {loading ? (
          <RewardsGridSkeleton count={8} />
        ) : loadError ? (
          <DataErrorState
            title="Failed to load rewards"
            message="We couldn't load the rewards. Please check your connection and try again."
            onRetry={handleRetryLoad}
            retrying={retrying}
          />
        ) : filteredRewards.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Gift className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No rewards found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We couldn't find any rewards matching your filters. Try adjusting your search or filters.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
                setPriceFilter('all');
                setAvailabilityFilter('all');
                setExclusiveFilter('all');
              }}
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className={cn(
            "gap-4 md:gap-6",
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
              : "flex flex-col"
          )}>
            {filteredRewards.map((reward, index) => {
              const outOfStock = reward.stock_quantity !== null && reward.stock_quantity <= 0;
              const userTier = tier ? { tierName: tier.display_name || tier.tier_name, tierLevel: tier.sort_order } : { tierName: 'Bronze', tierLevel: 1 };
              
              return (
                <div 
                  key={reward.id} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {viewMode === 'grid' ? (
                    <VisualRewardCard
                      reward={{
                        ...reward,
                        is_sponsored: reward.sponsor_enabled || false,
                        sponsor_logo_url: reward.sponsor_logo,
                      }}
                      isInFavorites={favorites.has(reward.id)}
                      onToggleFavorites={(id, e) => {
                        e.stopPropagation();
                        toggleFavorite(id);
                      }}
                      onClick={() => handleRewardClick(reward)}
                      isAnimatingHeart={favAnimatingIds.has(reward.id)}
                      claimBalance={claimBalance}
                      userTier={userTier}
                      isAdmin={isAdmin}
                      onAdminEdit={(rewardId) => navigate(`/admin?tab=rewards&edit=${rewardId}`)}
                    />
                  ) : (
                    <RewardCard
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
                      userTier={tier?.tier_name?.toLowerCase() || 'bronze'}
                    />
                  )}
                </div>
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
                      {selectedReward.cost} Claims
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm font-medium">Your Balance:</span>
                    <span className="text-base font-bold text-primary">{claimBalance} Claims</span>
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
                {canAfford(selectedReward.cost) ? (
                  <Button 
                    onClick={handleClaimClick} 
                    className="flex-1"
                  >
                    Claim Reward
                  </Button>
                ) : (
                  <div className="flex-1 space-y-1">
                    <Button 
                      onClick={() => navigate('/buy-claims')}
                      className="w-full font-semibold"
                      style={{ backgroundColor: '#C8FF00', color: '#000' }}
                    >
                      Get Claims to Unlock
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      You need {selectedReward.cost - claimBalance} more Claims
                    </p>
                  </div>
                )}
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
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-full shadow-2xl px-4 py-2 flex items-center gap-3">
            <div className="flex items-center gap-2 pr-3 border-r border-primary-foreground/30">
              <Crown className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Admin Mode</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-primary-foreground hover:bg-primary-foreground/20 gap-2"
              onClick={() => navigate('/admin?tab=rewards')}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Manage Rewards</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-primary-foreground hover:bg-primary-foreground/20 gap-2"
              onClick={() => navigate('/admin?tab=claims')}
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Claims</span>
            </Button>
            <Button
              size="sm"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2"
              onClick={() => navigate('/admin')}
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Full Admin</span>
            </Button>
          </div>
        </div>
      )}

      {/* Bottom padding for mobile nav */}
      <div className="h-20 md:hidden" />
      
      <Footer />
    </div>
  );
}
