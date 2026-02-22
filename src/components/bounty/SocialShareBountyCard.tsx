import { useState, useCallback } from 'react';
import { Lock, Send, Loader2, Ban } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSocialShares } from '@/hooks/useSocialShares';
import { toast } from 'sonner';
import type { StaticBounty } from './BountyCardStatic';

export function SocialShareBountyCard({ bounty }: { bounty: StaticBounty }) {
  const Icon = bounty.icon;
  const { user } = useAuthContext();
  const { sharesThisMonth, maxShares, atCap, isLoading, isSharing, recordShare } = useSocialShares();
  const [pendingPlatform, setPendingPlatform] = useState<string | null>(null);

  const SHARE_TEXTS = {
    twitter: "I'm earning NCTR by participating in @NCTRAlliance's Crescendo. The participation economy is here 🔥 crescendo.nctr.live",
    farcaster: "Earning NCTR through real participation on Crescendo. No grinding, no gimmicks — just show up and earn 👇 crescendo.nctr.live",
    telegram: "Join Crescendo by NCTR Alliance — earn NCTR just by participating. crescendo.nctr.live",
  };

  const openShareAndRecord = useCallback(async (platform: 'twitter' | 'farcaster' | 'telegram') => {
    if (atCap || !user || isSharing) return;

    const text = SHARE_TEXTS[platform];
    let url = '';
    if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    } else if (platform === 'farcaster') {
      url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
    } else {
      url = `https://t.me/share/url?url=${encodeURIComponent('https://crescendo.nctr.live')}&text=${encodeURIComponent(text)}`;
    }
    window.open(url, '_blank');

    setPendingPlatform(platform);
    await new Promise((r) => setTimeout(r, 3000));

    const result = await recordShare(platform);
    setPendingPlatform(null);

    if (result && (result as Record<string, unknown>).success) {
      toast.success('Share recorded! 250 NCTR earned (360LOCK)', { duration: 4000 });
    } else if (result) {
      toast.info((result as Record<string, unknown>).error as string || 'Share not recorded');
    }
  }, [atCap, user, isSharing, recordShare]);

  return (
    <Card className="relative overflow-hidden border-border cursor-pointer transition-all duration-200 ease-out hover:-translate-y-[3px] hover:border-[#E2FF6D]/50 hover:shadow-[0_8px_24px_rgba(226,255,109,0.12)]">
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
            <span>Shares this month</span>
            <span className="font-medium">{isLoading ? '...' : `${sharesThisMonth}/${maxShares}`}</span>
          </div>
          <Progress value={(sharesThisMonth / maxShares) * 100} className="h-1.5" />
        </div>

        {user && (
          atCap ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">
              <Ban className="h-3.5 w-3.5 shrink-0" />
              Max shares reached this month
            </div>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => openShareAndRecord('twitter')} disabled={isSharing} className="flex-1 gap-1.5 text-xs">
                {pendingPlatform === 'twitter' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                )}
                X
              </Button>
              <Button size="sm" variant="outline" onClick={() => openShareAndRecord('farcaster')} disabled={isSharing} className="flex-1 gap-1.5 text-xs">
                {pendingPlatform === 'farcaster' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M5.24 3h13.52v1.2H5.24V3zm-1.2 2.4h15.92v1.2H4.04V5.4zM2.84 7.8h18.32v12.6h-1.8v-1.2h-1.2v1.2H5.84v-1.2H4.64v1.2H2.84V7.8zm3.6 3.6h4.8v3.6H6.44v-3.6zm6.6 0h4.8v3.6h-4.8v-3.6z" /></svg>
                )}
                Farcaster
              </Button>
              <Button size="sm" variant="outline" onClick={() => openShareAndRecord('telegram')} disabled={isSharing} className="flex-1 gap-1.5 text-xs">
                {pendingPlatform === 'telegram' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                TG
              </Button>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
