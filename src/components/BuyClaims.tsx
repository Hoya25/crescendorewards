import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShoppingCart, Check, Sparkles, Award, Gift, HelpCircle, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { NCTRLogo } from './NCTRLogo';
import { getMembershipTierByNCTR, getNextMembershipTier, getMembershipProgress } from '@/utils/membershipLevels';

interface BuyClaimsProps {
  currentBalance: number;
  onPurchaseSuccess: () => void;
  trigger?: React.ReactNode;
}

interface ClaimPackage {
  id: string;
  claims: number;
  price: number;
  label: string;
  popular?: boolean;
  bonus?: number;
}

// Stripe price IDs for each package
const STRIPE_PRICES = {
  starter: 'price_1STt82LH9lB6iuZgexn693ld',
  popular: 'price_1STt8GLH9lB6iuZg0ZXNlYAf',
  premium: 'price_1STt8aLH9lB6iuZgjKuIc0vh',
  ultimate: 'price_1STtAoLH9lB6iuZghenXBMFK',
  mega: 'price_1STtB2LH9lB6iuZgL4qyz4lC',
};

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

export function BuyClaims({ currentBalance, onPurchaseSuccess, trigger }: BuyClaimsProps) {
  const [open, setOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ClaimPackage | null>(null);
  const [processing, setProcessing] = useState(false);
  const [lockedNCTR, setLockedNCTR] = useState(0);

  useEffect(() => {
    const fetchLockedNCTR = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('locked_nctr')
        .eq('id', user.id)
        .single();

      if (profile) {
        setLockedNCTR(profile.locked_nctr);
      }
    };

    if (open) {
      fetchLockedNCTR();
    }
  }, [open]);

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
          packageId: selectedPackage.id
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.open(data.url, '_blank');
        setOpen(false);
        toast({
          title: "Redirecting to checkout",
          description: "Complete your purchase to receive claim passes.",
        });
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

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            Buy Claims
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Purchase Claim Passes</DialogTitle>
            <DialogDescription>
              Choose a package to add Claim Passes to your balance
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {claimPackages.map((pkg) => {
              const isBestValue = pkg.id === getBestValuePackageId();
              const savings = calculateSavings(pkg.claims, pkg.price);
              
              return (
                <Card
                  key={pkg.id}
                  className={`cursor-pointer transition-all ${
                    selectedPackage?.id === pkg.id
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:border-primary/50'
                  } ${pkg.popular ? 'border-primary/30' : ''} ${isBestValue ? 'border-primary/40' : ''}`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{pkg.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          {pkg.claims} Claim Passes
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {pkg.popular && (
                          <Badge className="gap-1">
                            <Sparkles className="w-3 h-3" />
                            Popular
                          </Badge>
                        )}
                        {isBestValue && (
                          <Badge variant="secondary" className="gap-1">
                            <Award className="w-3 h-3" />
                            Best Value
                          </Badge>
                        )}
                      </div>
                    </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">${pkg.price}</span>
                      <span className="text-sm text-muted-foreground">
                        ${(pkg.price / pkg.claims).toFixed(2)} per claim
                      </span>
                    </div>
                    {savings !== 0 && (
                      <div className="mt-1">
                        <Badge variant={savings > 0 ? "secondary" : "destructive"} className="text-xs">
                          {savings > 0 ? 'Save' : 'Premium'} ${Math.abs(savings).toFixed(2)}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {pkg.bonus && (
                    <div className="mb-3 p-2 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-violet-600" />
                        <span className="text-sm font-medium text-violet-900 dark:text-violet-100 flex items-center gap-1">
                          +{pkg.bonus} Bonus <NCTRLogo size="xs" /> (360LOCK)
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3.5 h-3.5 text-violet-600 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="font-semibold mb-1">360LOCK Bonus</p>
                              <p className="text-sm">
                                Earn 3 NCTR per $1 spent on claim passes. These bonus NCTR are automatically locked for 360 days, 
                                contributing to your membership tier level while they vest.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary" />
                      <span>Instant delivery</span>
                    </div>
                    {selectedPackage?.id === pkg.id && (
                      <Badge variant="secondary">Selected</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Balance:</span>
              <span className="font-semibold">{currentBalance} Claims</span>
            </div>
            {selectedPackage && (
              <>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">You'll receive:</span>
                  <span className="font-semibold text-primary">+{selectedPackage.claims} Claims</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t">
                  <span className="font-semibold">New Balance:</span>
                  <span className="font-bold text-lg">{currentBalance + selectedPackage.claims} Claims</span>
                </div>
              </>
            )}
          </div>

          {selectedPackage?.bonus && (
            <>
              <div className="mb-4 p-3 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-violet-600" />
                    <span className="text-sm font-medium text-violet-900 dark:text-violet-100 flex items-center gap-1">
                      Bonus <NCTRLogo size="xs" /> (360LOCK):
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-violet-600 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-semibold mb-1">360LOCK Bonus</p>
                          <p className="text-sm">
                            Earn 3 NCTR per $1 spent on claim passes. These bonus NCTR are automatically locked for 360 days, 
                            contributing to your membership tier level while they vest.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="font-bold text-lg text-violet-600 flex items-center gap-1">
                    +{selectedPackage.bonus} <NCTRLogo size="xs" />
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Current Tier Progress:</span>
                    <TrendingUp className="w-4 h-4 text-violet-600" />
                  </div>
                  
                  {(() => {
                    const currentTier = getMembershipTierByNCTR(lockedNCTR);
                    const newLockedNCTR = lockedNCTR + selectedPackage.bonus;
                    const newTier = getMembershipTierByNCTR(newLockedNCTR);
                    const currentProgress = getMembershipProgress(lockedNCTR);
                    const newProgress = getMembershipProgress(newLockedNCTR);
                    const nextTier = getNextMembershipTier(lockedNCTR);

                    return (
                      <>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium" style={{ color: currentTier.color }}>
                              {currentTier.name}
                            </span>
                            {nextTier && (
                              <span className="text-muted-foreground">
                                {nextTier.name} at {nextTier.requirement.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <Progress value={currentProgress} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            {lockedNCTR.toLocaleString()} <NCTRLogo size="xs" /> locked
                          </div>
                        </div>

                        <div className="flex items-center gap-2 py-2">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                          <span className="text-xs font-medium text-violet-600">After Purchase</span>
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium" style={{ color: newTier.color }}>
                              {newTier.name}
                              {newTier.level > currentTier.level && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  TIER UP!
                                </Badge>
                              )}
                            </span>
                            {nextTier && newTier.level < nextTier.level && (
                              <span className="text-muted-foreground">
                                {nextTier.requirement - newLockedNCTR > 0 
                                  ? `${(nextTier.requirement - newLockedNCTR).toLocaleString()} to ${nextTier.name}`
                                  : nextTier.name
                                }
                              </span>
                            )}
                          </div>
                          <Progress value={newProgress} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            {newLockedNCTR.toLocaleString()} <NCTRLogo size="xs" /> locked
                            <span className="text-violet-600 font-medium ml-1">
                              (+{selectedPackage.bonus.toLocaleString()})
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={!selectedPackage || processing}
              className="gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              {processing ? 'Processing...' : `Purchase ${selectedPackage?.claims || 0} Claims`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
