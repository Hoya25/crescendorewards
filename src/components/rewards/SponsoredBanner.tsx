import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Sparkles, ChevronRight, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { cn } from '@/lib/utils';

interface SponsoredBannerProps {
  sponsorName?: string;
  sponsorLogo?: string;
  rewardId?: string;
  rewardTitle?: string;
  minTier?: string;
  className?: string;
}

export function SponsoredBanner({
  sponsorName = 'NCTR Alliance',
  sponsorLogo,
  rewardId,
  rewardTitle = 'Exclusive Partner Reward',
  minTier = 'Spiral',
  className,
}: SponsoredBannerProps) {
  const navigate = useNavigate();
  const { tier } = useUnifiedUser();

  const userTierName = tier?.display_name || tier?.tier_name || 'Droplet';

  const handleClick = () => {
    if (rewardId) {
      navigate(`/rewards/${rewardId}`);
    } else {
      navigate('/rewards?sponsored=true');
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600",
        "dark:from-violet-700 dark:via-purple-700 dark:to-indigo-700",
        className
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                           radial-gradient(circle at 80% 50%, white 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Glow Effects */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl" />

      <div className="relative flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
        {/* Sponsor Logo / Icon */}
        <div className="flex-shrink-0">
          {sponsorLogo ? (
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white/10 backdrop-blur-sm rounded-2xl p-3 flex items-center justify-center">
              <img 
                src={sponsorLogo} 
                alt={sponsorName} 
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-amber-300" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <Badge className="bg-amber-400/90 text-black border-0 font-bold">
              <Sparkles className="w-3 h-3 mr-1" />
              SPONSORED
            </Badge>
            <Badge variant="outline" className="border-white/30 text-white">
              <Crown className="w-3 h-3 mr-1" />
              Exclusive for {minTier}+ Members
            </Badge>
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-white">
            {rewardTitle}
          </h3>

          <p className="text-white/80 text-sm md:text-base">
            {sponsorName ? `Brought to you by ${sponsorName}` : 'An exclusive opportunity from our partners'}
            {' — '}
            <span className="text-amber-300 font-medium">
              FREE or discounted based on your status level
            </span>
          </p>
        </div>

        {/* CTA */}
        <div className="flex-shrink-0">
          <Button
            size="lg"
            onClick={handleClick}
            className="bg-white text-violet-700 hover:bg-white/90 font-bold shadow-lg gap-2"
          >
            <Gift className="w-5 h-5" />
            Claim Your Reward
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* User Status Indicator */}
      <div className="relative border-t border-white/10 px-6 py-3 bg-black/10">
        <p className="text-center text-sm text-white/70">
          Your Status: <span className="font-bold text-white">{userTierName}</span>
          {' • '}
          <span className="text-amber-300">See your personalized pricing</span>
        </p>
      </div>
    </div>
  );
}
