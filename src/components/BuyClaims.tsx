import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Check, Sparkles, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
}

const BASE_PRICE_PER_CLAIM = 5.99;

const claimPackages: ClaimPackage[] = [
  { id: 'starter', claims: 1, price: 5.99, label: 'Single Pass' },
  { id: 'small', claims: 5, price: 25, label: 'Small Pack' },
  { id: 'popular', claims: 25, price: 125, label: 'Popular Pack', popular: true },
  { id: 'premium', claims: 50, price: 250, label: 'Premium Pack' },
  { id: 'ultimate', claims: 100, price: 2500, label: 'Ultimate Pack' },
];

const calculateSavings = (claims: number, price: number): number => {
  const regularPrice = claims * BASE_PRICE_PER_CLAIM;
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

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    try {
      setProcessing(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to purchase claims',
          variant: 'destructive',
        });
        return;
      }

      // Update claim balance
      const { error } = await supabase
        .from('profiles')
        .update({ 
          claim_balance: currentBalance + selectedPackage.claims 
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Purchase Successful! 🎉',
        description: `You've received ${selectedPackage.claims} Claim Passes!`,
      });

      onPurchaseSuccess();
      setOpen(false);
      setSelectedPackage(null);
    } catch (error: any) {
      console.error('Error purchasing claims:', error);
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Failed to purchase claims',
        variant: 'destructive',
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
