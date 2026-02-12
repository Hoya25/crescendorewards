import { Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bounty } from '@/hooks/useBounties';

interface LockedBountiesSectionProps {
  bounties: Bounty[];
  tierName: string | undefined;
}

const ASPIRATION_TEXT: Record<string, string> = {
  none: 'Reach Bronze to unlock your first bounties',
  bronze: 'Reach Silver to unlock 5 more bounties worth up to 1,500 NCTR each',
  silver: 'Reach Gold to unlock campaign bounties worth up to 3,000 NCTR each',
};

export function LockedBountiesSection({ bounties, tierName }: LockedBountiesSectionProps) {
  const tier = tierName?.toLowerCase() || 'none';
  
  // Gold+ has full access — hide this section
  if (['gold', 'platinum', 'diamond'].includes(tier)) return null;
  if (bounties.length === 0) return null;

  const aspirationText = ASPIRATION_TEXT[tier] || ASPIRATION_TEXT.none;

  return (
    <div className="space-y-3 mt-6">
      <div>
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          Unlock More Bounties by Leveling Up
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">{aspirationText}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {bounties.map(bounty => (
          <Card key={bounty.id} className="relative overflow-hidden opacity-50 border-border">
            <CardContent className="p-0">
              <div className="relative h-24 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <span className="text-4xl blur-[1px]">{bounty.image_emoji || '🎯'}</span>
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Lock className="h-8 w-8 text-white/70" />
                </div>
              </div>
              <div className="p-3 space-y-1.5">
                <h3 className="font-semibold text-sm text-foreground">{bounty.title}</h3>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-bold"
                         style={{
                           backgroundColor: bounty.min_status_required === 'gold' ? '#FFD70020' : bounty.min_status_required === 'silver' ? '#C0C0C020' : '#CD7F3220',
                           color: bounty.min_status_required === 'gold' ? '#FFD700' : bounty.min_status_required === 'silver' ? '#C0C0C0' : '#CD7F32',
                           borderColor: bounty.min_status_required === 'gold' ? '#FFD70040' : bounty.min_status_required === 'silver' ? '#C0C0C040' : '#CD7F3240',
                         }}>
                    {bounty.min_status_required?.charAt(0).toUpperCase()}{bounty.min_status_required?.slice(1)}+ Required
                  </Badge>
                  <span className="text-sm font-bold" style={{ color: 'hsl(var(--accent-lime))' }}>
                    {(bounty.nctr_reward * 3).toLocaleString()} NCTR
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
