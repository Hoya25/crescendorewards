import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ShoppingBag, Star, Package, Zap, CheckCircle2, AlertTriangle, Coins, CreditCard, Sparkles, Gift, Clock, Lock, Share2, Twitter, Facebook, Linkedin, Link2, Check, Heart, Trophy, Store, ExternalLink, AlertCircle, Pencil, Bell, Eye, Percent } from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { BuyClaims } from '@/components/BuyClaims';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { DataErrorState } from '@/components/DataErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { useWatchlist } from '@/hooks/useWatchlist';
import { getRewardPriceForUser, canUserClaimReward, type Reward as RewardType, type TierPricing } from '@/utils/getRewardPrice';

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
  token_gated?: boolean;
  token_name?: string | null;
  token_symbol?: string | null;
  minimum_token_balance?: number;
  token_contract_address?: string | null;
  brand_id?: string | null;
  // Tier pricing fields
  is_sponsored?: boolean | null;
  status_tier_claims_cost?: Record<string, number> | null;
  min_status_tier?: string | null;
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
  if (!tier) return 'droplet';
  return tier.tier_name?.toLowerCase() || 'droplet';
};

export function RewardDetailPage({ onClaimSuccess }: RewardDetailPageProps) {
  const navigate = useNavigate();
  const { id: rewardId } = useParams<{ id: string }>();
  const { setShowAuthModal, setAuthMode } = useAuthContext();
  const { profile, tier, refreshUnifiedProfile } = useUnifiedUser();
  const { isAdmin } = useAdminRole();
  const { isWatching, toggleWatch, isAnimating: isWatchAnimating, getWatchCount, fetchWatchCounts } = useWatchlist();
  const [reward, setReward] = useState<Reward | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showBuyClaimsModal, setShowBuyClaimsModal] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    email: profile?.email || '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    notes: '',
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
      // Fetch watch count for this reward
      fetchWatchCounts([rewardId]);
    }
  }, [rewardId, profile, fetchWatchCounts]);

  useEffect(() => {
    if (reward && crescendoData.referral_code) {
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/rewards/${reward.id}?ref=${crescendoData.referral_code}`);
    }
  }, [reward, crescendoData.referral_code]);

  const fetchReward = async (isRetry = false) => {
    if (!rewardId) return;
    
    if (isRetry) {
      setRetrying(true);
    }
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('rewards')
        .select('*')
        .eq('id', rewardId)
        .single();

      if (fetchError) throw fetchError;
      // Cast the data to our Reward type (status_tier_claims_cost comes as Json from Supabase)
      setReward(data as unknown as Reward);

      // Fetch brand if reward has brand_id
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

  const handleRetry = () => {
    fetchReward(true);
  };

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
        toast({
          title: 'Removed from wishlist',
          description: 'Reward removed from your wishlist',
        });
      } else {
        const { error } = await supabase
          .from('reward_wishlists')
          .insert({
            user_id: profile.id,
            reward_id: rewardId,
          });
        
        if (error) throw error;
        
        setIsOnWishlist(true);
        toast({
          title: 'Added to wishlist',
          description: 'Reward added to your wishlist',
        });
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to update wishlist',
        variant: 'destructive',
      });
    } finally {
      setAddingToWishlist(false);
    }
  };

  const handleClaim = async () => {
    if (!profile) {
      setAuthMode('signin');
      setShowAuthModal(true);
      return;
    }
    if (!reward) return;

    setClaiming(true);

    try {
      const { data, error } = await supabase.rpc('claim_reward', {
        p_reward_id: reward.id,
        p_shipping_info: shippingInfo,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Claim failed');
      }

      toast({
        title: 'Reward Claimed!',
        description: `You've successfully claimed ${reward.title}`,
      });

      setShowClaimModal(false);
      onClaimSuccess?.();
      refreshUnifiedProfile();
      fetchReward();
    } catch (error: any) {
      console.error('Error claiming reward:', error);
      toast({
        title: 'Claim Failed',
        description: error.message || 'Failed to claim reward',
        variant: 'destructive',
      });
    } finally {
      setClaiming(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Share link copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy link to clipboard',
        variant: 'destructive',
      });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/rewards')}
            className="mb-6"
          >
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
  
  // Calculate tier-based pricing
  const tierPricing = reward ? getRewardPriceForUser(
    { id: reward.id, cost: reward.cost, is_sponsored: reward.is_sponsored, status_tier_claims_cost: reward.status_tier_claims_cost },
    userTier
  ) : { price: reward?.cost || 0, isFree: false, discount: 0, originalPrice: reward?.cost || 0 };
  
  const canAfford = profile && crescendoData.claim_balance >= tierPricing.price;
  const inStock = reward.stock_quantity === null || reward.stock_quantity > 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/rewards')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Rewards
          </Button>
          
          {isAdmin && rewardId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin?tab=rewards&edit=${rewardId}`)}
              className="gap-2 bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700"
            >
              <Pencil className="w-4 h-4" />
              Quick Edit
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="aspect-square rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
            <ImageWithFallback
              src={reward.image_url || '/placeholder.svg'}
              alt={reward.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="gap-1">
                  <CategoryIcon className="w-3 h-3" />
                  {categoryLabels[reward.category]}
                </Badge>
                {reward.is_featured && (
                  <Badge className="bg-amber-100 text-amber-700">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2">{reward.title}</h1>
              {brand && (
                <p className="text-sm text-muted-foreground mb-2">From {brand.name}</p>
              )}
              <p className="text-muted-foreground">{reward.description}</p>
            </div>

            {/* Brand Info Card */}
            {brand && (
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {brand.image_url ? (
                      <img 
                        src={brand.image_url} 
                        alt={brand.name} 
                        className="w-12 h-12 rounded-lg object-contain bg-background p-1"
                      />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: brand.logo_color }}
                      >
                        {brand.logo_emoji}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{brand.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Tier-based pricing display */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cost</span>
                  <div className="text-right">
                    {tierPricing.discount > 0 ? (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm line-through text-muted-foreground">
                            {tierPricing.originalPrice} Claims
                          </span>
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            <Percent className="w-3 h-3 mr-1" />
                            {tierPricing.discount}% Off
                          </Badge>
                        </div>
                        <span className="text-2xl font-bold flex items-center gap-2">
                          <Zap className="w-5 h-5 text-emerald-500" />
                          {tierPricing.isFree ? 'FREE' : `${tierPricing.price} Claims`}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {userTier} Status Price
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        {reward.cost} Claims
                      </span>
                    )}
                  </div>
                </div>

                {reward.stock_quantity !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Stock</span>
                    <Badge variant={inStock ? 'secondary' : 'destructive'}>
                      {inStock ? `${reward.stock_quantity} left` : 'Out of Stock'}
                    </Badge>
                  </div>
                )}

                {/* Watching count for out-of-stock items */}
                {!inStock && rewardId && getWatchCount(rewardId) > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                    <Eye className="w-4 h-4" />
                    <span>{getWatchCount(rewardId)} {getWatchCount(rewardId) === 1 ? 'person' : 'people'} watching</span>
                  </div>
                )}

                {profile && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Your Balance</span>
                    <span className={`font-bold ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
                      {crescendoData.claim_balance} Claims
                    </span>
                  </div>
                )}

                {!canAfford && profile && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        You need {tierPricing.price - crescendoData.claim_balance} more claims
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3">
              {!profile ? (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    setAuthMode('signin');
                    setShowAuthModal(true);
                  }}
                >
                  Sign in to Claim
                </Button>
              ) : canAfford && inStock ? (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => setShowClaimModal(true)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Claim Now
                </Button>
              ) : !inStock ? (
                <Button 
                  size="lg" 
                  className={`w-full transition-all ${isWatchAnimating(rewardId || '') ? 'scale-95' : ''}`}
                  variant={isWatching(rewardId || '') ? "secondary" : "outline"}
                  onClick={() => rewardId && toggleWatch(rewardId)}
                >
                  {isWatching(rewardId || '') ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-green-500" />
                      Watching
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 mr-2" />
                      Notify Me When Available
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => setShowBuyClaimsModal(true)}
                >
                  Get More Claims
                </Button>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={toggleWishlist}
                  disabled={addingToWishlist}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isOnWishlist ? 'fill-current text-red-500' : ''}`} />
                  {isOnWishlist ? 'On Wishlist' : 'Add to Wishlist'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/wishlist')}
                >
                  View Wishlist
                </Button>
              </div>
            </div>

            {/* Share Section */}
            {profile && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    <span className="font-medium">Share & Earn</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Share this reward and earn 5 claims for each person who claims it!
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare('twitter')}
                    >
                      <Twitter className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare('facebook')}
                    >
                      <Facebook className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare('linkedin')}
                    >
                      <Linkedin className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="flex-1"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Link2 className="w-4 h-4 mr-2" />
                      )}
                      {copied ? 'Copied!' : 'Copy Link'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Claim Modal */}
        <Dialog open={showClaimModal} onOpenChange={setShowClaimModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Claim {reward.title}</DialogTitle>
              <DialogDescription>
                Please provide your shipping information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={shippingInfo.name}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={shippingInfo.email}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={shippingInfo.address}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                  placeholder="123 Main St, Apt 4"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={shippingInfo.city}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={shippingInfo.state}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  <Input
                    value={shippingInfo.zip}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, zip: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={shippingInfo.country}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={shippingInfo.notes}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, notes: e.target.value })}
                  placeholder="Any special instructions..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowClaimModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowConfirmClaim(true)} disabled={claiming}>
                Continue to Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Claim Dialog */}
        <ConfirmationDialog
          isOpen={showConfirmClaim}
          onClose={() => setShowConfirmClaim(false)}
          onConfirm={() => {
            setShowConfirmClaim(false);
            handleClaim();
          }}
          title="Confirm Claim"
          description={`This will use ${reward?.cost || 0} Claims from your balance. Your new balance will be ${crescendoData.claim_balance - (reward?.cost || 0)} Claims. This action cannot be undone.`}
          confirmText="Confirm Claim"
          cancelText="Go Back"
          icon={<AlertCircle className="w-5 h-5 text-primary" />}
          isLoading={claiming}
        />
        <Dialog open={showBuyClaimsModal} onOpenChange={setShowBuyClaimsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Get More Claims</DialogTitle>
              <DialogDescription>
                Purchase claims to redeem rewards
              </DialogDescription>
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
    </div>
  );
}
