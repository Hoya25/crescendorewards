import { Lock, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useFounding111 } from '@/hooks/useFounding111';
import type { StaticBounty } from './BountyCardStatic';

export function Founding111BountyCard({ bounty }: { bounty: StaticBounty }) {
  const { data: count = 0, isLoading } = useFounding111();
  const isFull = count >= 111;
  const spotsRemaining = Math.max(0, 111 - count);
  const Icon = bounty.icon;

  if (isFull) {
    return (
      <Card className="relative overflow-hidden border-border opacity-60">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-muted-foreground leading-tight">
                {bounty.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">CLOSED</p>
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <span className="text-sm font-bold text-muted-foreground">
              CLOSED — Founding 111 is full
            </span>
          </div>
          <Progress value={100} className="h-1.5 [&>div]:bg-muted-foreground" />
          <p className="text-xs text-muted-foreground text-center">111/111 Founding Members</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-border hover:border-[#E2FF6D]/30 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      {bounty.tag && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="text-[10px] font-black border-0 px-2 py-0.5 bg-red-500 text-white">
            {bounty.tag}
          </Badge>
        </div>
      )}
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#E2FF6D20' }}
          >
            <Icon className="h-5 w-5" style={{ color: '#E2FF6D' }} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground leading-tight">{bounty.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{bounty.frequency}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">{bounty.description}</p>

        <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Reward</span>
          <span className="font-black text-lg" style={{ color: '#E2FF6D' }}>
            {bounty.nctrReward.toLocaleString()} NCTR
          </span>
        </div>

        <Badge
          className="text-[10px] font-bold border-0 gap-1 px-2 py-0.5"
          style={{ backgroundColor: '#E2FF6D', color: '#1A1A2E' }}
        >
          <Lock className="h-3 w-3" /> 360LOCK
        </Badge>

        {/* Live counter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Founding Members</span>
            <span className="font-medium">
              {isLoading ? '...' : count}/111
            </span>
          </div>
          <Progress
            value={(count / 111) * 100}
            className="h-2 [&>div]:transition-all"
            style={{ ['--progress-color' as string]: '#E2FF6D' }}
          />
          <p className="text-xs font-semibold text-center" style={{ color: '#E2FF6D' }}>
            {spotsRemaining} spots remaining
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
