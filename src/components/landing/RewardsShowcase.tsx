import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { ChevronRight, Gift, Lock, Sparkles, ShoppingBag, CreditCard, Coins, Heart, Trophy, Zap, Music, Ticket } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import Autoplay from 'embla-carousel-autoplay';

interface ShowcaseReward {
  id: string;
  title: string;
  image_url: string | null;
  category: string;
  cost: number;
}

const categoryIcons: Record<string, React.ElementType> = {
  alliance_tokens: Coins,
  experiences: Sparkles,
  merch: ShoppingBag,
  gift_cards: CreditCard,
  wellness: Heart,
  subscriptions: Trophy,
  gaming: Zap,
  music: Music,
  events: Ticket,
};

export function RewardsShowcase() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { setShowAuthModal, setAuthMode } = useAuthContext();
  const [rewards, setRewards] = useState<ShowcaseReward[]>([]);
  const [loading, setLoading] = useState(true);

  const autoplayPlugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const { data, error } = await supabase
          .from('rewards')
          .select('id, title, image_url, category, cost')
          .eq('is_active', true)
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(8);

        if (error) throw error;
        setRewards(data || []);
      } catch (error) {
        console.error('Error fetching showcase rewards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, []);

  const handleCardClick = (rewardId: string) => {
    navigate(`/rewards/${rewardId}`);
  };

  const handleSignup = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  if (loading) {
    return (
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-64 mx-auto mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (rewards.length === 0) return null;

  return (
    <section className="py-12 md:py-20 px-4 md:px-6 bg-muted/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-4xl font-bold mb-3">What Will You Unlock?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Real rewards from real brands — streaming, gift cards, experiences, and more.
          </p>
        </div>

        {/* Mobile: horizontal swipeable carousel */}
        {isMobile ? (
          <Carousel
            opts={{ align: 'start', loop: true, containScroll: 'trimSnaps' }}
            plugins={[autoplayPlugin.current]}
            className="w-full"
          >
            <CarouselContent className="-ml-3">
              {rewards.map((reward) => (
                <CarouselItem key={reward.id} className="pl-3 basis-[85%]">
                  <ShowcaseCard reward={reward} onClick={() => handleCardClick(reward.id)} onSignup={handleSignup} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          /* Desktop: grid */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {rewards.slice(0, 8).map((reward) => (
              <ShowcaseCard key={reward.id} reward={reward} onClick={() => handleCardClick(reward.id)} onSignup={handleSignup} />
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Button
            onClick={() => navigate('/rewards')}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            See All Rewards <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function ShowcaseCard({ reward, onClick, onSignup }: { reward: ShowcaseReward; onClick: () => void; onSignup: (e: React.MouseEvent) => void }) {
  const Icon = categoryIcons[reward.category] || Gift;
  
  return (
    <Card
      className="group cursor-pointer overflow-hidden border-border/60 hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 rounded-xl shadow-md"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] w-full min-h-[200px] overflow-hidden">
        {reward.image_url ? (
          <ImageWithFallback
            src={reward.image_url}
            alt={reward.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Icon className="w-14 h-14 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        
        {reward.cost === 0 && (
          <Badge className="absolute top-3 left-3 bg-emerald-500 text-white border-0 shadow-lg text-xs">
            FREE
          </Badge>
        )}
        
        <div className="absolute left-0 right-0 bottom-0 p-3">
          <h3 className="font-bold text-sm sm:text-base text-white leading-tight line-clamp-2 drop-shadow-lg">
            {reward.title}
          </h3>
        </div>
      </div>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          {reward.cost > 0 ? (
            <div className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-primary" />
              <span className="font-bold text-sm">{reward.cost}</span>
              <span className="text-xs text-muted-foreground">claims</span>
            </div>
          ) : (
            <span className="text-xs font-semibold text-emerald-600">Free to claim</span>
          )}
        </div>
        <Button
          size="sm"
          className="w-full text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          onClick={onSignup}
        >
          Sign Up to Claim
        </Button>
      </CardContent>
    </Card>
  );
}
