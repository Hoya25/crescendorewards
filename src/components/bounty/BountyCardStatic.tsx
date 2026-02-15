import { Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export interface StaticBounty {
  id: string;
  title: string;
  description: string;
  nctrReward: number;
  icon: React.ElementType;
  tag?: string;
  frequency: string;
  showProgress?: boolean;
  progressLabel?: string;
  progressValue?: number;
  progressMax?: number;
  isReferral?: boolean;
  isStreak?: boolean;
  isSocialShare?: boolean;
  prominent?: boolean;
}

export function BountyCardStatic({ bounty }: { bounty: StaticBounty }) {
  const Icon = bounty.icon;

  return (
    <Card
      className={`relative overflow-hidden border-border hover:border-[#E2FF6D]/30 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
        bounty.prominent ? 'ring-1 ring-[#E2FF6D]/20' : ''
      }`}
    >
      {bounty.tag && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="text-[10px] font-black border-0 px-2 py-0.5 bg-red-500 text-white">
            {bounty.tag}
          </Badge>
        </div>
      )}
      <CardContent className={`p-4 space-y-3 ${bounty.prominent ? 'p-5' : ''}`}>
        <div className="flex items-start gap-3">
          <div
            className={`rounded-lg flex items-center justify-center shrink-0 ${
              bounty.prominent ? 'w-12 h-12' : 'w-10 h-10'
            }`}
            style={{ backgroundColor: '#E2FF6D20' }}
          >
            <Icon className={bounty.prominent ? 'h-6 w-6' : 'h-5 w-5'} style={{ color: '#E2FF6D' }} />
          </div>
          <div className="min-w-0">
            <h3 className={`font-bold text-foreground leading-tight ${bounty.prominent ? 'text-base' : 'text-sm'}`}>
              {bounty.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{bounty.frequency}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">{bounty.description}</p>

        <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Reward</span>
          <span className={`font-black ${bounty.prominent ? 'text-xl' : 'text-lg'}`} style={{ color: '#E2FF6D' }}>
            {bounty.nctrReward.toLocaleString()} NCTR
          </span>
        </div>

        <Badge
          className="text-[10px] font-bold border-0 gap-1 px-2 py-0.5"
          style={{ backgroundColor: '#E2FF6D', color: '#1A1A2E' }}
        >
          <Lock className="h-3 w-3" /> 360LOCK
        </Badge>

        {bounty.showProgress && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{bounty.progressLabel}</span>
              <span className="font-medium">
                {bounty.progressValue}/{bounty.progressMax}
              </span>
            </div>
            <Progress
              value={((bounty.progressValue || 0) / (bounty.progressMax || 1)) * 100}
              className="h-1.5"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
