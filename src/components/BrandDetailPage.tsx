import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, ExternalLink, Sparkles, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { getMembershipTierByNCTR } from '@/utils/membershipLevels';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { NCTRLogo } from '@/components/NCTRLogo';
import { RewardCard, RewardCardData } from '@/components/rewards/RewardCard';
import { DataErrorState } from '@/components/DataErrorState';
import { Skeleton } from '@/components/ui/skeleton';

interface EarnOpportunity {
  title: string;
  description: string;
  link: string;
}

interface Brand {
  id: string;
  name: string;
  description: string;
  category: string;
  base_earning_rate: number;
  logo_emoji: string;
  logo_color: string;
  earn_opportunities: EarnOpportunity[];
  image_url?: string | null;
}

const statusMultipliers: Record<number, number> = {
  0: 1.0,
  1: 1.1,
  2: 1.25,
  3: 1.4,
  4: 1.6,
  5: 2.0,
};

export function BrandDetailPage() {
  const { id: brandId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, tier } = useUnifiedUser();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [rewards, setRewards] = useState<RewardCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [animatingHeartId, setAnimatingHeartId] = useState<string | null>(null);

  const crescendoData = profile?.crescendo_data || {};
  const membershipTier = getMembershipTierByNCTR(crescendoData.locked_nctr || 0);
  const multiplier = membershipTier.multiplier;
  const claimBalance = crescendoData.claims_balance || 0;

  const calculateMultipliedRate = (baseRate: number) => {
    return (baseRate * multiplier).toFixed(2);
  };

  useEffect(() => {
    if (brandId) {
      loadBrandAndRewards();
      loadWishlist();
    }
  }, [brandId]);

  const loadBrandAndRewards = async (isRetry = false) => {
    try {
      if (isRetry) setRetrying(true);
      setLoading(true);
      setError(null);
      
      // Fetch brand and rewards in parallel
      const [brandResult, rewardsResult] = await Promise.all([
        supabase
          .from('brands')
          .select('*')
          .eq('id', brandId)
          .single(),
        supabase
          .from('rewards')
          .select('*')
          .eq('brand_id', brandId)
          .eq('is_active', true)
      ]);

      if (brandResult.error) throw brandResult.error;
      setBrand({ ...brandResult.data, earn_opportunities: (brandResult.data.earn_opportunities as any) || [] });
      
      if (rewardsResult.data) {
        // Cast to RewardCardData type to handle Json type from Supabase
        setRewards(rewardsResult.data.map(r => ({ ...r, brand_name: brandResult.data.name })) as unknown as RewardCardData[]);
      }
    } catch (err: any) {
      console.error('Error loading brand:', err);
      setError(err instanceof Error ? err : new Error('Failed to load brand'));
      if (!isRetry) {
        toast.error('Failed to load brand details');
      }
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  const handleRetry = () => loadBrandAndRewards(true);

  const loadWishlist = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('reward_wishlists')
      .select('reward_id')
      .eq('user_id', profile.id);
    if (data) {
      setWishlist(new Set(data.map(w => w.reward_id)));
    }
  };

  const handleToggleWishlist = async (rewardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile) {
      toast.error('Please sign in to add to wishlist');
      return;
    }

    setAnimatingHeartId(rewardId);
    setTimeout(() => setAnimatingHeartId(null), 300);

    if (wishlist.has(rewardId)) {
      await supabase.from('reward_wishlists').delete().eq('reward_id', rewardId).eq('user_id', profile.id);
      setWishlist(prev => { const n = new Set(prev); n.delete(rewardId); return n; });
      toast.success('Removed from wishlist');
    } else {
      await supabase.from('reward_wishlists').insert({ reward_id: rewardId, user_id: profile.id });
      setWishlist(prev => new Set(prev).add(rewardId));
      toast.success('Added to wishlist');
    }
  };

  const handleImageZoom = (imageUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(imageUrl, '_blank');
  };

  const handleOpenLink = (link: string, title: string) => {
    window.open(link, '_blank');
    toast.success(`Opening ${title}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/brands')} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Brands
          </Button>
          <DataErrorState
            title="Failed to load brand"
            message="We couldn't load the brand details. Please try again."
            onRetry={handleRetry}
            retrying={retrying}
            variant="fullpage"
          />
        </div>
      </div>
    );
  }

  if (!brandId || !brand) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Brand not found</p>
            <Button onClick={() => navigate('/brands')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Brands
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const opportunities = brand.earn_opportunities || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/brands')} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Brands
          </Button>
        </div>
      </header>

      {/* Brand Header */}
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start gap-4">
              {brand.image_url ? (
                <ImageWithFallback 
                  src={brand.image_url} 
                  alt={brand.name}
                  className="w-20 h-20 object-contain rounded-lg bg-muted p-2 flex-shrink-0"
                />
              ) : (
                <div 
                  className="w-20 h-20 rounded-lg flex items-center justify-center text-4xl flex-shrink-0"
                  style={{ backgroundColor: brand.logo_color }}
                >
                  {brand.logo_emoji}
                </div>
              )}
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{brand.name}</CardTitle>
                <CardDescription className="text-base">{brand.description}</CardDescription>
                <div className="flex gap-4 mt-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Category: </span>
                    <span className="font-medium">{brand.category}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Earning Rates Card */}
        <Card className="bg-primary/5 mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Your Earning Rate
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Base Earning Rate</p>
                <p className="text-3xl font-bold flex items-center gap-2">
                  {brand.base_earning_rate} <NCTRLogo size="lg" /> per $1
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">With Your {multiplier}x Status Multiplier</p>
                <p className="text-3xl font-bold text-primary flex items-center gap-2">
                  {calculateMultipliedRate(brand.base_earning_rate)} <NCTRLogo size="lg" /> per $1
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rewards from Brand */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" />
            Rewards from {brand.name}
          </h2>
          {rewards.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground font-medium">No rewards currently available from this brand</p>
                <p className="text-sm text-muted-foreground mt-1">Check back soon for exclusive offers</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  isInWishlist={wishlist.has(reward.id)}
                  onToggleWishlist={handleToggleWishlist}
                  onImageZoom={handleImageZoom}
                  onClick={() => navigate(`/rewards/${reward.id}`)}
                  isAnimatingHeart={animatingHeartId === reward.id}
                  claimBalance={claimBalance}
                  userTier={tier?.tier_name?.toLowerCase() || 'droplet'}
                />
              ))}
            </div>
          )}
        </div>

        {/* Earn Opportunities */}
        {opportunities.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Earn Opportunities</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {opportunities.map((opportunity, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                    <CardDescription>{opportunity.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => handleOpenLink(opportunity.link, opportunity.title)}
                      className="w-full"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Link
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
