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
import { useAmbitions } from '@/contexts/AmbitionsContext';
import { toast } from 'sonner';
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
  show_powered_by?: boolean | null;
  powered_by_name?: string | null;
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
  const { toggleAmbition, isAmbition } = useAmbitions();
  const isWanted = isAmbition(reward.id);
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
            className="w-full h-full object-cover object-center transition-transform duration-400 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#E0DFDB' }}>
            <Icon className="w-16 h-16" style={{ color: '#8A8A88' }} />
          </div>
        )}

        {/* Bottom gradient overlay — heavy for text legibility */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0.98) 100%)',
          }}
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

        {/* BOTTOM of image: Powered By + Title only */}
        <div className="absolute left-0 right-0 bottom-0 p-4 z-10">
          {reward.show_powered_by && reward.powered_by_name && (
            <div className="flex items-center gap-1.5 mb-1">
              <span style={{ fontFamily: dmSans, fontSize: '12px', color: '#E2FF6D' }}>
                Powered by {reward.powered_by_name}
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
                <span style={{ fontFamily: dmMono, fontSize: '14px', color: '#131313', fontWeight: 500 }}>FREE</span>
              ) : (
                <>
                  <span style={{ fontFamily: dmMono, fontSize: '18px', color: '#131313', fontWeight: 400 }}>
                    {calculateClaimsForUser(pricing.price, userTier.tierName)}
                  </span>
                  <span style={{ fontFamily: dmMono, fontSize: '12px', color: '#6B6B68' }}>claims</span>
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
        style={{ backgroundColor: '#F5F4F0', borderTop: '1px solid #E0DFDB' }}
      >
        <span style={{ fontFamily: dmMono, fontSize: '11px', color: '#6B6B68' }}>
          {reward.stock_quantity !== null ? `${reward.stock_quantity} remaining` : 'Unlimited'}
        </span>
      </div>

      {/* CTA BUTTONS */}
      {isTierLocked ? (
        <div className="px-3.5 pb-3.5 pt-2 flex flex-col sm:flex-row gap-2" style={{ backgroundColor: '#FFFFFF' }}>
          <button
            className="flex-1"
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
          <WantThisButton
            rewardId={reward.id}
            rewardName={reward.title}
            claimable={false}
            tierRequired={effectiveMinTier || 'Bronze'}
            distance={requiredTier ? `${requiredTier} required` : undefined}
            isWanted={isWanted}
            onToggle={toggleAmbition}
          />
        </div>
      ) : (
        <div className="px-3.5 pb-3.5 pt-2 flex flex-col sm:flex-row gap-2" style={{ backgroundColor: '#FFFFFF' }}>
          <button
            className="flex-1"
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
          <WantThisButton
            rewardId={reward.id}
            rewardName={reward.title}
            claimable={true}
            tierRequired={effectiveMinTier || 'Bronze'}
            isWanted={isWanted}
            onToggle={toggleAmbition}
          />
        </div>
      )}
    </div>
  );
}

// ─── Want This Button ───────────────────────────────────────────────────────
function WantThisButton({
  rewardId,
  rewardName,
  claimable,
  tierRequired,
  distance,
  isWanted,
  onToggle,
}: {
  rewardId: string;
  rewardName: string;
  claimable: boolean;
  tierRequired: string;
  distance?: string;
  isWanted: boolean;
  onToggle: (ambition: { rewardId: string; rewardName: string; claimable: boolean; tierRequired: string; distance?: string }) => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle({ rewardId, rewardName, claimable, tierRequired, distance });
  };

  return (
    <button
      onClick={handleClick}
      style={{
        padding: '11px 12px',
        background: isWanted ? 'transparent' : 'transparent',
        border: isWanted ? '1px solid #E2FF6D' : '1px solid #E0DFDB',
        color: isWanted ? '#E2FF6D' : '#6B6B68',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '12px',
        textTransform: 'uppercase' as const,
        borderRadius: '0px',
        cursor: 'pointer',
        transition: 'all 200ms',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        if (!isWanted) {
          e.currentTarget.style.borderColor = '#131313';
          e.currentTarget.style.color = '#131313';
        }
      }}
      onMouseLeave={(e) => {
        if (!isWanted) {
          e.currentTarget.style.borderColor = '#E0DFDB';
          e.currentTarget.style.color = '#6B6B68';
        }
      }}
    >
      {isWanted ? 'Ambition ✓' : 'Want This'}
    </button>
  );
}
