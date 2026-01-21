import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Ticket,
  Mail,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { NCTRLogo } from '@/components/NCTRLogo';
import { ClaimsPackageCard, ClaimPackage } from '@/components/claims/ClaimsPackageCard';
import { getMembershipTierByNCTR, getNextMembershipTier, getMembershipProgress } from '@/utils/membershipLevels';
import confetti from 'canvas-confetti';

// Format numbers with commas
const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

// Get tier badge info for packages
const getTierBadge = (name: string): { emoji: string; label: string } | null => {
  switch (name) {
    case 'Pro': return { emoji: '⭐', label: 'Most Popular' };
    case 'Elite': return { emoji: '🔥', label: 'Hot' };
    case 'Ultra': return { emoji: '💎', label: 'Best Value' };
    case 'Max': return { emoji: '👑', label: 'VIP' };
    default: return null;
  }
};

// Get multiplier badge for high-tier packages
const getMultiplierBadge = (name: string): string | null => {
  switch (name) {
    case 'Pro': return '3x Bonus';
    case 'Elite': return '5x Bonus';
    case 'Mega': return '6x Bonus';
    case 'Ultra': return '7.5x Bonus';
    case 'Max': return '10x Bonus';
    default: return null;
  }
};

export function BuyClaimsPage() {
  const navigate = useNavigate();
  const { profile, refreshUnifiedProfile } = useUnifiedUser();
  const [selectedPackage, setSelectedPackage] = useState<ClaimPackage | null>(null);
  const [processing, setProcessing] = useState(false);
  const [lockedNCTR, setLockedNCTR] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [claimPackages, setClaimPackages] = useState<ClaimPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const currentBalance = profile?.crescendo_data?.claims_balance || 0;

  // Fetch packages from database
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data, error } = await supabase
          .from('claim_packages')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;

        if (data) {
          const packages: ClaimPackage[] = data.map(pkg => ({
            id: pkg.id,
            claims: pkg.claims_amount,
            price: pkg.price_cents / 100, // Convert cents to dollars
            label: pkg.name,
            popular: pkg.is_popular,
            bonus: pkg.bonus_nctr,
            tierBadge: getTierBadge(pkg.name),
            multiplierBadge: getMultiplierBadge(pkg.name),
          }));
          setClaimPackages(packages);
        }
      } catch (error) {
        console.error('Error fetching packages:', error);
        toast({
          title: "Error",
          description: "Failed to load packages. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

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
      // Fetch the stripe_price_id from the database
      const { data: pkgData, error: pkgError } = await supabase
        .from('claim_packages')
        .select('stripe_price_id')
        .eq('id', selectedPackage.id)
        .single();

      if (pkgError || !pkgData?.stripe_price_id) {
        throw new Error('Package not properly configured for checkout');
      }
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          priceId: pkgData.stripe_price_id,
          packageId: selectedPackage.id,
          successUrl: `${window.location.origin}/buy-claims?payment=success`,
          cancelUrl: `${window.location.origin}/buy-claims?payment=canceled`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Stripe Checkout cannot render inside Lovable's preview iframe.
        // Open in a new tab to avoid a blank/blocked iframe navigation.
        const opened = window.open(data.url, '_blank', 'noopener,noreferrer');
        if (!opened) {
          // Fallback if popup is blocked
          window.location.href = data.url;
        }
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

            {/* Packages Grid - First row: 5 packages */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                  {claimPackages.slice(0, 5).map((pkg) => (
                    <ClaimsPackageCard
                      key={pkg.id}
                      package={pkg}
                      isSelected={selectedPackage?.id === pkg.id}
                      onSelect={() => setSelectedPackage(pkg)}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                  {claimPackages.slice(5).map((pkg) => (
                    <ClaimsPackageCard
                      key={pkg.id}
                      package={pkg}
                      isSelected={selectedPackage?.id === pkg.id}
                      onSelect={() => setSelectedPackage(pkg)}
                    />
                  ))}
                </div>
                
                {/* Contact for custom packages note */}
                {claimPackages.some(pkg => pkg.price >= 1000) && (
                  <div className="text-center mb-6 p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>Looking for higher volumes? <a href="mailto:support@nctr.io" className="text-primary underline hover:no-underline">Contact us for custom packages</a></span>
                    </div>
                  </div>
                )}

                {/* Send as Gift CTA */}
                <Card className="mb-8 border-dashed border-2 border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-purple-500/5 hover:border-violet-500/50 transition-colors">
                  <CardContent className="py-5">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
                          <Gift className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <p className="font-medium">Buying for someone else?</p>
                          <p className="text-sm text-muted-foreground">Send Claims as a gift to a friend or family member</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="border-violet-500/30 text-violet-600 hover:bg-violet-500/10 hover:text-violet-700 shrink-0"
                        asChild
                      >
                        <Link to="/gift-claims">
                          Send as Gift
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

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
                      <span className="font-semibold">${formatNumber(selectedPackage.price)}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Claims included</span>
                      <span>{formatNumber(selectedPackage.claims)} Claims</span>
                    </div>
                    {selectedPackage.bonus && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-violet-600">
                          <Gift className="w-4 h-4" />
                          360LOCK NCTR Bonus
                        </span>
                        <span className="font-medium text-violet-600 flex items-center gap-1">
                          +{formatNumber(selectedPackage.bonus)} <NCTRLogo size="xs" />
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex items-center justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${formatNumber(selectedPackage.price)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      for {formatNumber(selectedPackage.claims)} Claims {selectedPackage.bonus && `+ ${formatNumber(selectedPackage.bonus)} 360LOCK NCTR`}
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
