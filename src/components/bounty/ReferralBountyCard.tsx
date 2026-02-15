import { useState } from 'react';
import { Lock, Copy, Check, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generateReferralLink } from '@/lib/referral-links';
import type { StaticBounty } from './BountyCardStatic';

interface Props {
  bounty: StaticBounty;
  referralCode: string;
  referralCount: number;
}

export function ReferralBountyCard({ bounty, referralCode, referralCount }: Props) {
  const [copied, setCopied] = useState(false);
  const Icon = bounty.icon;
  const referralLink = generateReferralLink(referralCode);
  const hasCode = referralCode && referralCode !== 'LOADING';

  const handleCopy = async () => {
    if (!hasCode) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const shareOnTwitter = () => {
    if (!hasCode) return;
    const text = `I'm earning NCTR on @NCTRAlliance's Crescendo. Join through my link and we both earn tokens 🔥`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`,
      '_blank'
    );
  };

  const shareOnFarcaster = () => {
    if (!hasCode) return;
    const text = `Earning NCTR through participation on Crescendo. Join me 👇`;
    window.open(
      `https://warpcast.com/~/compose?text=${encodeURIComponent(text + '\n\n' + referralLink)}`,
      '_blank'
    );
  };

  const shareOnTelegram = () => {
    if (!hasCode) return;
    const text = `Join me on Crescendo and we both earn NCTR in 360LOCK!`;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`,
      '_blank'
    );
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
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground leading-tight">{bounty.title}</h3>
              {referralCount > 0 && (
                <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 shrink-0">
                  {referralCount} referral{referralCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
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

        {hasCode && (
          <div className="space-y-2 pt-1">
            <Button
              size="sm"
              onClick={handleCopy}
              className="w-full gap-2 text-xs font-bold"
              style={{ backgroundColor: '#E2FF6D', color: '#1A1A2E' }}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={shareOnTwitter} className="flex-1 gap-1.5 text-xs">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X
              </Button>
              <Button size="sm" variant="outline" onClick={shareOnFarcaster} className="flex-1 gap-1.5 text-xs">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.24 3h13.52v1.2H5.24V3zm-1.2 2.4h15.92v1.2H4.04V5.4zM2.84 7.8h18.32v12.6h-1.8v-1.2h-1.2v1.2H5.84v-1.2H4.64v1.2H2.84V7.8zm3.6 3.6h4.8v3.6H6.44v-3.6zm6.6 0h4.8v3.6h-4.8v-3.6z" />
                </svg>
                Farcaster
              </Button>
              <Button size="sm" variant="outline" onClick={shareOnTelegram} className="flex-1 gap-1.5 text-xs">
                <Send className="h-3.5 w-3.5" />
                TG
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
