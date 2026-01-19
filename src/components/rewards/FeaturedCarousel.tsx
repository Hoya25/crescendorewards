import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import Autoplay from 'embla-carousel-autoplay';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Gift, Sparkles, ShoppingBag, CreditCard, Coins, Star, 
  Flame, AlertTriangle, Package, Zap, Heart, Play, Pause,
  ChevronLeft, ChevronRight, ArrowLeft, Trophy
} from 'lucide-react';

export interface FeaturedReward {
  id: string;
  title: string;
  description: string;
  category: string;
  cost: number;
  image_url: string | null;
  stock_quantity: number | null;
  is_featured: boolean;
  token_gated?: boolean | null;
  token_symbol?: string | null;
  minimum_token_balance?: number | null;
}

const categoryIcons = {
  alliance_tokens: Coins,
  experiences: Sparkles,
  merch: ShoppingBag,
  gift_cards: CreditCard,
  wellness: Heart,
  opportunity: Trophy,
};

const categoryLabels: Record<string, string> = {
  alliance_tokens: 'Alliance Tokens',
  experiences: 'Experiences',
  merch: 'Merch',
  gift_cards: 'Gift Cards',
  wellness: 'Wellness & Health',
  opportunity: 'Opportunity',
};

interface FeaturedCarouselProps {
  rewards: FeaturedReward[];
  onRewardClick: (reward: FeaturedReward) => void;
  onImageZoom: (imageUrl: string, e: React.MouseEvent) => void;
  wishlistItems: Set<string>;
  onToggleWishlist: (rewardId: string, e: React.MouseEvent) => void;
  animatingHearts?: Set<string>;
  autoplayDelay?: number;
  claimBalance?: number;
}

export function FeaturedCarousel({
  rewards,
  onRewardClick,
  onImageZoom,
  wishlistItems,
  onToggleWishlist,
  animatingHearts = new Set(),
  autoplayDelay = 5000,
  claimBalance = 0,
}: FeaturedCarouselProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showSwipeIndicators, setShowSwipeIndicators] = useState(true);
  const isMobile = useIsMobile();
  
  const autoplayPlugin = useRef(
    Autoplay({
      delay: autoplayDelay,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    })
  );

  // Haptic feedback function
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
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

  const canAfford = (cost: number) => claimBalance >= cost;

  if (rewards.length === 0) return null;

  return (
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
          {rewards.length} Featured
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
            {rewards.map((reward) => {
              const Icon = categoryIcons[reward.category as keyof typeof categoryIcons] || Gift;
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
                    onClick={() => onRewardClick(reward)}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    <div className="relative w-full h-64 md:h-80 bg-gradient-to-br from-primary/20 via-background to-secondary/20">
                      {reward.image_url ? (
                        <ImageWithFallback
                          src={reward.image_url}
                          alt={reward.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon className="w-20 h-20 text-muted-foreground/30" />
                        </div>
                      )}
                      
                      {/* All Badges - Top Left (Max 2) */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
                        <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm border-0 shadow-lg">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                        {reward.cost === 0 ? (
                          <Badge className="bg-green-500/90 text-white backdrop-blur-sm border-0 shadow-lg">
                            <Gift className="w-3 h-3 mr-1" />
                            FREE
                          </Badge>
                        ) : outOfStock ? (
                          <Badge className="bg-destructive/90 text-destructive-foreground backdrop-blur-sm border-0 shadow-lg">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Limited Supply
                          </Badge>
                        ) : reward.category === 'experiences' ? (
                          <Badge className="bg-orange-500/90 text-white backdrop-blur-sm border-0 shadow-lg">
                            <Flame className="w-3 h-3 mr-1" />
                            Trending
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="backdrop-blur-sm bg-background/80 border-border/50">
                            <Icon className="w-3 h-3 mr-1" />
                            {categoryLabels[reward.category] || reward.category}
                          </Badge>
                        )}
                      </div>

                      {/* Wishlist Heart Button - Top Right */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-3 right-3 z-20 bg-background/90 hover:bg-background backdrop-blur-sm h-9 w-9 rounded-full shadow-lg border border-border/20"
                        onClick={(e) => onToggleWishlist(reward.id, e)}
                      >
                        <Heart
                          className={`h-5 w-5 transition-colors ${
                            wishlistItems.has(reward.id)
                              ? 'fill-red-500 text-red-500'
                              : 'text-muted-foreground'
                          } ${animatingHearts.has(reward.id) ? 'animate-heart-bounce' : ''}`}
                        />
                      </Button>

                    </div>

                    <CardContent className="p-6 space-y-4">

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
                          onRewardClick(reward);
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
        {rewards.map((_, index) => (
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
  );
}
