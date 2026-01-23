import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, ShoppingBag, Star, Package, CheckCircle2, AlertTriangle, Coins, 
  CreditCard, Sparkles, Gift, Lock, Share2, Twitter, Facebook, Linkedin, 
  Link2, Check, Heart, Trophy, ExternalLink, AlertCircle, Pencil, Bell, 
  Eye, PartyPopper, Clock, Users, ChevronRight, ArrowUpCircle, Mail, Wallet, 
  User, MapPin
} from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { ClaimConfirmationDialog } from '@/components/ClaimConfirmationDialog';
import { ClaimDeliveryModal } from '@/components/rewards/ClaimDeliveryModal';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { ImageGalleryCarousel } from '@/components/rewards/ImageGalleryCarousel';
import { toast } from '@/hooks/use-toast';
import { BuyClaims } from '@/components/BuyClaims';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { DataErrorState } from '@/components/DataErrorState';
import { BetaTestingNotice } from '@/components/BetaTestingNotice';
import { Skeleton } from '@/components/ui/skeleton';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useDeliveryProfile } from '@/hooks/useDeliveryProfile';
import { getRewardPriceForUser, canUserClaimReward, getTierDisplayName, getAllTierPrices, type Reward as RewardType } from '@/utils/getRewardPrice';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import type { DeliveryMethod, RequiredDataField } from '@/types/delivery';
import { DELIVERY_METHOD_REQUIRED_FIELDS } from '@/types/delivery';

interface Reward {
  id: string;
  title: string;
  description: string;
  category: string;
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
  token_contract_address?: string | null;
  brand_id?: string | null;
  // Sponsorship fields
  is_sponsored?: boolean | null;
  sponsor_enabled?: boolean;
  sponsor_name?: string | null;
  sponsor_logo?: string | null;
  sponsor_logo_url?: string | null;
  sponsor_link?: string | null;
  status_tier_claims_cost?: Record<string, number> | null;
  min_status_tier?: string | null;
  // Delivery fields
  delivery_method?: DeliveryMethod | null;
  required_user_data?: RequiredDataField[] | null;
  delivery_instructions?: string | null;
}

interface Brand {
  id: string;
  name: string;
  image_url: string | null;
  logo_emoji: string;
  logo_color: string;
}

interface RewardDetailPageProps {
  onClaimSuccess?: () => void;
}

const categoryIcons: Record<string, any> = {
  alliance_tokens: Coins,
  experiences: Sparkles,
  merch: ShoppingBag,
  gift_cards: CreditCard,
  wellness: Heart,
  subscriptions: Trophy,
};

const categoryLabels: Record<string, string> = {
  alliance_tokens: 'Alliance Tokens',
  experiences: 'Experiences',
  merch: 'Merch',
  gift_cards: 'Gift Cards',
  wellness: 'Wellness & Health',
  subscriptions: 'Subscriptions',
};

const tierEmojis: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  diamond: '👑',
};

// Helper to extract Crescendo data from unified profile
const getCrescendoData = (profile: any) => {
  const crescendoData = profile?.crescendo_data || {};
  return {
    claim_balance: crescendoData.claims_balance || crescendoData.claim_balance || 0,
    referral_code: crescendoData.referral_code || null,
  };
};

// Helper to get user tier from unified profile
const getUserTier = (tier: any): string => {
  if (!tier) return 'bronze';
  return tier.tier_name?.toLowerCase() || 'bronze';
};

export function RewardDetailPage({ onClaimSuccess }: RewardDetailPageProps) {
  const navigate = useNavigate();
  const { id: rewardId } = useParams<{ id: string }>();
  const { setShowAuthModal, setAuthMode } = useAuthContext();
  const { profile, tier, refreshUnifiedProfile } = useUnifiedUser();
  const { isAdmin } = useAdminRole();
  const { isWatching, toggleWatch, isAnimating: isWatchAnimating, getWatchCount, fetchWatchCounts } = useWatchlist();
  const { checkRequiredFields, profile: deliveryProfile } = useDeliveryProfile();
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme || theme;
  const [reward, setReward] = useState<Reward | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showBuyClaimsModal, setShowBuyClaimsModal] = useState(false);
  const [deliveryData, setDeliveryData] = useState<Record<string, string>>({});
  const [showClaimSuccess, setShowClaimSuccess] = useState(false);
  const [claimCode, setClaimCode] = useState<string | null>(null);
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    email: profile?.email || '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    notes: '',
    // Digital asset fields
    walletAddress: '',
    walletType: 'base', // 'base', 'ethereum', 'solana', 'polygon', 'other'
  });
  const [isOnWishlist, setIsOnWishlist] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showConfirmClaim, setShowConfirmClaim] = useState(false);
  
  // Extract crescendo data
  const crescendoData = getCrescendoData(profile);

  useEffect(() => {
    if (rewardId) {
      fetchReward();
      if (profile) {
        checkWishlistStatus();
      }
      fetchWatchCounts([rewardId]);
    }
  }, [rewardId, profile, fetchWatchCounts]);

  useEffect(() => {
    if (reward && crescendoData.referral_code) {
      // Import and use production domain for consistent referral attribution
      import('@/lib/referral-links').then(({ generateRewardShareLink }) => {
        setShareUrl(generateRewardShareLink(reward.id, crescendoData.referral_code));
      });
    }
  }, [reward, crescendoData.referral_code]);

  const fetchReward = async (isRetry = false) => {
    if (!rewardId) return;
    
    if (isRetry) setRetrying(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('rewards')
        .select('*')
        .eq('id', rewardId)
        .single();

      if (fetchError) throw fetchError;
      setReward(data as unknown as Reward);

      if (data?.brand_id) {
        const { data: brandData } = await supabase
          .from('brands')
          .select('id, name, image_url, logo_emoji, logo_color')
          .eq('id', data.brand_id)
          .single();
        setBrand(brandData);
      } else {
        setBrand(null);
      }
    } catch (err) {
      console.error('Error fetching reward:', err);
      setError(err instanceof Error ? err : new Error('Failed to load reward'));
      if (!isRetry) {
        toast({
          title: 'Error',
          description: 'Failed to load reward details',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  const handleRetry = () => fetchReward(true);

  const checkWishlistStatus = async () => {
    if (!profile || !rewardId) return;
    try {
      const { data } = await supabase
        .from('reward_wishlists')
        .select('id')
        .eq('user_id', profile.id)
        .eq('reward_id', rewardId)
        .maybeSingle();
      setIsOnWishlist(!!data);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  const toggleWishlist = async () => {
    if (!profile) {
      setAuthMode('signin');
      setShowAuthModal(true);
      return;
    }
    if (!rewardId) return;
    
    setAddingToWishlist(true);
    try {
      if (isOnWishlist) {
        const { error } = await supabase
          .from('reward_wishlists')
          .delete()
          .eq('user_id', profile.id)
          .eq('reward_id', rewardId);
        if (error) throw error;
        setIsOnWishlist(false);
        toast({ title: 'Removed from wishlist' });
      } else {
        const { error } = await supabase
          .from('reward_wishlists')
          .insert({ user_id: profile.id, reward_id: rewardId });
        if (error) throw error;
        setIsOnWishlist(true);
        toast({ title: 'Added to wishlist' });
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast({ title: 'Error', description: 'Failed to update wishlist', variant: 'destructive' });
    } finally {
      setAddingToWishlist(false);
    }
  };

  // Get required fields for this reward based on delivery method or category fallback
  const getRequiredFields = (): RequiredDataField[] => {
    if (!reward) return ['email'];
    
    // Use configured required_user_data if available
    if (reward.required_user_data && reward.required_user_data.length > 0) {
      return reward.required_user_data;
    }
    
    // Use delivery method defaults if set
    if (reward.delivery_method) {
      return DELIVERY_METHOD_REQUIRED_FIELDS[reward.delivery_method] || ['email'];
    }
    
    // Fallback to category-based defaults
    switch (reward.category) {
      case 'merch':
      case 'experiences':
        return ['email', 'phone', 'shipping_address'];
      case 'crypto':
      case 'nft':
      case 'tokens':
        return ['email', 'wallet_address'];
      default:
        return ['email'];
    }
  };

  // Smart claim flow - check delivery data before confirming
  const initiateClaimFlow = () => {
    if (!profile || !reward) return;
    
    const requiredFields = getRequiredFields();
    const { complete, missing } = checkRequiredFields(requiredFields);
    
    if (complete) {
      // All required data available, go directly to confirmation
      setShowConfirmClaim(true);
    } else {
      // Missing data, show delivery modal to collect it
      setShowDeliveryModal(true);
    }
  };

  // Handle delivery data collection complete
  const handleDeliveryComplete = (data: Record<string, string>) => {
    setDeliveryData(data);
    setShowDeliveryModal(false);
    // Now show confirmation dialog
    setShowConfirmClaim(true);
  };

  const handleClaim = async () => {
    if (!profile || !reward) return;
    setClaiming(true);
    try {
      // Combine delivery data with any shipping info
      const claimData = {
        ...shippingInfo,
        ...deliveryData,
        delivery_method: reward.delivery_method || 'email',
      };
      
      const { data, error } = await supabase.rpc('claim_reward', {
        p_reward_id: reward.id,
        p_shipping_info: claimData,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; claim_code?: string };
      if (!result.success) throw new Error(result.error || 'Claim failed');
      
      // Store claim code if returned (for instant_code delivery)
      if (result.claim_code) {
        setClaimCode(result.claim_code);
      }
      
      // Show success state instead of just toast
      setShowConfirmClaim(false);
      setShowClaimSuccess(true);
      
      setShowClaimModal(false);
      setDeliveryData({});
      onClaimSuccess?.();
      refreshUnifiedProfile();
      fetchReward();
    } catch (error: any) {
      console.error('Error claiming reward:', error);
      toast({ title: 'Claim Failed', description: error.message || 'Failed to claim reward', variant: 'destructive' });
    } finally {
      setClaiming(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: 'Link copied!', description: 'Share link copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleShare = (platform: string) => {
    const text = `Check out this reward: ${reward?.title}`;
    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
    }
    window.open(url, '_blank', 'width=600,height=400');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="grid lg:grid-cols-[55%_45%] gap-8">
            <Skeleton className="aspect-[4/3] rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/rewards')} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Rewards
          </Button>
          <DataErrorState
            title="Failed to load reward"
            message="We couldn't load the reward details. Please try again."
            onRetry={handleRetry}
            retrying={retrying}
            variant="fullpage"
          />
        </div>
      </div>
    );
  }

  // Not found state
  if (!reward) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Reward Not Found</h2>
          <Button onClick={() => navigate('/rewards')}>Back to Rewards</Button>
        </div>
      </div>
    );
  }

  const CategoryIcon = categoryIcons[reward.category] || Gift;
  const userTier = getUserTier(tier);
  const userTierDisplay = getTierDisplayName(userTier);
  const userTierEmoji = tierEmojis[userTier] || '🥉';
  
  // Pricing calculations
  const rewardForPricing: RewardType = {
    id: reward.id,
    cost: reward.cost,
    is_sponsored: reward.is_sponsored,
    status_tier_claims_cost: reward.status_tier_claims_cost,
    min_status_tier: reward.min_status_tier,
    stock_quantity: reward.stock_quantity,
    is_active: reward.is_active,
  };
  
  const pricing = getRewardPriceForUser(rewardForPricing, userTier);
  const eligibility = canUserClaimReward(rewardForPricing, userTier, crescendoData.claim_balance);
  const allTierPrices = getAllTierPrices(rewardForPricing);
  
  const isSponsored = reward.is_sponsored || reward.sponsor_enabled;
  const sponsorName = reward.sponsor_name;
  
  // Get theme-aware sponsor logo
  const getThemedSponsorLogo = (): string | null => {
    const rawLogo = reward.sponsor_logo_url || reward.sponsor_logo;
    
    // Handle NCTR Alliance theme-aware logos (fallback if no logo is set)
    if (sponsorName?.toLowerCase().includes('nctr alliance')) {
      if (rawLogo?.includes('nctr-alliance')) {
        return currentTheme === 'dark' 
          ? '/brands/nctr-alliance-yellow.png' 
          : '/brands/nctr-alliance-grey.png';
      }
      // Default NCTR Alliance logo if none set
      if (!rawLogo) {
        return currentTheme === 'dark' 
          ? '/brands/nctr-alliance-yellow.png' 
          : '/brands/nctr-alliance-grey.png';
      }
    }
    
    return rawLogo || null;
  };
  
  const sponsorLogo = getThemedSponsorLogo();
  
  const inStock = reward.stock_quantity === null || reward.stock_quantity > 0;
  const canAfford = eligibility.canClaim;
  const isLocked = !eligibility.canClaim && eligibility.reason?.includes('Requires');
  
  // Compare price: show what Droplet tier pays as comparison
  const bronzePrice = allTierPrices.find(p => p.tier === 'bronze')?.price || reward.cost;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/rewards')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Rewards</span>
          </Button>
          
          <div className="flex items-center gap-2">
            {isAdmin && rewardId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin?tab=rewards&edit=${rewardId}`)}
                className="gap-2 bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20"
              >
                <Pencil className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Two Columns */}
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
        {/* Beta Testing Notice */}
        <BetaTestingNotice variant="rewards" className="mb-6" />
        
        <div className="grid lg:grid-cols-[55%_45%] gap-8 lg:gap-12">
          
          {/* LEFT COLUMN - Image Gallery */}
          <div className="space-y-4">
            {/* Image Gallery Carousel */}
            <ImageGalleryCarousel
              images={[reward.image_url || '/placeholder.svg']}
              title={reward.title}
            >
              {/* Sponsored Badge - Top Left - Now shows sponsor name */}
              {isSponsored && (
                <Badge className="absolute top-4 left-4 bg-gradient-to-r from-[#2a2d32] via-[#373b42] to-[#2a2d32] text-white border border-[#4a4f58]/50 font-medium shadow-lg px-3 py-1">
                  <Sparkles className="w-3 h-3 mr-1.5 text-amber-400" />
                  <span className="text-[11px]">Sponsored by </span>
                  <span className="text-amber-300 font-semibold ml-1">{sponsorName || 'Partner'}</span>
                </Badge>
              )}
              
              {/* Featured Badge */}
              {reward.is_featured && !isSponsored && (
                <Badge className="absolute top-4 left-4 bg-amber-100 text-amber-700">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
              
              {/* Sponsor Logo - Bottom Right - Gunmetal Style */}
              {isSponsored && sponsorLogo && (
                <div className="absolute bottom-4 right-4 bg-gradient-to-br from-[#2a2d32] via-[#373b42] to-[#2a2d32] backdrop-blur rounded-xl p-3 shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] border border-[#4a4f58]/50">
                  <img 
                    src={sponsorLogo} 
                    alt={sponsorName || 'Sponsor'} 
                    className="h-8 w-auto max-w-[100px] object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                  />
                </div>
              )}
            </ImageGalleryCarousel>

            {/* Sponsor Section - Elegant Gunmetal Design */}
            {isSponsored && sponsorName && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a2d32] via-[#373b42] to-[#2a2d32] border border-[#4a4f58]/50 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_30%_20%,white_1px,transparent_1px)] bg-[length:20px_20px]" />
                
                <div className="relative flex flex-col items-center text-center p-8">
                  {/* Logo Container with glow effect */}
                  {sponsorLogo && (
                    <div className="relative mb-5">
                      <div className="absolute inset-0 bg-amber-400/20 blur-xl rounded-full" />
                      <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-[#3a3f47] to-[#2a2d32] p-4 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] border border-[#4a4f58]/30">
                        <img 
                          src={sponsorLogo} 
                          alt={sponsorName} 
                          className="max-w-full max-h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" 
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Divider line */}
                  <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mb-4" />
                  
                  {/* Subordinate Text */}
                  <p className="text-[11px] text-amber-400/80 font-semibold uppercase tracking-[0.2em]">
                    Brought to you by
                  </p>
                  <p className="font-bold text-xl md:text-2xl mt-1.5 text-white">{sponsorName}</p>
                  
                  {reward.sponsor_link && (
                    <a 
                      href={reward.sponsor_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-amber-400 hover:text-amber-300 inline-flex items-center gap-1.5 mt-4 transition-colors"
                    >
                      Learn more <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Share Section - Desktop */}
            {profile && (
              <Card className="hidden lg:block">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Share & Earn
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Share this reward and earn 5 claims for each person who claims it!
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleShare('twitter')}>
                      <Twitter className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleShare('facebook')}>
                      <Facebook className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleShare('linkedin')}>
                      <Linkedin className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopyLink} className="flex-1">
                      {copied ? <Check className="w-4 h-4 mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
                      {copied ? 'Copied!' : 'Copy Link'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT COLUMN - Details */}
          <div className="space-y-6">
            {/* Title & Category */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="secondary" className="gap-1">
                  <CategoryIcon className="w-3 h-3" />
                  {categoryLabels[reward.category]}
                </Badge>
                {brand && (
                  <Badge variant="outline" className="gap-1">
                    <span>From {brand.name}</span>
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold leading-tight">{reward.title}</h1>
            </div>

            {/* STATUS-BASED PRICING BOX */}
            <Card className={cn(
              "overflow-hidden",
              pricing.isFree && "border-emerald-500/50 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20",
              isLocked && "border-muted bg-muted/30"
            )}>
              <CardContent className="p-5 space-y-4">
                {/* Status and Access Requirement */}
                <div className="grid grid-cols-2 gap-4">
                  {/* User Status */}
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{userTierEmoji}</span>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Your Status</p>
                      <p className="font-bold">{userTierDisplay}</p>
                    </div>
                  </div>
                  
                  {/* Access Requirement */}
                  <div className="flex items-center gap-2 justify-end">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Access Requirement</p>
                      <p className="font-bold flex items-center justify-end gap-1.5">
                        {!reward.min_status_tier || reward.min_status_tier === 'bronze' ? (
                          <>
                            <span className="text-emerald-500">🔓</span>
                            <span className="text-emerald-600 dark:text-emerald-400">All Members</span>
                          </>
                        ) : (
                          <>
                            <span>{tierEmojis[reward.min_status_tier.toLowerCase()] || '🎫'}</span>
                            <span>{reward.min_status_tier.charAt(0).toUpperCase() + reward.min_status_tier.slice(1)}+</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/membership')} className="text-primary gap-1 text-xs">
                    View Status Benefits <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>

                <Separator />

                {/* Price Display */}
                {isLocked ? (
                  <div className="text-center py-4">
                    <Lock className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-lg font-semibold text-muted-foreground">
                      Unlock at {getTierDisplayName(reward.min_status_tier || '')}
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-3 gap-2" 
                      onClick={() => navigate('/membership')}
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      Learn How to Level Up
                    </Button>
                  </div>
                ) : pricing.isFree ? (
                  <div className="text-center py-4">
                    <div className="flex items-center justify-center gap-3">
                      <PartyPopper className="w-8 h-8 text-emerald-500" />
                      <span className="text-5xl font-black text-emerald-500">FREE</span>
                      <PartyPopper className="w-8 h-8 text-emerald-500" />
                    </div>
                    {pricing.originalPrice > 0 && (
                      <p className="text-muted-foreground mt-2">
                        <span className="line-through">{pricing.originalPrice} claims</span>
                        <Badge variant="secondary" className="ml-2 bg-emerald-500/10 text-emerald-600">
                          100% OFF
                        </Badge>
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      Bronze members pay {bronzePrice} claims
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Coins className="w-8 h-8 text-primary" />
                      <span className="text-5xl font-bold text-primary">{pricing.price}</span>
                      <span className="text-xl text-muted-foreground">claims</span>
                    </div>
                    {pricing.discount > 0 && (
                      <p className="text-muted-foreground mt-2">
                        <span className="line-through">{pricing.originalPrice} claims</span>
                        <Badge variant="secondary" className="ml-2 bg-emerald-500/10 text-emerald-600">
                          Save {pricing.discount}%
                        </Badge>
                      </p>
                    )}
                    {bronzePrice > pricing.price && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Bronze members pay {bronzePrice} claims
                      </p>
                    )}
                  </div>
                )}

                {/* Balance Check */}
                {profile && !isLocked && !pricing.isFree && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Your Balance</span>
                      <span className={cn(
                        "font-bold text-lg",
                        canAfford ? "text-emerald-600" : "text-destructive"
                      )}>
                        {crescendoData.claim_balance} Claims
                      </span>
                    </div>
                    
                    {!canAfford && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span className="text-sm text-amber-700 dark:text-amber-400">
                          You need {pricing.price - crescendoData.claim_balance} more claims
                        </span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed">{reward.description}</p>
            </div>

            {/* CLAIM BUTTON */}
            <div className="space-y-3">
              {!profile ? (
                <Button
                  size="lg"
                  className="w-full h-14 text-lg"
                  onClick={() => {
                    setAuthMode('signin');
                    setShowAuthModal(true);
                  }}
                >
                  Sign in to Claim
                </Button>
              ) : isLocked ? (
                <Button
                  size="lg"
                  className="w-full h-14 text-lg gap-2"
                  variant="outline"
                  onClick={() => navigate('/membership')}
                >
                  <Lock className="w-5 h-5" />
                  Unlock at {getTierDisplayName(reward.min_status_tier || '')}
                </Button>
              ) : !inStock ? (
                <Button
                  size="lg"
                  className={cn(
                    "w-full h-14 text-lg gap-2",
                    isWatchAnimating(rewardId || '') && "scale-95"
                  )}
                  variant={isWatching(rewardId || '') ? "secondary" : "outline"}
                  onClick={() => rewardId && toggleWatch(rewardId)}
                >
                  {isWatching(rewardId || '') ? (
                    <>
                      <Check className="w-5 h-5 text-emerald-500" />
                      You'll be notified
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5" />
                      Notify Me When Available
                    </>
                  )}
                </Button>
              ) : canAfford ? (
                <Button
                  size="lg"
                  className="w-full h-14 text-lg gap-2 bg-gradient-to-r from-primary to-primary/80"
                  onClick={initiateClaimFlow}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {pricing.isFree ? 'Claim Now — FREE' : `Claim for ${pricing.price} Claims`}
                </Button>
              ) : (
                <div className="space-y-3">
                  {/* Insufficient balance warning */}
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <span className="font-semibold text-amber-800 dark:text-amber-300">
                        Need {pricing.price - crescendoData.claim_balance} more claims
                      </span>
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                      You have {crescendoData.claim_balance} claims, but this reward costs {pricing.price} claims.
                    </p>
                    <Button
                      size="lg"
                      className="w-full h-12 text-base gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-none"
                      onClick={() => navigate('/buy-claims')}
                    >
                      <Coins className="w-5 h-5" />
                      Get More Claims
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Secondary option: buy claims modal */}
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={() => setShowBuyClaimsModal(true)}
                  >
                    Quick purchase without leaving
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={toggleWishlist}
                  disabled={addingToWishlist}
                >
                  <Heart className={cn("w-4 h-4 mr-2", isOnWishlist && "fill-current text-red-500")} />
                  {isOnWishlist ? 'Saved' : 'Save'}
                </Button>
                <Button variant="outline" onClick={handleCopyLink}>
                  {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Details Accordion */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="stock">
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Availability
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-2">
                  {reward.stock_quantity !== null ? (
                    <div className="flex items-center justify-between">
                      <span>Quantity Remaining</span>
                      <Badge variant={inStock ? "secondary" : "destructive"}>
                        {inStock ? `${reward.stock_quantity} left` : 'Out of Stock'}
                      </Badge>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Unlimited availability</p>
                  )}
                  {!inStock && rewardId && getWatchCount(rewardId) > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      <span>{getWatchCount(rewardId)} people watching</span>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="pricing">
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Pricing by Status
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {allTierPrices.map(({ tier, price, displayName }) => (
                      <div 
                        key={tier} 
                        className={cn(
                          "flex items-center justify-between p-2 rounded",
                          tier === userTier && "bg-primary/10"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span>{tierEmojis[tier] || '🎫'}</span>
                          {displayName}
                          {tier === userTier && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </span>
                        <span className={cn("font-medium", price === 0 && "text-emerald-500")}>
                          {price === 0 ? 'FREE' : `${price} claims`}
                        </span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="terms">
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Terms & Conditions
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li>Reward claims are final and non-refundable</li>
                    <li>Shipping times may vary based on location</li>
                    <li>Digital rewards will be delivered via email</li>
                    <li>Subject to availability</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-4 z-40">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            {isLocked ? (
              <p className="text-muted-foreground flex items-center gap-1">
                <Lock className="w-4 h-4" />
                Locked
              </p>
            ) : pricing.isFree ? (
              <p className="text-2xl font-black text-emerald-500">FREE</p>
            ) : (
              <p className="text-2xl font-bold text-primary flex items-center gap-1">
                <Coins className="w-5 h-5" />
                {pricing.price}
              </p>
            )}
          </div>
          
          {!profile ? (
            <Button size="lg" onClick={() => { setAuthMode('signin'); setShowAuthModal(true); }}>
              Sign In
            </Button>
          ) : isLocked ? (
            <Button size="lg" variant="outline" onClick={() => navigate('/membership')}>
              Level Up
            </Button>
          ) : !inStock ? (
            <Button 
              size="lg" 
              variant={isWatching(rewardId || '') ? "secondary" : "outline"}
              onClick={() => rewardId && toggleWatch(rewardId)}
            >
              {isWatching(rewardId || '') ? 'Watching' : 'Notify Me'}
            </Button>
          ) : canAfford ? (
            <Button size="lg" onClick={() => setShowClaimModal(true)}>
              Claim Now
            </Button>
          ) : (
            <Button 
              size="lg" 
              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              onClick={() => navigate('/buy-claims')}
            >
              <Coins className="w-4 h-4" />
              Get {pricing.price - crescendoData.claim_balance} More Claims
            </Button>
          )}
        </div>
      </div>

      {/* Claim Modal - Category-Aware Form */}
      <Dialog open={showClaimModal} onOpenChange={setShowClaimModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Claim {reward.title}</DialogTitle>
            <DialogDescription>
              {reward.category === 'merch' || reward.category === 'experiences' 
                ? 'Please provide your shipping information'
                : reward.category === 'crypto' || reward.category === 'nft' || reward.category === 'tokens'
                ? 'Please provide your wallet address for delivery'
                : 'Please confirm your delivery details'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Always show email */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email Address
              </Label>
              <Input
                type="email"
                value={shippingInfo.email}
                onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                placeholder="your@email.com"
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">We'll send confirmation and delivery updates here</p>
            </div>

            {/* Digital Asset Fields - for crypto, nft, tokens categories */}
            {(reward.category === 'crypto' || reward.category === 'nft' || reward.category === 'tokens') && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-muted-foreground" />
                    Wallet Type
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'base', label: 'Base', icon: '🔵' },
                      { value: 'ethereum', label: 'Ethereum', icon: '⟠' },
                      { value: 'solana', label: 'Solana', icon: '◎' },
                    ].map((wallet) => (
                      <Button
                        key={wallet.value}
                        type="button"
                        variant={shippingInfo.walletType === wallet.value ? 'default' : 'outline'}
                        size="sm"
                        className="flex items-center gap-1.5"
                        onClick={() => setShippingInfo({ ...shippingInfo, walletType: wallet.value })}
                      >
                        <span>{wallet.icon}</span>
                        <span className="text-xs">{wallet.label}</span>
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'polygon', label: 'Polygon', icon: '⬡' },
                      { value: 'other', label: 'Other', icon: '🔗' },
                    ].map((wallet) => (
                      <Button
                        key={wallet.value}
                        type="button"
                        variant={shippingInfo.walletType === wallet.value ? 'default' : 'outline'}
                        size="sm"
                        className="flex items-center gap-1.5"
                        onClick={() => setShippingInfo({ ...shippingInfo, walletType: wallet.value })}
                      >
                        <span>{wallet.icon}</span>
                        <span className="text-xs">{wallet.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Wallet Address
                  </Label>
                  <Input
                    value={shippingInfo.walletAddress}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, walletAddress: e.target.value })}
                    placeholder={
                      shippingInfo.walletType === 'solana' 
                        ? 'Enter your Solana wallet address' 
                        : '0x...'
                    }
                    className="font-mono text-sm bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    {shippingInfo.walletType === 'base' && 'Enter your Base network compatible wallet address'}
                    {shippingInfo.walletType === 'ethereum' && 'Enter your Ethereum mainnet wallet address'}
                    {shippingInfo.walletType === 'solana' && 'Enter your Solana wallet address'}
                    {shippingInfo.walletType === 'polygon' && 'Enter your Polygon network wallet address'}
                    {shippingInfo.walletType === 'other' && 'Specify your wallet address and network in notes'}
                  </p>
                </div>

                {shippingInfo.walletType === 'other' && (
                  <div className="space-y-2">
                    <Label>Network / Protocol Notes</Label>
                    <Textarea
                      value={shippingInfo.notes}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, notes: e.target.value })}
                      placeholder="Specify the blockchain network or protocol..."
                      rows={2}
                    />
                  </div>
                )}
              </>
            )}

            {/* Physical Shipping Fields - for merch, experiences */}
            {(reward.category === 'merch' || reward.category === 'experiences') && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Full Name
                  </Label>
                  <Input
                    value={shippingInfo.name}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                    placeholder="Your full name"
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Street Address
                  </Label>
                  <Textarea
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                    placeholder="123 Main St, Apt 4"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={shippingInfo.city}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                      placeholder="Denver"
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State / Province</Label>
                    <Input
                      value={shippingInfo.state}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                      placeholder="CO"
                      className="bg-muted/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ZIP / Postal Code</Label>
                    <Input
                      value={shippingInfo.zip}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, zip: e.target.value })}
                      placeholder="80211"
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input
                      value={shippingInfo.country}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                      placeholder="United States"
                      className="bg-muted/50"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Digital (non-crypto) rewards - subscriptions, streaming, etc. */}
            {reward.category !== 'merch' && 
             reward.category !== 'experiences' && 
             reward.category !== 'crypto' && 
             reward.category !== 'nft' && 
             reward.category !== 'tokens' && (
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Gift className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Digital Delivery</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your reward code or access link will be sent to your email address after claiming.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowClaimModal(false)}>Cancel</Button>
            <Button onClick={() => setShowConfirmClaim(true)} disabled={claiming}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Claim Dialog - Status-aware with Success State */}
      <ClaimConfirmationDialog
        isOpen={showConfirmClaim || showClaimSuccess}
        onClose={() => {
          setShowConfirmClaim(false);
          setShowClaimSuccess(false);
          setClaimCode(null);
        }}
        onConfirm={() => {
          handleClaim();
        }}
        rewardTitle={reward?.title || ''}
        isLoading={claiming}
        userTierEmoji={tier?.badge_emoji || tierEmojis[userTier] || '💧'}
        userTierName={tier?.display_name || getTierDisplayName(userTier)}
        userTierColor={tier?.badge_color || 'hsl(var(--primary))'}
        userPrice={pricing.price}
        originalPrice={pricing.originalPrice}
        isFree={pricing.isFree}
        discount={pricing.discount}
        currentBalance={crescendoData.claim_balance}
        deliveryMethod={reward?.delivery_method}
        showSuccess={showClaimSuccess}
        claimCode={claimCode}
        onViewClaims={() => {
          setShowClaimSuccess(false);
          navigate('/status');
        }}
      />

      {/* Smart Delivery Data Collection Modal */}
      {reward && (
        <ClaimDeliveryModal
          open={showDeliveryModal}
          onClose={() => setShowDeliveryModal(false)}
          onComplete={handleDeliveryComplete}
          rewardTitle={reward.title}
          deliveryMethod={reward.delivery_method || 'email'}
          requiredFields={getRequiredFields()}
        />
      )}

      {/* Buy Claims Modal */}
      <Dialog open={showBuyClaimsModal} onOpenChange={setShowBuyClaimsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Get More Claims</DialogTitle>
            <DialogDescription>Purchase claims to redeem rewards</DialogDescription>
          </DialogHeader>
          <BuyClaims
            currentBalance={crescendoData.claim_balance}
            onPurchaseSuccess={() => {
              setShowBuyClaimsModal(false);
              refreshUnifiedProfile();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
