import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ShoppingBag, Star, Package, Zap, CheckCircle2, AlertTriangle, Coins, CreditCard, Sparkles, Gift, Clock, Lock } from 'lucide-react';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { BuyClaims } from '@/components/BuyClaims';

interface Reward {
  id: string;
  title: string;
  description: string;
  category: 'alliance_tokens' | 'experiences' | 'merch' | 'gift_cards';
  cost: number;
  image_url: string | null;
  stock_quantity: number | null;
  is_active: boolean;
  is_featured: boolean;
}

interface RewardDetailPageProps {
  rewardId: string;
  onBack: () => void;
  onClaimSuccess: () => void;
}

const categoryIcons = {
  alliance_tokens: Coins,
  experiences: Sparkles,
  merch: ShoppingBag,
  gift_cards: CreditCard,
};

const categoryLabels = {
  alliance_tokens: 'Alliance Tokens',
  experiences: 'Experiences',
  merch: 'Merch',
  gift_cards: 'Gift Cards',
};

export function RewardDetailPage({ rewardId, onBack, onClaimSuccess }: RewardDetailPageProps) {
  const { profile } = useAuth();
  const [reward, setReward] = useState<Reward | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });

  useEffect(() => {
    fetchRewardDetails();
  }, [rewardId]);

  const fetchRewardDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('id', rewardId)
        .single();

      if (error) throw error;
      setReward(data as Reward);
    } catch (error) {
      console.error('Error fetching reward:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reward details',
        variant: 'destructive',
      });
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!reward || !profile) return;

    const claimBalance = profile.claim_balance || 0;
    
    if (claimBalance < reward.cost) {
      toast({
        title: 'Insufficient Balance',
        description: `You need ${reward.cost - claimBalance} more claim passes`,
        variant: 'destructive',
      });
      return;
    }

    setClaiming(true);
    try {
      const needsShipping = reward.category === 'merch' || reward.category === 'experiences';
      const shippingData = needsShipping ? shippingInfo : null;

      if (needsShipping) {
        const isShippingValid = Object.values(shippingInfo).every(val => val.trim() !== '');
        if (!isShippingValid) {
          toast({
            title: 'Incomplete Information',
            description: 'Please fill in all shipping details',
            variant: 'destructive',
          });
          setClaiming(false);
          return;
        }
      }

      const { data, error } = await supabase.rpc('claim_reward', {
        p_reward_id: reward.id,
        p_shipping_info: shippingData,
      }) as { data: any; error: any };

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Reward claimed successfully',
      });

      setShowClaimModal(false);
      onClaimSuccess();
      onBack();
    } catch (error: any) {
      console.error('Error claiming reward:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to claim reward',
        variant: 'destructive',
      });
    } finally {
      setClaiming(false);
    }
  };

  if (loading || !reward) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading reward...</p>
        </div>
      </div>
    );
  }

  const Icon = categoryIcons[reward.category];
  const claimBalance = profile?.claim_balance || 0;
  const canAfford = claimBalance >= reward.cost;
  const outOfStock = reward.stock_quantity !== null && reward.stock_quantity <= 0;
  const stockPercentage = reward.stock_quantity !== null ? (reward.stock_quantity / 100) * 100 : 100;
  const needsShipping = reward.category === 'merch' || reward.category === 'experiences';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Rewards
            </Button>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Your Balance</p>
                <p className="text-2xl font-bold text-primary">{claimBalance}</p>
              </div>
              <BuyClaims 
                currentBalance={claimBalance} 
                onPurchaseSuccess={onClaimSuccess}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image */}
          <div className="space-y-4">
            <Card className="overflow-hidden border-0 shadow-xl">
              <div className="relative w-full aspect-square bg-gradient-to-br from-primary/20 via-background to-secondary/20">
                {reward.image_url ? (
                  <ImageWithFallback
                    src={reward.image_url}
                    alt={reward.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon className="w-32 h-32 text-muted-foreground/30" />
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                  {reward.is_featured && (
                    <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm border-0 shadow-lg">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {reward.cost === 0 && (
                    <Badge className="bg-green-500/90 text-white backdrop-blur-sm border-0 shadow-lg">
                      <Gift className="w-3 h-3 mr-1" />
                      FREE
                    </Badge>
                  )}
                  {outOfStock && (
                    <Badge className="bg-destructive/90 text-destructive-foreground backdrop-blur-sm border-0 shadow-lg">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Out of Stock
                    </Badge>
                  )}
                </div>
              </div>
            </Card>

            {/* Stock Status */}
            {reward.stock_quantity !== null && (
              <Card className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Package className="w-4 h-4" />
                      Available Stock
                    </span>
                    <span className="font-medium">{reward.stock_quantity} remaining</span>
                  </div>
                  <Progress value={stockPercentage} className="h-2" />
                  {reward.stock_quantity <= 10 && reward.stock_quantity > 0 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Limited quantity - Act fast!
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5 text-primary" />
                <Badge variant="secondary">{categoryLabels[reward.category]}</Badge>
              </div>
              
              <h1 className="text-4xl font-bold mb-4">{reward.title}</h1>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Coins className="w-6 h-6 text-primary" />
                  <span className="text-3xl font-bold">{reward.cost}</span>
                  <span className="text-muted-foreground">Claim Passes</span>
                </div>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {reward.description}
              </p>
            </div>

            {/* Key Features */}
            <Card className="p-6 bg-card/50 backdrop-blur">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                What You Get
              </h3>
              <ul className="space-y-3">
                {reward.category === 'alliance_tokens' && (
                  <>
                    <li className="flex items-start gap-2 text-sm">
                      <Zap className="w-4 h-4 text-primary mt-0.5" />
                      <span>Instant digital delivery to your account</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                      <span>Fully redeemable in-platform tokens</span>
                    </li>
                  </>
                )}
                {reward.category === 'experiences' && (
                  <>
                    <li className="flex items-start gap-2 text-sm">
                      <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                      <span>Exclusive access to premium experiences</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                      <span>Confirmation sent via email</span>
                    </li>
                  </>
                )}
                {reward.category === 'merch' && (
                  <>
                    <li className="flex items-start gap-2 text-sm">
                      <Package className="w-4 h-4 text-primary mt-0.5" />
                      <span>Free shipping on all orders</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                      <span>Official branded merchandise</span>
                    </li>
                  </>
                )}
                {reward.category === 'gift_cards' && (
                  <>
                    <li className="flex items-start gap-2 text-sm">
                      <Zap className="w-4 h-4 text-primary mt-0.5" />
                      <span>Instant digital code delivery</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                      <span>No expiration date</span>
                    </li>
                  </>
                )}
                <li className="flex items-start gap-2 text-sm">
                  <Lock className="w-4 h-4 text-primary mt-0.5" />
                  <span>Secure transaction guaranteed</span>
                </li>
              </ul>
            </Card>

            {/* Claim Button */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-2 border-primary/20">
              <div className="space-y-4">
                {!canAfford && (
                  <div className="p-3 bg-orange-100 dark:bg-orange-950 rounded-lg">
                    <p className="text-sm text-orange-800 dark:text-orange-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      You need {reward.cost - claimBalance} more claim passes to claim this reward
                    </p>
                  </div>
                )}
                
                <Button
                  size="lg"
                  className="w-full text-lg h-14"
                  onClick={() => setShowClaimModal(true)}
                  disabled={outOfStock || !canAfford || claiming}
                >
                  {outOfStock ? (
                    <>
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Out of Stock
                    </>
                  ) : claiming ? (
                    'Processing...'
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      Claim Reward
                    </>
                  )}
                </Button>
                
                {canAfford && !outOfStock && (
                  <p className="text-sm text-muted-foreground text-center">
                    Your balance after claim: {claimBalance - reward.cost} claim passes
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Claim Modal */}
      <Dialog open={showClaimModal} onOpenChange={setShowClaimModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Claim Reward</DialogTitle>
            <DialogDescription>
              {needsShipping
                ? 'Please provide your shipping information'
                : 'Confirm your reward claim'}
            </DialogDescription>
          </DialogHeader>

          {needsShipping ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={shippingInfo.name}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={shippingInfo.address}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={shippingInfo.city}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                    placeholder="New York"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={shippingInfo.state}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                    placeholder="NY"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={shippingInfo.zip}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, zip: e.target.value })}
                    placeholder="10001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={shippingInfo.country}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                    placeholder="USA"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Reward:</span>
                  <span className="text-sm">{reward.title}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Cost:</span>
                  <span className="text-sm font-bold">{reward.cost} claim passes</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Your Balance:</span>
                  <span className="text-sm font-bold text-primary">{claimBalance} claim passes</span>
                </div>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClaimModal(false)} disabled={claiming}>
              Cancel
            </Button>
            <Button onClick={handleClaim} disabled={claiming}>
              {claiming ? 'Processing...' : 'Confirm Claim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
