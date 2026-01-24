import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { VisualRewardCard } from './VisualRewardCard';
import { ChevronLeft, ChevronRight, Gift, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useFavorites } from '@/hooks/useFavorites';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SponsoredReward {
  id: string;
  title: string;
  description: string;
  category: string;
  cost: number;
  image_url: string | null;
  stock_quantity: number | null;
  is_active: boolean;
  is_featured: boolean;
  is_sponsored?: boolean | null;
  sponsor_name?: string | null;
  sponsor_logo_url?: string | null;
  sponsor_logo?: string | null;
  sponsor_enabled?: boolean | null;
  min_status_tier?: string | null;
  status_tier_claims_cost?: Record<string, number> | null;
  campaign_id?: string | null;
}

async function fetchSponsoredRewards(): Promise<SponsoredReward[]> {
  // Use sponsor_enabled as the single source of truth for sponsored rewards
  const { data, error } = await supabase
    .from('rewards')
    .select('id, title, description, category, cost, image_url, stock_quantity, is_active, is_featured, is_sponsored, sponsor_name, sponsor_logo_url, sponsor_logo, sponsor_enabled, min_status_tier, status_tier_claims_cost, campaign_id')
    .eq('is_active', true)
    .eq('sponsor_enabled', true)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching sponsored rewards:', error);
    return [];
  }

  // Parse status_tier_claims_cost JSON if it's a string
  return (data || []).map(reward => ({
    ...reward,
    status_tier_claims_cost: typeof reward.status_tier_claims_cost === 'string' 
      ? JSON.parse(reward.status_tier_claims_cost) 
      : reward.status_tier_claims_cost as Record<string, number> | null
  }));
}

export function SponsoredRewardsCarousel() {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { tier } = useUnifiedUser();
  const { favorites, toggleFavorite, animatingIds } = useFavorites();

  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ['sponsored-rewards'],
    queryFn: fetchSponsoredRewards,
    staleTime: 5 * 60 * 1000,
  });

  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    
    // Calculate current visible card index
    const cardWidth = 320;
    const newIndex = Math.round(scrollLeft / cardWidth);
    setCurrentIndex(Math.min(newIndex, rewards.length - 1));
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, [rewards]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const cardWidth = 320;
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current) return;
    const cardWidth = 320;
    scrollContainerRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
  };

  const handleToggleFavorite = (rewardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(rewardId);
  };

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="w-6 h-6 text-primary" />
              Sponsored Opportunities
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Exclusive rewards from our partners
            </p>
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-[320px] h-[380px] rounded-xl flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (rewards.length === 0) {
    return null;
  }

  const userTier = tier ? { tierName: tier.display_name || tier.tier_name, tierLevel: tier.sort_order } : { tierName: 'Droplet', tierLevel: 1 };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Sponsored Opportunities
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Exclusive rewards from our partners — FREE or discounted based on your status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/rewards?sponsored=true')}
            className="text-primary"
          >
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative group">
        {/* Left Arrow */}
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            "hidden md:flex",
            !canScrollLeft && "!opacity-0 pointer-events-none"
          )}
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2 -mx-2 px-2 touch-pan-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="flex-shrink-0 w-[280px] md:w-[320px] snap-start transition-transform duration-200 active:scale-[0.98]"
            >
              <VisualRewardCard
                reward={reward}
                isInFavorites={favorites.has(reward.id)}
                onToggleFavorites={handleToggleFavorite}
                onClick={() => navigate(`/rewards/${reward.id}`)}
                isAnimatingHeart={animatingIds.has(reward.id)}
                userTier={userTier}
              />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            "hidden md:flex",
            !canScrollRight && "!opacity-0 pointer-events-none"
          )}
          onClick={() => scroll('right')}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile scroll indicator with active state */}
      <div className="flex justify-center gap-1.5 md:hidden pt-2">
        {rewards.slice(0, Math.min(5, rewards.length)).map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              currentIndex === i 
                ? "w-6 bg-primary" 
                : "w-1.5 bg-primary/30 hover:bg-primary/50"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
