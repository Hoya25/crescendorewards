import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useHasMerchPurchases, useUncompletedMerchBountyCount } from '@/hooks/useMerchCelebration';

export function MerchBountyReminderCard() {
  const { data: hasPurchases } = useHasMerchPurchases();
  const { data: bountyData } = useUncompletedMerchBountyCount();

  // Only show if user has purchases AND uncompleted bounties
  if (!hasPurchases || !bountyData || bountyData.count === 0) return null;

  return (
    <Card className="border-l-4 overflow-hidden" style={{ borderLeftColor: 'hsl(var(--accent-lime))' }}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
             style={{ backgroundColor: 'hsl(var(--accent-lime) / 0.1)' }}>
          <ShoppingBag className="h-5 w-5" style={{ color: 'hsl(var(--accent-lime))' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground">
            You Have Merch Bounties Waiting!
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {bountyData.count} uncompleted bounties — earn up to{' '}
            <span className="font-semibold" style={{ color: 'hsl(var(--accent-lime))' }}>
              {bountyData.totalPossibleNctr.toLocaleString()} NCTR
            </span>{' '}
            with 360LOCK
          </p>
        </div>
        <Button asChild size="sm" className="shrink-0 font-semibold gap-1"
                style={{ backgroundColor: 'hsl(var(--accent-lime))', color: '#1A1A2E' }}>
          <Link to="/bounties?filter=merch">
            Complete <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
