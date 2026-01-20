import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ShoppingCart, 
  ArrowLeft, 
  Lock, 
  Shield, 
  CreditCard, 
  Sparkles,
  Gift,
  TrendingUp,
  CheckCircle2,
  HelpCircle,
  Ticket
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { NCTRLogo } from '@/components/NCTRLogo';
import { ClaimsPackageCard, ClaimPackage } from '@/components/claims/ClaimsPackageCard';
import { getMembershipTierByNCTR, getNextMembershipTier, getMembershipProgress } from '@/utils/membershipLevels';
import { STRIPE_PRICES } from '@/config/stripe';
import confetti from 'canvas-confetti';

// Calculate bonus NCTR: 3 NCTR per $1 spent (all bonus is 360LOCK)
const calculateBonusNCTR = (priceInDollars: number): number => {
  return Math.floor(priceInDollars * 3);
};

const claimPackages: ClaimPackage[] = [
  { id: 'starter', claims: 10, price: 50, label: 'Starter Pack', bonus: calculateBonusNCTR(50) },
  { id: 'popular', claims: 25, price: 125, label: 'Popular Pack', popular: true, bonus: calculateBonusNCTR(125) },
  { id: 'premium', claims: 50, price: 250, label: 'Premium Pack', bonus: calculateBonusNCTR(250) },
  { id: 'ultimate', claims: 100, price: 500, label: 'Ultimate Pack', bonus: calculateBonusNCTR(500) },
  { id: 'mega', claims: 210, price: 1000, label: 'Mega Pack', bonus: calculateBonusNCTR(1000) },
];

const calculateSavings = (claims: number, price: number): number => {
  const basePrice = 5.99;
  const regularPrice = claims * basePrice;
  return regularPrice - price;
};

const getBestValuePackageId = (): string => {
  let maxSavings = 0;
  let bestPackageId = '';
  
  claimPackages.forEach(pkg => {
    const savings = calculateSavings(pkg.claims, pkg.price);
    if (savings > maxSavings) {
      maxSavings = savings;
      bestPackageId = pkg.id;
    }
  });
  
  return bestPackageId;
};

export function BuyClaimsPage() {
  const navigate = useNavigate();
  const { profile, refreshUnifiedProfile } = useUnifiedUser();
  const [selectedPackage, setSelectedPackage] = useState<ClaimPackage | null>(null);
  const [processing, setProcessing] = useState(false);
  const [lockedNCTR, setLockedNCTR] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const currentBalance = profile?.crescendo_data?.claims_balance || 0;
  const bestValueId = getBestValuePackageId();

  // Check for payment success in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      setShowSuccess(true);
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      // Refresh profile to get updated balance
      refreshUnifiedProfile();
      // Clear URL param
      window.history.replaceState({}, '', '/buy-claims');
    }
  }, [refreshUnifiedProfile]);

  useEffect(() => {
    const fetchLockedNCTR = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('locked_nctr')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setLockedNCTR(profileData.locked_nctr);
      }
    };

    fetchLockedNCTR();
  }, []);

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to purchase claim passes.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const priceId = STRIPE_PRICES[selectedPackage.id as keyof typeof STRIPE_PRICES];
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          priceId,
          packageId: selectedPackage.id,
          successUrl: `${window.location.origin}/buy-claims?payment=success`,
          cancelUrl: `${window.location.origin}/buy-claims?payment=canceled`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Success state
  if (showSuccess) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="flex items-center justify-center min-h-screen p-6">
              <Card className="max-w-md w-full text-center">
                <CardContent className="pt-8 pb-6">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Purchase Complete!</h1>
                  <p className="text-muted-foreground mb-6">
                    Your claims have been added to your balance.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-muted-foreground">New Balance</p>
                    <p className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
                      <Ticket className="w-6 h-6" />
                      {currentBalance} Claims
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button 
                      onClick={() => navigate('/rewards')}
                      className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start Claiming Rewards
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/dashboard')}
                    >
                      Back to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(-1)}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Get Claims</h1>
                  <p className="text-muted-foreground">
                    Purchase Claims to unlock rewards and opportunities
                  </p>
                </div>
                <Card className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Ticket className="w-6 h-6 text-violet-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Your Balance</p>
                        <p className="text-2xl font-bold">{currentBalance} Claims</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Packages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {claimPackages.slice(0, 3).map((pkg) => (
                <ClaimsPackageCard
                  key={pkg.id}
                  package={pkg}
                  isSelected={selectedPackage?.id === pkg.id}
                  onSelect={() => setSelectedPackage(pkg)}
                  isBestValue={pkg.id === bestValueId}
                />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {claimPackages.slice(3).map((pkg) => (
                <ClaimsPackageCard
                  key={pkg.id}
                  package={pkg}
                  isSelected={selectedPackage?.id === pkg.id}
                  onSelect={() => setSelectedPackage(pkg)}
                  isBestValue={pkg.id === bestValueId}
                />
              ))}
            </div>

            {/* Payment Section */}
            {selectedPackage && (
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-violet-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Complete Your Purchase
                  </CardTitle>
                  <CardDescription>
                    Review your order and proceed to secure checkout
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Order Summary */}
                  <div className="bg-background/80 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{selectedPackage.label}</span>
                      <span className="font-semibold">${selectedPackage.price}.00</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Claims included</span>
                      <span>{selectedPackage.claims} Claims</span>
                    </div>
                    {selectedPackage.bonus && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-violet-600">
                          <Gift className="w-4 h-4" />
                          Bonus NCTR (360LOCK)
                        </span>
                        <span className="font-medium text-violet-600 flex items-center gap-1">
                          +{selectedPackage.bonus} <NCTRLogo size="xs" />
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex items-center justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${selectedPackage.price}.00</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      for {selectedPackage.claims} Claims {selectedPackage.bonus && `+ ${selectedPackage.bonus} Bonus NCTR`}
                    </p>
                  </div>

                  {/* Tier Progress Preview */}
                  {selectedPackage.bonus && (
                    <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-violet-600" />
                        <span className="text-sm font-medium">Tier Progress Impact</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Bonus NCTR contributes to your membership tier</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      {(() => {
                        const currentTier = getMembershipTierByNCTR(lockedNCTR);
                        const newLockedNCTR = lockedNCTR + (selectedPackage.bonus || 0);
                        const newTier = getMembershipTierByNCTR(newLockedNCTR);
                        const currentProgress = getMembershipProgress(lockedNCTR);
                        const newProgress = getMembershipProgress(newLockedNCTR);

                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span style={{ color: currentTier.color }}>
                                {currentTier.name}
                              </span>
                              <span className="text-muted-foreground">→</span>
                              <span style={{ color: newTier.color }} className="font-medium">
                                {newTier.name}
                                {newTier.level > currentTier.level && (
                                  <Badge className="ml-2 text-xs bg-gradient-to-r from-violet-500 to-purple-500 text-white border-none">
                                    🎉 TIER UP!
                                  </Badge>
                                )}
                              </span>
                            </div>
                            <div className="relative">
                              <Progress value={currentProgress} className="h-2" />
                              <div 
                                className="absolute top-0 h-2 bg-violet-500/50 rounded-r-full transition-all"
                                style={{ 
                                  left: `${currentProgress}%`, 
                                  width: `${Math.min(newProgress - currentProgress, 100 - currentProgress)}%` 
                                }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{lockedNCTR.toLocaleString()} NCTR</span>
                              <span className="text-violet-600">→ {newLockedNCTR.toLocaleString()} NCTR</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Balance Preview */}
                  <div className="bg-background/80 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Current Balance</span>
                      <span>{currentBalance} Claims</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">You'll receive</span>
                      <span className="text-primary font-medium">+{selectedPackage.claims} Claims</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between font-bold">
                      <span>New Balance</span>
                      <span className="text-lg text-primary">{currentBalance + selectedPackage.claims} Claims</span>
                    </div>
                  </div>

                  {/* Purchase Button */}
                  <Button
                    onClick={handlePurchase}
                    disabled={processing}
                    className="w-full h-12 text-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  >
                    {processing ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Complete Purchase - ${selectedPackage.price}
                      </>
                    )}
                  </Button>

                  {/* Security badges */}
                  <div className="flex items-center justify-center gap-6 pt-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Lock className="w-3.5 h-3.5" />
                      Secure Payment
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Shield className="w-3.5 h-3.5" />
                      SSL Encrypted
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CreditCard className="w-3.5 h-3.5" />
                      Powered by Stripe
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No selection prompt */}
            {!selectedPackage && (
              <Card className="border-dashed border-2 border-muted-foreground/20">
                <CardContent className="py-12 text-center">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Select a package above to continue
                  </p>
                  <p className="text-sm text-muted-foreground/60 mt-1">
                    Choose the package that best fits your needs
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

export default BuyClaimsPage;
