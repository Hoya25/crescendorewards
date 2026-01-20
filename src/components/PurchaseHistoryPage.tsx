import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Receipt, Calendar, Package } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { NoTransactionsEmpty } from '@/components/EmptyState';
import { DataErrorState } from '@/components/DataErrorState';

interface Purchase {
  id: string;
  package_id: string;
  package_name: string;
  claims_amount: number;
  amount_paid: number;
  currency: string;
  status: string;
  created_at: string;
}

function PurchaseCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-12" />
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PurchaseHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPurchases();
    }
  }, [user]);

  const fetchPurchases = async (isRetry = false) => {
    try {
      if (isRetry) setRetrying(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('purchases')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPurchases(data || []);
    } catch (err) {
      console.error('Error fetching purchases:', err);
      setError(err instanceof Error ? err : new Error('Failed to load purchases'));
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  const handleRetry = () => fetchPurchases(true);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Receipt className="w-8 h-8" />
            Purchase History
          </h1>
          <p className="text-muted-foreground mt-1">
            View all your claim package purchases
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <PurchaseCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <DataErrorState
            title="Failed to load purchase history"
            message="We couldn't load your purchase history. Please try again."
            onRetry={handleRetry}
            retrying={retrying}
          />
        ) : purchases.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <NoTransactionsEmpty />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <Card key={purchase.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{purchase.package_name}</CardTitle>
                    <Badge
                      variant={purchase.status === 'completed' ? 'default' : 'secondary'}
                    >
                      {purchase.status}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(purchase.created_at), 'PPP p')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Claims Received</p>
                      <p className="text-xl font-bold">{purchase.claims_amount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Amount Paid</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(purchase.amount_paid, purchase.currency)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
