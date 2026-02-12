import { Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusTier } from '@/contexts/UnifiedUserContext';

interface BountyBoardHeroProps {
  tier: StatusTier | null;
  availableCount: number;
  totalCount: number;
}

export function BountyBoardHero({ tier, availableCount, totalCount }: BountyBoardHeroProps) {
  return (
    <div className="rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
         style={{ background: 'linear-gradient(135deg, hsl(240 10% 10%), hsl(240 10% 14%))' }}>
      <div className="space-y-1">
        <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
          <Target className="h-5 w-5" style={{ color: 'hsl(var(--accent-lime))' }} />
          Bounties: Earn NCTR for Contributing
        </h1>
        <p className="text-xs sm:text-sm text-white/60 max-w-lg">
          Complete tasks. Choose 360LOCK. Earn 3x rewards. Higher Crescendo status unlocks bigger bounties.
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {tier && (
          <Badge className="text-xs font-bold border-0 px-2.5 py-1"
                 style={{ backgroundColor: tier.badge_color + '30', color: tier.badge_color }}>
            {tier.badge_emoji} {tier.display_name}
          </Badge>
        )}
        <div className="text-right">
          <p className="text-lg font-bold text-white">{availableCount}</p>
          <p className="text-[10px] text-white/50 uppercase tracking-wider">Available</p>
        </div>
      </div>
    </div>
  );
}
