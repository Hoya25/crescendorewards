import { Button } from '@/components/ui/button';
import { LucideIcon, Gift, ShoppingBag, Receipt, Heart, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = Gift,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionHref) {
      navigate(actionHref);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">{description}</p>
      {actionLabel && (
        <Button onClick={handleAction} className="gap-2">
          <Gift className="w-4 h-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// Pre-configured empty states for common use cases
export function NoRewardsEmpty() {
  return (
    <EmptyState
      icon={Gift}
      title="No rewards available yet"
      description="Check back soon for exclusive rewards, experiences, and merchandise."
      actionLabel="Explore Rewards"
      actionHref="/rewards"
    />
  );
}

export function NoClaimedRewardsEmpty() {
  return (
    <EmptyState
      icon={ShoppingBag}
      title="You haven't claimed any rewards yet"
      description="Browse our marketplace to find exclusive rewards you can claim with your Claims balance."
      actionLabel="Browse Rewards"
      actionHref="/rewards"
    />
  );
}

export function NoTransactionsEmpty() {
  return (
    <EmptyState
      icon={Receipt}
      title="No transactions found"
      description="Your transaction history will appear here once you start earning NCTR and claiming rewards."
    />
  );
}

export function NoWishlistItemsEmpty() {
  return (
    <EmptyState
      icon={Heart}
      title="Your wishlist is empty"
      description="Save rewards you're interested in to keep track of them and get notified of changes."
      actionLabel="Explore Rewards"
      actionHref="/rewards"
    />
  );
}

export function NoSubmissionsEmpty() {
  return (
    <EmptyState
      icon={FileText}
      title="No submissions yet"
      description="Submit reward ideas to contribute to the marketplace and earn NCTR when they're approved."
      actionLabel="Submit a Reward"
      actionHref="/submit-reward"
    />
  );
}
