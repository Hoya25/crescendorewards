import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Gift, Sparkles, ShoppingBag, CreditCard, Coins, ZoomIn, X } from 'lucide-react';
import { ImageWithFallback } from '@/components/ImageWithFallback';

interface Reward {
  id: string;
  title: string;
  description: string;
  category: 'alliance_tokens' | 'experiences' | 'merch' | 'gift_cards';
  cost: number;
  image_url: string | null;
  stock_quantity: number | null;
  is_active: boolean;
}

interface RewardsPoolProps {
  claimBalance: number;
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

export function RewardsPool({ claimBalance, onClaimSuccess }: RewardsPoolProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [filteredRewards, setFilteredRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });

  useEffect(() => {
    loadRewards();
  }, []);

  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredRewards(rewards);
    } else {
      setFilteredRewards(rewards.filter(r => r.category === activeCategory));
    }
  }, [activeCategory, rewards]);

  const loadRewards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('cost', { ascending: true });

      if (error) throw error;
      setRewards(data as Reward[] || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
      toast({
        title: 'Error',
        description: 'Failed to load rewards',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRewardClick = (reward: Reward) => {
    setSelectedReward(reward);
    setShowDetailModal(true);
  };

  const handleImageZoom = (imageUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomedImage(imageUrl);
    setShowImageZoom(true);
  };

  const handleClaimClick = async () => {
    if (!selectedReward) return;
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to claim rewards',
        variant: 'destructive',
      });
      return;
    }
    
    if (claimBalance < selectedReward.cost) {
      toast({
        title: 'Insufficient Balance',
        description: `You need ${selectedReward.cost - claimBalance} more tokens to claim this reward`,
        variant: 'destructive',
      });
      return;
    }

    if (selectedReward.stock_quantity !== null && selectedReward.stock_quantity <= 0) {
      toast({
        title: 'Out of Stock',
        description: 'This reward is currently out of stock',
        variant: 'destructive',
      });
      return;
    }

    setShowDetailModal(false);
    setShowClaimModal(true);
  };

  const handleClaim = async () => {
    if (!selectedReward) return;

    try {
      setClaiming(true);

      // Prepare shipping info only for physical items
      const needsShipping = selectedReward.category === 'merch' || selectedReward.category === 'experiences';
      const shippingData = needsShipping ? shippingInfo : null;

      const { data, error } = await supabase.rpc('claim_reward', {
        p_reward_id: selectedReward.id,
        p_shipping_info: shippingData,
      }) as { data: any; error: any };

      if (error) throw error;

      const result = data as { success: boolean; error?: string; new_balance?: number };

      if (!result.success) {
        throw new Error(result.error || 'Failed to claim reward');
      }

      toast({
        title: 'Success!',
        description: `You've claimed ${selectedReward.title}! New balance: ${result.new_balance} tokens`,
      });

      setShowClaimModal(false);
      setSelectedReward(null);
      setShippingInfo({
        name: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: '',
      });
      
      onClaimSuccess();
      loadRewards();
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

  const canAfford = (cost: number) => claimBalance >= cost;
  const needsShipping = selectedReward?.category === 'merch' || selectedReward?.category === 'experiences';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Rewards Pool
              </h1>
              <p className="text-muted-foreground mt-1">Redeem your tokens for amazing rewards</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Your Balance</p>
              <p className="text-3xl font-bold text-primary">{claimBalance}</p>
              <p className="text-xs text-muted-foreground">tokens</p>
            </div>
          </div>

          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                All
              </TabsTrigger>
              {Object.entries(categoryLabels).map(([key, label]) => {
                const Icon = categoryIcons[key as keyof typeof categoryIcons];
                return (
                  <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-48 bg-muted" />
                <CardContent className="h-32 bg-muted/50 mt-4" />
              </Card>
            ))}
          </div>
        ) : filteredRewards.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">No rewards available in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRewards.map((reward) => {
              const Icon = categoryIcons[reward.category];
              const affordable = canAfford(reward.cost);
              const outOfStock = reward.stock_quantity !== null && reward.stock_quantity <= 0;

              return (
                <Card
                  key={reward.id}
                  className={`group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl ${
                    !affordable || outOfStock ? 'opacity-60' : ''
                  }`}
                  onClick={() => handleRewardClick(reward)}
                >
                  <CardHeader className="pb-4">
                    <div className="relative w-full h-56 bg-gradient-to-br from-muted/50 to-muted/20 rounded-lg overflow-hidden mb-4">
                      {reward.image_url ? (
                        <>
                          <ImageWithFallback
                            src={reward.image_url}
                            alt={reward.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => handleImageZoom(reward.image_url!, e)}
                            >
                              <ZoomIn className="w-5 h-5" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon className="w-24 h-24 text-primary/60" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg leading-tight">{reward.title}</CardTitle>
                      <Badge variant={affordable ? 'default' : 'secondary'} className="shrink-0">
                        {reward.cost} tokens
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-2">
                      {reward.description}
                    </CardDescription>
                    {reward.stock_quantity !== null && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {outOfStock ? 'Out of Stock' : `${reward.stock_quantity} remaining`}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      disabled={!affordable || outOfStock}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRewardClick(reward);
                      }}
                    >
                      {outOfStock ? 'Out of Stock' : affordable ? 'View Details' : 'Insufficient Balance'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      <Dialog open={showImageZoom} onOpenChange={setShowImageZoom}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-black/95">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => setShowImageZoom(false)}
          >
            <X className="w-6 h-6" />
          </Button>
          {zoomedImage && (
            <div className="w-full h-full flex items-center justify-center p-8">
              <img
                src={zoomedImage}
                alt="Zoomed view"
                className="max-w-full max-h-[80vh] object-contain animate-scale-in"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-2xl">
          {selectedReward && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedReward.title}</DialogTitle>
                <DialogDescription className="text-base">{selectedReward.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="relative group cursor-pointer rounded-lg overflow-hidden" onClick={(e) => selectedReward.image_url && handleImageZoom(selectedReward.image_url, e)}>
                  {selectedReward.image_url ? (
                    <>
                      <ImageWithFallback
                        src={selectedReward.image_url}
                        alt={selectedReward.title}
                        className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 px-4 py-2 rounded-full flex items-center gap-2 text-white text-sm">
                          <ZoomIn className="w-4 h-4" />
                          Click to zoom
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg">
                      {(() => {
                        const Icon = categoryIcons[selectedReward.category];
                        return <Icon className="w-32 h-32 text-primary" />;
                      })()}
                    </div>
                  )}
                </div>
                
                <div className="grid gap-3 bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm font-medium">Cost:</span>
                    <Badge variant="default" className="text-base font-bold px-3 py-1">
                      {selectedReward.cost} tokens
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm font-medium">Your Balance:</span>
                    <span className="text-base font-bold text-primary">{claimBalance} tokens</span>
                  </div>
                  {selectedReward.stock_quantity !== null && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium">Available:</span>
                      <span className="text-base font-semibold">{selectedReward.stock_quantity} remaining</span>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowDetailModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleClaimClick} 
                  disabled={!canAfford(selectedReward.cost)}
                  className="flex-1"
                >
                  {canAfford(selectedReward.cost) ? 'Claim Reward' : 'Insufficient Balance'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Claim Modal with Shipping Info */}
      <Dialog open={showClaimModal} onOpenChange={setShowClaimModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Claim Reward</DialogTitle>
            <DialogDescription>
              {needsShipping
                ? 'Please provide your shipping information'
                : 'Confirm your reward claim'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {needsShipping && (
              <>
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
                  <Textarea
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
              </>
            )}
            {!needsShipping && selectedReward && (
              <div className="text-center py-4">
                <p className="text-lg">
                  Confirm claim of <span className="font-bold">{selectedReward.title}</span> for{' '}
                  <span className="font-bold text-primary">{selectedReward.cost} tokens</span>?
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClaimModal(false)} disabled={claiming}>
              Cancel
            </Button>
            <Button onClick={handleClaim} disabled={claiming}>
              {claiming ? 'Claiming...' : 'Confirm Claim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
