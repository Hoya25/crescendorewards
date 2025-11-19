import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { toast } from '@/hooks/use-toast';
import { Gift, Sparkles, ShoppingBag, CreditCard, Coins, ZoomIn, X, Star, Flame, Clock, Lock, AlertTriangle, Package, Zap, ArrowUpDown, Filter, Search, ArrowLeft, Store, Trophy, Heart, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Autoplay from 'embla-carousel-autoplay';
import { BuyClaims } from '@/components/BuyClaims';
import { useIsMobile } from '@/hooks/use-mobile';

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

const categoryLabels = {
  alliance_tokens: 'Alliance Tokens',
  experiences: 'Experiences',
  merch: 'Merch',
  gift_cards: 'Gift Cards',
  wellness: 'Wellness & Health',
};

export function RewardsPool({ claimBalance, onClaimSuccess, onSubmitReward, onBack, onNavigateToBrands, onViewRewardDetail, carouselAutoplayDelay = 5000 }: RewardsPoolProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [featuredRewards, setFeaturedRewards] = useState<Reward[]>([]);
  const [filteredRewards, setFilteredRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showSwipeIndicators, setShowSwipeIndicators] = useState(true);
  const isMobile = useIsMobile();
  const autoplayPlugin = useRef(
    Autoplay({
      delay: carouselAutoplayDelay,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    })
  );
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });

  // Haptic feedback function
  const triggerHaptic = () => {
    // Check if device supports vibration
    if ('vibrate' in navigator) {
      // Short, subtle vibration (20ms)
      navigator.vibrate(20);
    }
  };

  // Set up carousel event listener for haptic feedback and slide tracking
  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      triggerHaptic();
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };

    // Set initial slide
    setCurrentSlide(carouselApi.selectedScrollSnap());

    carouselApi.on('select', onSelect);

    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  useEffect(() => {
    loadRewards();
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

    // Apply sorting
    const sortedFiltered = [...filtered].sort((a, b) => {
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
  }, [activeCategory, rewards, sortBy, priceFilter, availabilityFilter, searchQuery]);

  const loadRewards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRewards(data as Reward[] || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
      toast({
        title: 'Error',
        description: 'Failed to load rewards',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b w-full">
        <div className="container mx-auto px-4 py-4 md:py-6 max-w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Rewards Marketplace
              </h1>
              <p className="text-muted-foreground mt-1 truncate text-sm md:text-base">Redeem your tokens for amazing rewards</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
              <div className="text-right flex-1 sm:flex-none sm:block">
                <p className="text-xs sm:text-sm text-muted-foreground">Your Balance</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary">{claimBalance}</p>
                <p className="text-xs text-muted-foreground">Claims</p>
              </div>
              <BuyClaims 
                currentBalance={claimBalance} 
                onPurchaseSuccess={onClaimSuccess}
              />
              {onNavigateToBrands && (
                <Button
                  onClick={onNavigateToBrands}
                  variant="outline"
                  className="gap-2"
                >
                  <Store className="w-4 h-4" />
                  <span className="hidden sm:inline">Brand Partners</span>
                </Button>
              )}
              {onSubmitReward && (
                <Button
                  onClick={onSubmitReward}
                  variant="outline"
                  className="gap-2 border-primary/20 hover:bg-primary/10"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Submit Reward</span>
                </Button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search rewards by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border"
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

          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mt-4 w-full">
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

          {/* Filters and Sorting */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filters:</span>
            </div>
            
            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
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
            <Select value={priceFilter} onValueChange={setPriceFilter}>
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
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
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

            {/* Results Count */}
            <div className="ml-auto text-sm text-muted-foreground">
              <Badge variant="secondary" className="gap-1">
                {filteredRewards.length} {filteredRewards.length === 1 ? 'reward' : 'rewards'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Rewards Carousel */}
      {!loading && featuredRewards.length > 0 && (
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-primary animate-pulse" />
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Featured Rewards
              </h2>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="w-3 h-3" />
              {featuredRewards.length} Featured
            </Badge>
          </div>
          
          <div 
            className="w-full overflow-hidden -mx-4 px-4 relative"
            onMouseEnter={() => setIsCarouselHovered(true)}
            onMouseLeave={() => setIsCarouselHovered(false)}
          >
            <Carousel
              setApi={setCarouselApi}
              opts={{
                align: "start",
                loop: true,
                skipSnaps: false,
                dragFree: true,
                containScroll: "trimSnaps",
                slidesToScroll: 1,
                duration: 25,
                dragThreshold: 10,
                inViewThreshold: 0.7,
              }}
              plugins={[autoplayPlugin.current]}
              className="w-full touch-pan-x cursor-grab active:cursor-grabbing"
            >
              <CarouselContent className="-ml-2 md:-ml-4 transition-transform duration-300 ease-out">
              {featuredRewards.map((reward, index) => {
                const Icon = categoryIcons[reward.category] || Gift;
                const affordable = canAfford(reward.cost);
                const outOfStock = reward.stock_quantity !== null && reward.stock_quantity <= 0;
                const stockPercentage = reward.stock_quantity !== null ? (reward.stock_quantity / 100) * 100 : 100;

                return (
                <CarouselItem 
                  key={reward.id} 
                  className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                >
                  <Card 
                    className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border-0 overflow-hidden bg-card select-none touch-pan-y"
                    onClick={() => handleRewardClick(reward)}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    <div className="relative w-full h-64 md:h-80 bg-gradient-to-br from-primary/20 via-background to-secondary/20">
                        {reward.image_url ? (
                          <ImageWithFallback
                            src={reward.image_url}
                            alt={reward.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon className="w-20 h-20 text-muted-foreground/30" />
                          </div>
                        )}
                        
                        {/* Badge Cluster - Top Right */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                          <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm border-0 shadow-lg">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                          {reward.cost === 0 && (
                            <Badge className="bg-green-500/90 text-white backdrop-blur-sm border-0 shadow-lg">
                              <Gift className="w-3 h-3 mr-1" />
                              FREE
                            </Badge>
                          )}
                          {outOfStock && (
                            <Badge className="bg-destructive/90 text-destructive-foreground backdrop-blur-sm border-0 shadow-lg">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Limited Supply
                            </Badge>
                          )}
                          {reward.category === 'experiences' && (
                            <Badge className="bg-orange-500/90 text-white backdrop-blur-sm border-0 shadow-lg">
                              <Flame className="w-3 h-3 mr-1" />
                              Trending
                            </Badge>
                          )}
                        </div>

                        {/* Category Badge - Top Left */}
                        <div className="absolute top-4 left-4">
                          <Badge variant="secondary" className="backdrop-blur-sm bg-background/80 border-border/50">
                            <Icon className="w-3 h-3 mr-1" />
                            {categoryLabels[reward.category]}
                          </Badge>
                        </div>

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                      </div>

                      <CardContent className="relative -mt-32 z-10 p-6 space-y-4">
                        {/* Brand Info */}
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="w-10 h-10 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {reward.title.substring(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Featured by</p>
                            <p className="font-semibold text-sm">Partner Brand</p>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-2">
                          <h3 className="text-2xl font-bold line-clamp-2">{reward.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{reward.description}</p>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-4 py-4 border-y border-border/50">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-primary mb-1">
                              <Coins className="w-4 h-4" />
                              <span className="text-xl font-bold">{reward.cost}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">Claims</span>
                          </div>
                          <div className="text-center border-x border-border/50">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Package className="w-4 h-4" />
                              <span className="text-xl font-bold">{reward.stock_quantity || 'Unlimited'}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">Available</span>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Zap className="w-4 h-4 text-orange-500" />
                              <span className="text-xl font-bold">Instant</span>
                            </div>
                            <span className="text-xs text-muted-foreground">Delivery</span>
                          </div>
                        </div>

                        {/* Stock Progress */}
                        {reward.stock_quantity !== null && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {reward.stock_quantity}/{100} left
                              </span>
                              <span className="text-muted-foreground">{Math.round(stockPercentage)}%</span>
                            </div>
                            <Progress 
                              value={stockPercentage} 
                              className="h-2"
                            />
                          </div>
                        )}

                        {/* CTA Button */}
                        <Button
                          size="lg"
                          className="w-full"
                          variant={affordable && !outOfStock ? "default" : "secondary"}
                          disabled={!affordable || outOfStock}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRewardClick(reward);
                          }}
                        >
                          {outOfStock ? 'Out of Stock' : affordable ? (
                            <>
                              <Gift className="w-4 h-4 mr-2" />
                              Claim This Reward →
                            </>
                          ) : 'Insufficient Balance'}
                        </Button>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="-left-4 md:-left-12 lg:-left-16 hover:scale-110 active:scale-95 transition-all duration-200 bg-background/90 backdrop-blur shadow-lg border-2 border-border/50 h-12 w-12 hover:bg-primary/10 hover:border-primary" />
            <CarouselNext className="-right-4 md:-right-12 lg:-right-16 hover:scale-110 active:scale-95 transition-all duration-200 bg-background/90 backdrop-blur shadow-lg border-2 border-border/50 h-12 w-12 hover:bg-primary/10 hover:border-primary" />
          </Carousel>
          
          {/* Play/Pause Control */}
          <Button
            variant="outline"
            size="icon"
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-14 w-14 rounded-full bg-background/90 backdrop-blur-sm border-2 hover:bg-primary/10 hover:border-primary hover:scale-110 transition-all duration-300 shadow-xl ${
              isCarouselHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => {
              if (isPlaying) {
                autoplayPlugin.current.stop();
                setIsPlaying(false);
              } else {
                autoplayPlugin.current.play();
                setIsPlaying(true);
              }
              triggerHaptic();
            }}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-0.5" />
            )}
          </Button>

          {/* Swipe Gesture Indicators - Mobile Only */}
          {isMobile && showSwipeIndicators && (
            <>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 animate-fade-in pointer-events-none">
                <div className="flex items-center gap-2 bg-primary/90 backdrop-blur-sm text-primary-foreground px-4 py-2 rounded-full shadow-lg animate-pulse">
                  <ChevronLeft className="h-5 w-5" />
                  <span className="text-sm font-medium">Swipe</span>
                </div>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 animate-fade-in pointer-events-none">
                <div className="flex items-center gap-2 bg-primary/90 backdrop-blur-sm text-primary-foreground px-4 py-2 rounded-full shadow-lg animate-pulse">
                  <span className="text-sm font-medium">Swipe</span>
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>
            </>
          )}
          </div>

          {/* Carousel Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {featuredRewards.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  carouselApi?.scrollTo(index);
                  triggerHaptic();
                }}
                className={`h-2 rounded-full transition-all duration-300 ease-out ${
                  currentSlide === index 
                    ? 'w-8 bg-primary shadow-lg shadow-primary/50' 
                    : 'w-2 bg-primary/30 hover:bg-primary/60 hover:scale-125 active:scale-90'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          
          {/* Swipe Hint for Mobile */}
          <div className="flex md:hidden justify-center items-center gap-2 mt-4 text-xs text-muted-foreground animate-pulse">
            <ArrowLeft className="w-3 h-3 animate-[slide-in-right_1s_ease-in-out_infinite_alternate]" />
            <span className="font-medium">Swipe to explore</span>
            <ArrowLeft className="w-3 h-3 rotate-180 animate-[slide-in-right_1s_ease-in-out_infinite_alternate]" />
          </div>
        </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse overflow-hidden">
                <div className="h-56 bg-muted" />
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRewards.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">No rewards available in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredRewards.map((reward) => {
              const Icon = categoryIcons[reward.category] || Gift;
              const affordable = canAfford(reward.cost);
              const outOfStock = reward.stock_quantity !== null && reward.stock_quantity <= 0;
              const stockPercentage = reward.stock_quantity !== null ? (reward.stock_quantity / 100) * 100 : 100;

              return (
                <Card
                  key={reward.id}
                  className={`group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl overflow-hidden ${
                    !affordable || outOfStock ? 'opacity-60' : ''
                  }`}
                  onClick={() => handleRewardClick(reward)}
                >
                  <div className="relative w-full h-56 bg-gradient-to-br from-muted/50 to-muted/20">
                    {reward.image_url ? (
                      <ImageWithFallback
                        src={reward.image_url}
                        alt={reward.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    )}

                    {/* Badge Stack - Top Right */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                      {reward.cost === 0 && (
                        <Badge className="bg-green-500/90 text-white backdrop-blur-sm border-0 shadow-lg text-xs">
                          <Gift className="w-3 h-3 mr-1" />
                          FREE
                        </Badge>
                      )}
                      {reward.id === '796f68d6-7765-448c-a588-a1d95565a0cf' && (
                        <Badge className="bg-orange-500/90 text-white backdrop-blur-sm border-0 shadow-lg text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          Limited
                        </Badge>
                      )}
                      {outOfStock && (
                        <Badge className="bg-destructive/90 backdrop-blur-sm border-0 shadow-lg text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Limited
                        </Badge>
                      )}
                      {reward.category === 'experiences' && !reward.id.includes('796f68d6') && (
                        <Badge className="bg-orange-500/90 text-white backdrop-blur-sm border-0 shadow-lg text-xs">
                          <Flame className="w-3 h-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                      {Math.random() > 0.7 && (
                        <Badge className="bg-green-600/90 text-white backdrop-blur-sm border-0 shadow-lg text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          New
                        </Badge>
                      )}
                    </div>

                    {/* Category Badge - Top Left */}
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="backdrop-blur-sm bg-background/80 border-border/50 text-xs">
                        <Icon className="w-3 h-3 mr-1" />
                        {categoryLabels[reward.category]}
                      </Badge>
                    </div>

                    {/* Cost Badge - Bottom Left */}
                    <div className="absolute bottom-3 left-3">
                      <Badge className="bg-background/90 backdrop-blur-sm border border-primary/20 text-primary font-bold shadow-lg">
                        <Coins className="w-3 h-3 mr-1" />
                        {reward.cost}
                      </Badge>
                    </div>

                    {/* Zoom Overlay */}
                    <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-primary" />
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-4">
                    {/* Brand Avatar */}
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8 border border-border">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {reward.title.substring(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">by Partner Brand</p>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {reward.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{reward.description}</p>
                    </div>

                    {/* Stock Info */}
                    {reward.stock_quantity !== null && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {reward.stock_quantity}/100 left
                          </span>
                          <span>{Math.round(stockPercentage)}%</span>
                        </div>
                        <Progress value={stockPercentage} className="h-1.5" />
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      className="w-full"
                      variant={affordable && !outOfStock ? "default" : "secondary"}
                      disabled={!affordable || outOfStock}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRewardClick(reward);
                      }}
                    >
                      {outOfStock ? 'Out of Stock' : affordable ? (
                        <>
                          <Gift className="w-4 h-4 mr-2" />
                          Claim Reward
                        </>
                      ) : 'Insufficient Balance'}
                    </Button>

                    {/* Delivery Info */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                      <Clock className="w-3 h-3" />
                      <span>Delivery: Within 24 hours</span>
                    </div>
                  </CardContent>
                </Card>
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
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
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
    </div>
  );
}
