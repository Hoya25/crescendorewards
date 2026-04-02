import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { 
  Gift, Sparkles, ShoppingBag, CreditCard, Coins,
  Heart, Trophy, Zap, Music, Ticket, Package, Pencil, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getRewardPriceForUser, 
  canUserClaimReward,
  getTierDisplayName,
  type Reward 
} from '@/utils/getRewardPrice';
import { calculateClaimsForUser, getClaimDiscountUpsell } from '@/utils/calculateClaimsForUser';
import { useAuthContext } from '@/contexts/AuthContext';
import { CreatorShowcase, CreatorHandles } from '@/components/creators/CreatorShowcase';
import { useRewardCreators } from '@/hooks/useFeaturedCreators';

export interface VisualRewardCardData {
  id: string;
  title: string;
  description: string;
  category: string;
  cost: number;
  image_url: string | null;
  stock_quantity: number | null;
  is_active: boolean;
  is_featured: boolean;
  is_sponsored?: boolean;
  sponsor_name?: string | null;
  sponsor_logo_url?: string | null;
  sponsor_logo?: string | null;
  min_status_tier?: string | null;
  min_tier_required?: string | null;
  reward_tier?: string | null;
  status_tier_claims_cost?: Record<string, number> | null;
  campaign_id?: string | null;
  sponsor_enabled?: boolean;
  sponsor_link?: string | null;
  showcase_mode?: string | null;
}

interface UserTierInfo {
  tierName: string;
  tierLevel: number;
}

interface VisualRewardCardProps {
  reward: VisualRewardCardData;
  isInFavorites: boolean;
  onToggleFavorites: (rewardId: string, e: React.MouseEvent) => void;
  onClick: () => void;
  isAnimatingHeart?: boolean;
  claimBalance?: number;
  userTier?: UserTierInfo;
  claimCount?: number;
  isAdmin?: boolean;
  onAdminEdit?: (rewardId: string) => void;
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
  community: Gift,
};

const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

// Kinetic Archive tier badge colors
const tierBadgeStyles: Record<string, { bg: string; text: string }> = {
  bronze:   { bg: '#8B6914', text: '#FFFFFF' },
  silver:   { bg: '#3A3A3A', text: '#FFFFFF' },
  gold:     { bg: '#C4991A', text: '#131313' },
  platinum: { bg: '#2A2A4A', text: '#FFFFFF' },
  diamond:  { bg: '#0A2A3A', text: '#E2FF6D' },
};

const barlow = "'Barlow Condensed', sans-serif";
const dmSans = "'DM Sans', sans-serif";
const dmMono = "'DM Mono', monospace";

function isUserTierEligible(
  minTier: string | null | undefined,
  userTierName: string
): boolean {
  if (!minTier) return true;
  const minTierIndex = tierOrder.indexOf(minTier.toLowerCase());
  const userTierIndex = tierOrder.indexOf(userTierName.toLowerCase());
  if (minTierIndex === -1 || userTierIndex === -1) return true;
  return userTierIndex >= minTierIndex;
}

export function VisualRewardCard({
  reward,
  isInFavorites,
  onToggleFavorites,
  onClick,
  isAnimatingHeart = false,
  claimBalance = 0,
  userTier = { tierName: 'Bronze', tierLevel: 1 },
  claimCount = 0,
  isAdmin = false,
  onAdminEdit,
}: VisualRewardCardProps) {
  const navigate = useNavigate();
  const { isAuthenticated, setShowAuthModal, setAuthMode } = useAuthContext();
  const Icon = categoryIcons[reward.category] || Gift;
  
  const showcaseMode = reward.showcase_mode || 'default';
  const { creators: rewardCreators } = useRewardCreators(
    showcaseMode !== 'default' ? reward.id : undefined
  );
  const hasCreatorShowcase = showcaseMode !== 'default' && rewardCreators.length > 0;
  
  const isSponsored = reward.is_sponsored || reward.sponsor_enabled;
  const sponsorName = reward.sponsor_name;
  const sponsorLogo = reward.sponsor_logo_url || reward.sponsor_logo;
  
  const effectiveMinTier = reward.min_tier_required || reward.min_status_tier;
  const isEligible = isUserTierEligible(effectiveMinTier, userTier.tierName);
  const isTierLocked = isAuthenticated && !isEligible && !!effectiveMinTier;
  const remainingStock = reward.stock_quantity;
  
  const rewardForPricing: Reward = {
    id: reward.id,
    cost: reward.cost,
    is_sponsored: reward.is_sponsored,
    status_tier_claims_cost: reward.status_tier_claims_cost,
    min_status_tier: effectiveMinTier,
    stock_quantity: reward.stock_quantity,
    is_active: reward.is_active,
  };

  const pricing = getRewardPriceForUser(rewardForPricing, userTier.tierName);
  const canClaim = isAuthenticated && isEligible && claimBalance >= pricing.price && pricing.price >= 0;
  const requiredTier = effectiveMinTier ? getTierDisplayName(effectiveMinTier) : null;
  const tierKey = effectiveMinTier?.toLowerCase() || '';
  const tierStyle = tierBadgeStyles[tierKey] || tierBadgeStyles.bronze;

  const handleCtaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setAuthMode('signin');
      setShowAuthModal(true);
      return;
    }
    if (isTierLocked) {
      navigate(`/crescendo?unlock=${encodeURIComponent(requiredTier || '')}`);
      return;
    }
    onClick();
  };

  const handleCardClick = () => {
    if (isTierLocked) {
      navigate(`/crescendo?unlock=${encodeURIComponent(requiredTier || '')}`);
      return;
    }
    onClick();
  };

  return (
    <div
      className={cn(
        "group cursor-pointer overflow-hidden transition-all duration-200",
        isTierLocked && "opacity-50",
      )}
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E0DFDB',
        borderRadius: '0px',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      onClick={handleCardClick}
    >
      {/* HERO IMAGE */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
        {hasCreatorShowcase && (showcaseMode === 'single' || showcaseMode === 'carousel') ? (
          <CreatorShowcase
            creators={rewardCreators}
            mode={showcaseMode as 'single' | 'carousel'}
            className="w-full h-full"
          />
        ) : reward.image_url ? (
          <ImageWithFallback
            src={reward.image_url}
            alt={reward.title}
            className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#393939' }}>
            <Icon className="w-16 h-16" style={{ color: '#5A5A58' }} />
          </div>
        )}

        {/* Bottom 40% gradient overlay */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{ height: '40%', background: 'linear-gradient(transparent, #131313)' }}
        />

        {/* TOP-LEFT: Tier badge */}
        {effectiveMinTier && (
          <div
            className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1"
            style={{
              backgroundColor: 'rgba(226,255,109,0.12)',
              color: '#131313',
              border: '1px solid rgba(226,255,109,0.3)',
              fontFamily: dmMono,
              fontSize: '10px',
              fontWeight: 400,
              borderRadius: '0px',
              textTransform: 'uppercase' as const,
            }}
          >
            {!isEligible && <Lock className="w-3 h-3" />}
            <span>{getTierDisplayName(effectiveMinTier)}+{!isEligible ? ' required' : ''}</span>
          </div>
        )}

        {/* TOP-RIGHT: Favorites Heart */}
        <button
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(31,32,32,0.85)',
            borderRadius: '0px',
            backdropFilter: 'blur(8px)',
            transition: 'transform 300ms cubic-bezier(0.4,0,0.2,1)',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorites(reward.id, e);
          }}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-all duration-200",
              isInFavorites ? "fill-red-500 text-red-500" : "text-white/60",
              isAnimatingHeart && "animate-[heartBounce_0.3s_ease-in-out]"
            )}
          />
        </button>

        {/* Admin Edit */}
        {isAdmin && onAdminEdit && (
          <button
            className="absolute top-3 right-14 z-10 w-8 h-8 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(200,160,0,0.9)', borderRadius: '0px' }}
            onClick={(e) => { e.stopPropagation(); onAdminEdit(reward.id); }}
          >
            <Pencil className="h-3.5 w-3.5 text-white" />
          </button>
        )}

        {/* BOTTOM of image: Title + Sponsor */}
        <div className="absolute left-0 right-0 bottom-0 p-4 z-10">
          {isSponsored && sponsorName && (
            <div className="flex items-center gap-1.5 mb-1">
              {sponsorLogo && (
                <img
                  src={sponsorLogo}
                  alt={sponsorName}
                  className="h-3.5 w-auto max-w-[36px] object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <span style={{ fontFamily: dmSans, fontSize: '12px', color: '#E2FF6D' }}>
                {sponsorName}
              </span>
            </div>
          )}
          <h3
            className="line-clamp-2"
            style={{
              fontFamily: barlow,
              fontWeight: 700,
              fontSize: '18px',
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            {reward.title}
          </h3>
        </div>
      </div>

      {/* CONTENT: Creator + Price */}
      <div className="p-3.5 space-y-2.5" style={{ backgroundColor: '#FFFFFF' }}>
        {hasCreatorShowcase && showcaseMode === 'collage' && (
          <CreatorShowcase creators={rewardCreators} mode="collage" size="sm" />
        )}
        {rewardCreators.length > 0 && showcaseMode !== 'default' && (
          <CreatorHandles creators={rewardCreators} max={2} />
        )}

        {/* Price row */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              {pricing.isFree ? (
                <span style={{ fontFamily: dmMono, fontSize: '14px', color: '#E2FF6D', fontWeight: 400 }}>FREE</span>
              ) : (
                <>
                  <span style={{ fontFamily: dmMono, fontSize: '18px', color: '#FFFFFF', fontWeight: 400 }}>
                    {calculateClaimsForUser(pricing.price, userTier.tierName)}
                  </span>
                  <span style={{ fontFamily: dmMono, fontSize: '12px', color: '#5A5A58' }}>claims</span>
                </>
              )}
            </div>
            {remainingStock !== null && remainingStock > 0 && (
              <span style={{ fontFamily: dmMono, fontSize: '11px', color: '#6B6B68' }}>
                · {remainingStock} left
              </span>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM BAR: recessed */}
      <div
        className="flex items-center justify-between px-3.5 py-2"
        style={{ backgroundColor: '#0E0E0E' }}
      >
        <span style={{ fontFamily: dmMono, fontSize: '11px', color: '#5A5A58' }}>
          {reward.stock_quantity !== null ? `${reward.stock_quantity} remaining` : 'Unlimited'}
        </span>
      </div>

      {/* CTA BUTTON */}
      {isTierLocked ? (
        <div className="px-3.5 pb-3.5 pt-2" style={{ backgroundColor: '#1F2020' }}>
          <button
            className="w-full"
            style={{
              fontFamily: dmMono,
              fontSize: '12px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              backgroundColor: 'transparent',
              color: '#6B6B68',
              border: '1px solid #D4D3CF',
              borderRadius: '0px',
              height: '44px',
              cursor: 'pointer',
            }}
            onClick={handleCtaClick}
          >
            Unlocks at {requiredTier}
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: '#1F2020' }}>
          <button
            className="w-full"
            style={{
              fontFamily: dmMono,
              fontSize: '12px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              backgroundColor: '#131313',
              color: '#F5F4F0',
              border: 'none',
              borderRadius: '0px',
              height: '48px',
              cursor: 'pointer',
              transition: 'opacity 200ms ease',
            }}
            onClick={handleCtaClick}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {!isAuthenticated ? 'SIGN IN TO CLAIM' : 'CLAIM NOW'}
          </button>
        </div>
      )}
    </div>
  );
}
