import { Lock, Star, Check, Square, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useFounding111, useFounding111Status } from '@/hooks/useFounding111';
import { useAuthContext } from '@/contexts/AuthContext';
import type { StaticBounty } from './BountyCardStatic';

export function Founding111BountyCard({ bounty }: { bounty: StaticBounty }) {
  const { data: approvedCount = 0, isLoading: countLoading } = useFounding111();
  const { isAuthenticated } = useAuthContext();
  const { data: myStatus, isLoading: statusLoading } = useFounding111Status();

  const isFull = approvedCount >= 111;
  const spotsRemaining = Math.max(0, 111 - approvedCount);
  const Icon = bounty.icon;
  const status = myStatus?.status || 'not_candidate';

  // CLOSED state
  if (isFull && status !== 'approved') {
    return (
      <Card className="relative overflow-hidden border-border opacity-60">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-muted-foreground leading-tight">{bounty.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">CLOSED</p>
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <span className="text-sm font-bold text-muted-foreground">
              CLOSED — Early Adopter period ended
            </span>
          </div>
          <Progress value={100} className="h-1.5 [&>div]:bg-muted-foreground" />
          <p className="text-xs text-muted-foreground text-center">Early Adopter period closed</p>
        </CardContent>
      </Card>
    );
  }

  // APPROVED state — permanent badge
  if (status === 'approved') {
    return (
      <Card className="relative overflow-hidden border-2" style={{ borderColor: '#E2FF6D' }}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#E2FF6D20' }}
            >
              <Star className="h-5 w-5" style={{ color: '#E2FF6D' }} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground leading-tight">{bounty.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Verified Member</p>
            </div>
            <Badge
              className="ml-auto text-xs font-black border-0 px-3 py-1"
              style={{ backgroundColor: '#E2FF6D', color: '#323232' }}
            >
              ⚡ Early Adopter #{myStatus?.founding_number}
            </Badge>
          </div>
          <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#E2FF6D10' }}>
            <span className="font-black text-lg" style={{ color: '#E2FF6D' }}>
              {bounty.nctrReward.toLocaleString()} NCTR
            </span>
            <span className="text-xs text-muted-foreground ml-2">earned</span>
          </div>
          <LiveCounter count={approvedCount} loading={countLoading} />
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

        {/* Status-specific content */}
        {isAuthenticated && status === 'candidate' && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <p className="text-xs font-semibold text-foreground">Your path to Early Adopter:</p>
            <div className="space-y-1.5">
              <ChecklistItem
                checked={myStatus?.has_purchase || false}
                label="Make your first purchase"
              />
              <ChecklistItem
                checked={myStatus?.has_referral_purchase || false}
                label="Invite a friend who makes a purchase"
              />
            </div>
          </div>
        )}

        {isAuthenticated && status === 'qualified_pending' && (
          <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#E2FF6D10' }}>
            <Sparkles className="h-4 w-4 mx-auto mb-1" style={{ color: '#E2FF6D' }} />
            <p className="text-sm font-semibold text-foreground">
              You've qualified! Your Early Adopter status is being verified. ✨
            </p>
          </div>
        )}

        {(!isAuthenticated || status === 'not_candidate') && (
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              First 111 members — earned through participation
            </p>
          </div>
        )}

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

        <LiveCounter count={approvedCount} loading={countLoading} />
      </CardContent>
    </Card>
  );
}

function ChecklistItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {checked ? (
        <Check className="h-3.5 w-3.5 shrink-0" style={{ color: '#E2FF6D' }} />
      ) : (
        <Square className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      )}
      <span className={checked ? 'text-foreground line-through' : 'text-muted-foreground'}>
        {label}
      </span>
    </div>
  );
}

function LiveCounter({ count, loading }: { count: number; loading: boolean }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Early Adopters</span>
        <span className="font-medium">{loading ? '...' : count}/111</span>
      </div>
      <Progress
        value={(count / 111) * 100}
        className="h-2 [&>div]:transition-all"
        style={{ ['--progress-color' as string]: '#E2FF6D' }}
      />
      <p className="text-xs font-semibold text-center" style={{ color: '#E2FF6D' }}>
        {Math.max(0, 111 - count)} spots available
      </p>
    </div>
  );
}
