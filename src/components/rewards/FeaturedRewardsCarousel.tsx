import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Skeleton } from '@/components/ui/skeleton';
import Autoplay from 'embla-carousel-autoplay';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';
import { 
  Gift, Sparkles, Star, Heart, ChevronRight, Coins, Trophy, ShoppingBag, CreditCard
} from 'lucide-react';

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
  sponsor_name?: string | null;
  sponsor_logo_url?: string | null;
}

const categoryIcons: Record<string, React.ElementType> = {
  alliance_tokens: Coins,
  experiences: Sparkles,
  merch: ShoppingBag,
  gift_cards: CreditCard,
  wellness: Heart,
  subscriptions: Trophy,
};

export function FeaturedRewardsCarousel() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { favorites, toggleFavorite, animatingIds } = useFavorites();
  const [rewards, setRewards] = useState<FeaturedReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  const autoplayPlugin = useRef(
    Autoplay({
      delay: 4000,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    })
  );

  useEffect(() => {
    loadFeaturedRewards();
  }, []);

  useEffect(() => {
    if (!carouselApi) return;
    
    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    
    setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on('select', onSelect);
    
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  const loadFeaturedRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error loading featured rewards:', error);
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-semibold">Featured Rewards</h2>
          <Badge variant="secondary" className="gap-1">
            {rewards.length}
          </Badge>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/rewards?featured=true')} 
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Carousel */}
      <Carousel
        setApi={setCarouselApi}
        opts={{
          align: 'start',
          loop: rewards.length > 3,
          skipSnaps: false,
        }}
        plugins={[autoplayPlugin.current]}
        className="w-full"
      >
        <CarouselContent className="-ml-3">
          {rewards.map((reward) => {
            const Icon = categoryIcons[reward.category] || Gift;
            const isInFavorites = favorites.has(reward.id);
            const isAnimating = animatingIds.has(reward.id);

            return (
              <CarouselItem 
                key={reward.id} 
                className="pl-3 basis-full sm:basis-1/2 lg:basis-1/3"
              >
                <Card 
                  className={cn(
                    "group cursor-pointer overflow-hidden transition-all duration-200",
                    "hover:scale-[1.02] hover:shadow-xl rounded-xl border",
                    reward.is_sponsored 
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

                    {/* Featured Badge - Top Left */}
                    <Badge 
                      className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 shadow-lg"
                    >
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>

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
                    {reward.is_sponsored && reward.sponsor_name && (
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
                      reward.is_sponsored && reward.sponsor_name ? "bottom-8" : "bottom-0"
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
                      {reward.cost === 0 && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                          <Gift className="w-3 h-3 mr-1" />
                          FREE
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

      {/* Carousel Indicators */}
      {rewards.length > 1 && (
        <div className="flex justify-center gap-1.5 pt-2">
          {rewards.map((_, index) => (
            <button
              key={index}
              onClick={() => carouselApi?.scrollTo(index)}
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
    </section>
  );
}
