import { Lock, Flame, Check, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCheckinStreak } from '@/hooks/useCheckinStreak';
import { toast } from 'sonner';
import type { StaticBounty } from './BountyCardStatic';

export function StreakBountyCard({ bounty }: { bounty: StaticBounty }) {
  const Icon = bounty.icon;
  const { user } = useAuthContext();
  const { streak, checkedInToday, max, isLoading, checkIn, isCheckingIn } = useCheckinStreak();

  const handleCheckIn = async () => {
    if (!user) {
      toast.error('Sign in to check in');
      return;
    }
    try {
      const result = await checkIn();
      if (result.streak_completed) {
        toast.success(result.message, { duration: 5000 });
      } else if (result.already_checked_in) {
        toast.info('Already checked in today ✓');
      } else {
        toast.success(result.message);
      }
    } catch {
      toast.error('Check-in failed. Try again.');
    }
  };

  return (
    <Card className="relative overflow-hidden border-border hover:border-[#E2FF6D]/30 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#E2FF6D20' }}
          >
            <Icon className="h-5 w-5" style={{ color: '#E2FF6D' }} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-foreground leading-tight">{bounty.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{bounty.frequency}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">{bounty.description}</p>

        <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Reward</span>
          <span className="text-lg font-black" style={{ color: '#E2FF6D' }}>
            {bounty.nctrReward.toLocaleString()} NCTR
          </span>
        </div>

        <Badge
          className="text-[10px] font-bold border-0 gap-1 px-2 py-0.5"
          style={{ backgroundColor: '#E2FF6D', color: '#1A1A2E' }}
        >
          <Lock className="h-3 w-3" /> 360LOCK
        </Badge>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Streak progress</span>
            <span className="font-medium">{isLoading ? '...' : `${streak}/${max}`}</span>
          </div>
          <Progress value={(streak / max) * 100} className="h-1.5" />
        </div>

        {user && (
          <Button
            size="sm"
            onClick={handleCheckIn}
            disabled={checkedInToday || isCheckingIn}
            className="w-full gap-2 text-xs font-bold"
            style={
              checkedInToday
                ? { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
                : { backgroundColor: '#E2FF6D', color: '#1A1A2E' }
            }
          >
            {isCheckingIn ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking in...</>
            ) : checkedInToday ? (
              <><Check className="h-3.5 w-3.5" /> Checked In Today ✓</>
            ) : (
              <><Flame className="h-3.5 w-3.5" /> Check In</>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
