import { Lock, AtSign, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useNavigate } from 'react-router-dom';

const BRONZE_THRESHOLD = 100;

export function HandleBountyCard() {
  const { profile, total360Locked } = useUnifiedUser();
  const navigate = useNavigate();

  const handle = profile?.handle;
  const isBronze = total360Locked >= BRONZE_THRESHOLD;
  const progress = Math.min(100, (total360Locked / BRONZE_THRESHOLD) * 100);

  // State 3: Already claimed
  if (handle) {
    return (
      <Card className="relative overflow-hidden border-[#E2FF6D]/40 bg-[#E2FF6D]/5">
        <div className="absolute top-3 right-3 z-10">
          <Badge
            className="text-[10px] font-black border-0 px-2 py-0.5 gap-1"
            style={{ backgroundColor: '#E2FF6D', color: '#1A1A2E' }}
          >
            <Check className="h-3 w-3" /> Claimed ✓
          </Badge>
        </div>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E2FF6D30' }}>
              <AtSign className="h-5 w-5" style={{ color: '#E2FF6D' }} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-foreground leading-tight">You are @{handle}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">+250 NCTR earned</p>
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Reward</span>
            <span className="font-black text-lg" style={{ color: '#E2FF6D' }}>250 NCTR</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // State 2: Bronze unlocked, not yet claimed
  if (isBronze) {
    return (
      <Card
        className="relative overflow-hidden border-[#E2FF6D]/50 cursor-pointer transition-all duration-200 ease-out hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(226,255,109,0.12)]"
        onClick={() => navigate('/profile')}
      >
        <div className="absolute top-3 right-3 z-10">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse"
            style={{ backgroundColor: '#E2FF6D20', color: '#E2FF6D' }}
          >
            UNLOCKED
          </span>
        </div>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E2FF6D20' }}>
              <AtSign className="h-5 w-5" style={{ color: '#E2FF6D' }} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-foreground leading-tight">Claim Your @Handle</h3>
              <p className="text-xs text-muted-foreground mt-0.5">+250 NCTR</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You unlocked this Bronze benefit! Choose your permanent Crescendo identity.
          </p>
          <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Reward</span>
            <span className="font-black text-lg" style={{ color: '#E2FF6D' }}>250 NCTR</span>
          </div>
          <Button
            size="sm"
            className="w-full font-semibold"
            style={{ backgroundColor: '#E2FF6D', color: '#1A1A2E' }}
            onClick={(e) => { e.stopPropagation(); navigate('/profile'); }}
          >
            Claim Now →
          </Button>
        </CardContent>
      </Card>
    );
  }

  // State 1: Not Bronze — locked
  return (
    <Card className="relative overflow-hidden border-border opacity-70">
      <div className="absolute top-3 right-3 z-10">
        <Lock className="h-4 w-4 text-muted-foreground" />
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg w-10 h-10 flex items-center justify-center shrink-0 bg-muted">
            <AtSign className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-foreground leading-tight">Claim Your @Handle</h3>
            <p className="text-xs font-medium" style={{ color: '#E2FF6D' }}>Bronze Benefit</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Reach Bronze status to unlock your custom Crescendo identity
        </p>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>NCTR Locked</span>
            <span className="font-medium">{Math.floor(total360Locked)} / {BRONZE_THRESHOLD}</span>
          </div>
          <Progress
            value={progress}
            className="h-1.5 [&>div]:bg-[#E2FF6D]"
          />
        </div>

        <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Reward</span>
          <span className="font-black text-lg text-muted-foreground">250 NCTR</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() => navigate('/membership')}
        >
          🔒 Lock NCTR to Reach Bronze →
        </Button>
      </CardContent>
    </Card>
  );
}
