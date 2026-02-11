import { ExternalLink, Lock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusTier } from '@/contexts/UnifiedUserContext';

interface MerchBountiesHeroProps {
  activeMerchCount: number;
  totalNctrEarned: number;
  currentTier: StatusTier | null;
}

const TIER_ACCESS: Record<string, string[]> = {
  diamond: ['merch_tier1', 'merch_tier2', 'merch_tier3', 'merch_recurring'],
  platinum: ['merch_tier1', 'merch_tier2', 'merch_tier3', 'merch_recurring'],
  gold: ['merch_tier1', 'merch_tier2', 'merch_tier3', 'merch_recurring'],
  silver: ['merch_tier1', 'merch_tier2', 'merch_recurring'],
  bronze: ['merch_tier1', 'merch_recurring'],
};

export function MerchBountiesHero({ activeMerchCount, totalNctrEarned, currentTier }: MerchBountiesHeroProps) {
  const tierName = currentTier?.tier_name?.toLowerCase() || 'bronze';
  const accessibleTiers = TIER_ACCESS[tierName] || TIER_ACCESS.bronze;

  return (
    <div className="rounded-xl border border-lime-500/20 bg-gradient-to-br from-lime-500/5 via-background to-lime-500/10 p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Lock className="h-6 w-6 text-lime-500" />
            Rep the Brand. Earn 3x.
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg">
            Buy NCTR merch. Complete bounties. Commit to 360LOCK. Earn 3x multiplied NCTR rewards.
          </p>
        </div>
        <Button
          size="sm"
          className="bg-lime-500 hover:bg-lime-600 text-lime-950 font-semibold gap-1.5 shrink-0"
          asChild
        >
          <a href="https://nctr-merch.myshopify.com" target="_blank" rel="noopener noreferrer">
            Shop NCTR Merch <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="rounded-lg bg-muted/50 px-4 py-2">
          <p className="text-xs text-muted-foreground">Active Merch Bounties</p>
          <p className="text-xl font-bold text-foreground">{activeMerchCount}</p>
        </div>
        <div className="rounded-lg bg-muted/50 px-4 py-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Total NCTR Earned
          </p>
          <p className="text-xl font-bold text-lime-500">{totalNctrEarned.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-muted/50 px-4 py-2">
          <p className="text-xs text-muted-foreground">Your Status</p>
          <p className="text-lg font-bold text-foreground">
            {currentTier?.badge_emoji || '🥉'} {currentTier?.display_name || 'Bronze'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>You can access:</span>
        {accessibleTiers.map(t => (
          <Badge key={t} variant="outline" className="text-[10px]">
            {t.replace('merch_', '').replace('_', ' ').toUpperCase()}
          </Badge>
        ))}
      </div>
    </div>
  );
}
