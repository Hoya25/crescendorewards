import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Skeleton } from '@/components/ui/skeleton';
import Autoplay from 'embla-carousel-autoplay';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';
import { 
  Gift, Star, Heart, ChevronRight, Coins, Play, Pause,
  ChevronLeft, ArrowLeft, Package, AlertTriangle, Sparkles, Megaphone
} from 'lucide-react';
import { CATEGORY_ICONS, CATEGORY_LABELS, getCategoryIcon } from '@/constants/rewards';

interface FeaturedReward {
  id: string;
  title: string;
  description: string;
  category: string;
  cost: number;
  image_url: string | null;
  stock_quantity: number | null;
  is_featured: boolean;
  is_sponsored?: boolean;
  sponsor_enabled?: boolean;
  sponsor_name?: string | null;
  sponsor_logo_url?: string | null;
}

type CarouselType = 'featured' | 'sponsored' | 'all';

interface FeaturedRewardsCarouselProps {
  type?: CarouselType;
  autoplayDelay?: number;
  maxItems?: number;
  showHeader?: boolean;
  claimBalance?: number;
}

export function FeaturedRewardsCarousel({ 
  type = 'featured',
  autoplayDelay = 4000,
  maxItems = 10,
  showHeader = true,
  claimBalance = 0,
}: FeaturedRewardsCarouselProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { favorites, toggleFavorite, animatingIds } = useFavorites();
  const [rewards, setRewards] = useState<FeaturedReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showSwipeIndicators, setShowSwipeIndicators] = useState(true);

  const autoplayPlugin = useRef(
    Autoplay({
      delay: autoplayDelay,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    })
  );

  // Haptic feedback
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  };

  useEffect(() => {
    loadRewards();
  }, [type]);

  useEffect(() => {
    if (!carouselApi) return;
    
    const onSelect = () => {
      triggerHaptic();
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    
    setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on('select', onSelect);
    
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  // Hide swipe indicators after first interaction
  useEffect(() => {
    if (!carouselApi) return;
    
    const onScroll = () => {
      setShowSwipeIndicators(false);
    };

    carouselApi.on('scroll', onScroll);
    return () => {
      carouselApi.off('scroll', onScroll);
    };
  }, [carouselApi]);

  const loadRewards = async () => {
    try {
      let query = supabase
        .from('rewards')
        .select('id, title, description, category, cost, image_url, stock_quantity, is_featured, sponsor_enabled, sponsor_name, sponsor_logo_url')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(maxItems);

      // Apply type-specific filters
      if (type === 'featured') {
        query = query.eq('is_featured', true);
      } else if (type === 'sponsored') {
        query = query.eq('sponsor_enabled', true);
      } else {
        // 'all' - show both featured and sponsored
        query = query.or('is_featured.eq.true,sponsor_enabled.eq.true');
      }

      const { data, error } = await query;

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRewardClick = (rewardId: string) => {
    navigate(`/rewards/${rewardId}`);
  };

  const handleToggleFavorite = (rewardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(rewardId);
  };

  const canAfford = (cost: number) => claimBalance >= cost;

  // Header configuration based on type
  const headerConfig = {
    featured: { icon: Star, title: 'Featured Rewards', color: 'text-amber-500' },
    sponsored: { icon: Megaphone, title: 'Sponsored Rewards', color: 'text-primary' },
    all: { icon: Sparkles, title: 'Featured & Sponsored', color: 'text-primary' },
  };
  const { icon: HeaderIcon, title: headerTitle, color: headerColor } = headerConfig[type];

  if (loading) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-9 w-24" />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (rewards.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeaderIcon className={cn("w-5 h-5", headerColor)} />
            <h2 className="text-xl font-semibold">{headerTitle}</h2>
            <Badge variant="secondary" className="gap-1">
              {rewards.length}
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/rewards?${type === 'sponsored' ? 'sponsored' : 'featured'}=true`)} 
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Carousel */}
      <div 
        className="w-full overflow-hidden relative"
        onMouseEnter={() => setIsCarouselHovered(true)}
        onMouseLeave={() => setIsCarouselHovered(false)}
      >
        <Carousel
          setApi={setCarouselApi}
          opts={{
            align: 'start',
            loop: rewards.length > 3,
            skipSnaps: false,
            dragFree: true,
            duration: 25,
          }}
          plugins={[autoplayPlugin.current]}
          className="w-full touch-pan-x cursor-grab active:cursor-grabbing"
        >
          <CarouselContent className="-ml-3">
            {rewards.map((reward) => {
              const Icon = getCategoryIcon(reward.category);
              const isInFavorites = favorites.has(reward.id);
              const isAnimating = animatingIds.has(reward.id);
              const outOfStock = reward.stock_quantity !== null && reward.stock_quantity <= 0;
              const affordable = canAfford(reward.cost);
              const isSponsored = reward.sponsor_enabled;

              return (
                <CarouselItem 
                  key={reward.id} 
                  className="pl-3 basis-full sm:basis-1/2 lg:basis-1/3"
                >
                  <Card 
                    className={cn(
                      "group cursor-pointer overflow-hidden transition-all duration-200",
                      "hover:scale-[1.02] hover:shadow-xl rounded-xl border select-none",
                      isSponsored 
                        ? "border-amber-400/50 dark:border-amber-500/30" 
                        : "border-border"
                    )}
                    onClick={() => handleRewardClick(reward.id)}
                  >
                    {/* Image Section */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      {reward.image_url ? (
                        <ImageWithFallback
                          src={reward.image_url}
                          alt={reward.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <Icon className="w-16 h-16 text-muted-foreground/30" />
                        </div>
                      )}

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* Badges - Top Left (max 2) */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
                        {reward.is_featured && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 shadow-lg">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        {reward.cost === 0 ? (
                          <Badge className="bg-green-500/90 text-white backdrop-blur-sm border-0 shadow-lg">
                            <Gift className="w-3 h-3 mr-1" />
                            FREE
                          </Badge>
                        ) : outOfStock && (
                          <Badge className="bg-destructive/90 text-destructive-foreground backdrop-blur-sm border-0 shadow-lg">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Out of Stock
                          </Badge>
                        )}
                      </div>

                      {/* Favorites Heart - Top Right */}
                      <button
                        className={cn(
                          "absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center",
                          "bg-white/90 dark:bg-black/70 backdrop-blur-md shadow-lg",
                          "transition-all duration-200 hover:scale-110"
                        )}
                        onClick={(e) => handleToggleFavorite(reward.id, e)}
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4 transition-all duration-200",
                            isInFavorites
                              ? "fill-red-500 text-red-500"
                              : "text-gray-600 dark:text-gray-300",
                            isAnimating && "animate-[heartBounce_0.3s_ease-in-out]"
                          )}
                        />
                      </button>

                      {/* Sponsor Attribution - Bottom */}
                      {isSponsored && reward.sponsor_name && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-3 py-2">
                          <div className="flex items-center gap-2">
                            {reward.sponsor_logo_url && (
                              <img 
                                src={reward.sponsor_logo_url} 
                                alt={reward.sponsor_name} 
                                className="h-4 w-auto object-contain"
                              />
                            )}
                            <span className="text-[10px] text-white/80">
                              Sponsored by <span className="font-semibold text-amber-300">{reward.sponsor_name}</span>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Title Overlay */}
                      <div className={cn(
                        "absolute left-0 right-0 px-3 pb-3",
                        isSponsored && reward.sponsor_name ? "bottom-8" : "bottom-0"
                      )}>
                        <h3 className="font-bold text-white text-lg leading-tight line-clamp-2 drop-shadow-md">
                          {reward.title}
                        </h3>
                      </div>
                    </div>

                    {/* Content Section */}
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-primary" />
                          <span className="font-bold text-lg">{reward.cost}</span>
                          <span className="text-sm text-muted-foreground">Claims</span>
                        </div>
                        {reward.stock_quantity !== null && reward.stock_quantity > 0 && reward.stock_quantity <= 10 && (
                          <Badge variant="outline" className="text-xs">
                            <Package className="w-3 h-3 mr-1" />
                            {reward.stock_quantity} left
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          
          {!isMobile && rewards.length > 3 && (
            <>
              <CarouselPrevious className="-left-4 bg-background/90 backdrop-blur border shadow-lg hover:bg-primary/10" />
              <CarouselNext className="-right-4 bg-background/90 backdrop-blur border shadow-lg hover:bg-primary/10" />
            </>
          )}
        </Carousel>

        {/* Play/Pause Control */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-14 w-14 rounded-full",
            "bg-background/90 backdrop-blur-sm border-2 hover:bg-primary/10 hover:border-primary",
            "hover:scale-110 transition-all duration-300 shadow-xl",
            isCarouselHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
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
      {rewards.length > 1 && (
        <div className="flex justify-center gap-1.5 pt-2">
          {rewards.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                carouselApi?.scrollTo(index);
                triggerHaptic();
              }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                currentSlide === index 
                  ? "w-6 bg-primary" 
                  : "w-1.5 bg-primary/30 hover:bg-primary/50"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Swipe Hint for Mobile */}
      {isMobile && (
        <div className="flex justify-center items-center gap-2 mt-2 text-xs text-muted-foreground animate-pulse">
          <ArrowLeft className="w-3 h-3 animate-[slide-in-right_1s_ease-in-out_infinite_alternate]" />
          <span className="font-medium">Swipe to explore</span>
          <ArrowLeft className="w-3 h-3 rotate-180 animate-[slide-in-right_1s_ease-in-out_infinite_alternate]" />
        </div>
      )}
    </section>
  );
}
