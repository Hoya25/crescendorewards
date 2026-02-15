import { useState, useCallback } from 'react';
import { Lock, Gift, Users, Share2, PenTool, Flame, Clock, Info, Copy, Check, Send, Loader2, Ban } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useReferralStats } from '@/hooks/useReferralStats';
import { useCheckinStreak } from '@/hooks/useCheckinStreak';
import { useAuthContext } from '@/contexts/AuthContext';
import { generateReferralLink } from '@/lib/referral-links';
import { useSocialShares } from '@/hooks/useSocialShares';
import { toast } from 'sonner';

interface StaticBounty {
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
}

const BOUNTIES: StaticBounty[] = [
  {
    id: 'early-adopter',
    title: 'Early Adopter Bonus',
    description: 'Be among the first 300 members to join Crescendo and earn a massive welcome reward.',
    nctrReward: 25000,
    icon: Gift,
    tag: 'LIMITED',
    frequency: 'One-time • First 300 members',
  },
  {
    id: 'signup-bonus',
    title: 'Sign-up Bonus',
    description: 'Automatically applied when you create your account. Welcome to the community!',
    nctrReward: 15000,
    icon: Gift,
    frequency: 'One-time • Auto-applied',
  },
  {
    id: 'refer-friend',
    title: 'Refer a Friend',
    description: 'Share your referral link and earn NCTR every time someone joins through it.',
    nctrReward: 7500,
    icon: Users,
    frequency: 'Per referral',
    isReferral: true,
  },
  {
    id: 'referred-welcome',
    title: 'Referred Welcome',
    description: 'Joined through a friend\'s link? You get a bonus too. Everyone wins.',
    nctrReward: 3000,
    icon: Users,
    frequency: 'One-time for referred member',
  },
  {
    id: 'weekly-checkin',
    title: 'Weekly Check-in Streak',
    description: 'Visit 7 days in a row to earn your streak bonus. Consistency is rewarded.',
    nctrReward: 1500,
    icon: Flame,
    frequency: 'Weekly',
    isStreak: true,
  },
  {
    id: 'social-share',
    title: 'Social Share',
    description: 'Share Crescendo on social media and earn NCTR. Up to 4 shares per month.',
    nctrReward: 750,
    icon: Share2,
    frequency: 'Per share • Max 4/month',
    isSocialShare: true,
  },
  {
    id: 'content-creation',
    title: 'Content Creation',
    description: 'Create original content about Crescendo or NCTR. Earn NCTR for every approved post.',
    nctrReward: 5000,
    icon: PenTool,
    frequency: 'Per approved post',
  },
];

const TOTAL_EARNABLE = '43,000+';

export default function BountyBoardPage() {
  const { tier, profile } = useUnifiedUser();
  const { data: stats } = useReferralStats();
  
  const crescendoData = profile?.crescendo_data || {};
  const referralCode = crescendoData.referral_code || '';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Hero Banner */}
      <div
        className="rounded-xl p-5 sm:p-6"
        style={{ background: 'linear-gradient(135deg, hsl(240 10% 10%), hsl(240 10% 16%))' }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              🎯 Bounty Board
            </h1>
            <p className="text-sm text-white/60 max-w-md">
              Complete bounties. Commit with 360LOCK. Earn NCTR and build your Crescendo Status.
            </p>
          </div>
          <div className="shrink-0 text-center sm:text-right">
            <p className="text-2xl sm:text-3xl font-black" style={{ color: '#E2FF6D' }}>
              {TOTAL_EARNABLE}
            </p>
            <p className="text-[11px] text-white/50 uppercase tracking-wider mt-0.5">Total Earnable NCTR</p>
          </div>
        </div>
        {tier && (
          <div className="mt-3">
            <Badge
              className="text-xs font-bold border-0 px-2.5 py-1"
              style={{ backgroundColor: tier.badge_color + '30', color: tier.badge_color }}
            >
              {tier.badge_emoji} {tier.display_name}
            </Badge>
          </div>
        )}
      </div>

      {/* Bounty Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {BOUNTIES.map((bounty) => (
          bounty.isReferral ? (
            <ReferralBountyCard 
              key={bounty.id} 
              bounty={bounty} 
              referralCode={referralCode}
              referralCount={stats?.totalReferrals || 0}
            />
          ) : bounty.isStreak ? (
            <StreakBountyCard key={bounty.id} bounty={bounty} />
          ) : bounty.isSocialShare ? (
            <SocialShareBountyCard key={bounty.id} bounty={bounty} />
          ) : (
            <BountyCardStatic key={bounty.id} bounty={bounty} />
          )
        ))}
      </div>

      {/* 360LOCK Explainer */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          What is 360LOCK?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your tokens are committed for exactly 360 days. You own them — they just can't be sold during the lock period.
          This commitment strengthens the ecosystem and earns you status that unlocks more rewards.
        </p>
      </div>
    </div>
  );
}

function BountyCardStatic({ bounty }: { bounty: StaticBounty }) {
  const Icon = bounty.icon;

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

function ReferralBountyCard({ 
  bounty, 
  referralCode, 
  referralCount 
}: { 
  bounty: StaticBounty; 
  referralCode: string; 
  referralCount: number;
}) {
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
    const text = `Join me on Crescendo and we both earn 7,500 NCTR in 360LOCK!`;
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

        {/* Share Actions */}
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
              <Button
                size="sm"
                variant="outline"
                onClick={shareOnTwitter}
                className="flex-1 gap-1.5 text-xs"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={shareOnFarcaster}
                className="flex-1 gap-1.5 text-xs"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.24 3h13.52v1.2H5.24V3zm-1.2 2.4h15.92v1.2H4.04V5.4zM2.84 7.8h18.32v12.6h-1.8v-1.2h-1.2v1.2H5.84v-1.2H4.64v1.2H2.84V7.8zm3.6 3.6h4.8v3.6H6.44v-3.6zm6.6 0h4.8v3.6h-4.8v-3.6z" />
                </svg>
                Farcaster
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={shareOnTelegram}
                className="flex-1 gap-1.5 text-xs"
              >
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

function StreakBountyCard({ bounty }: { bounty: StaticBounty }) {
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

        {/* Streak Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Streak progress</span>
            <span className="font-medium">
              {isLoading ? '...' : `${streak}/${max}`}
            </span>
          </div>
          <Progress
            value={(streak / max) * 100}
            className="h-1.5"
          />
        </div>

        {/* Check-in Button */}
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

function SocialShareBountyCard({ bounty }: { bounty: StaticBounty }) {
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

    // Open share URL
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

    // Wait 3 seconds then record
    setPendingPlatform(platform);
    await new Promise((r) => setTimeout(r, 3000));

    const result = await recordShare(platform);
    setPendingPlatform(null);

    if (result && (result as Record<string, unknown>).success) {
      toast.success('Share recorded! 750 NCTR earned (360LOCK)', { duration: 4000 });
    } else if (result) {
      toast.info((result as Record<string, unknown>).error as string || 'Share not recorded');
    }
  }, [atCap, user, isSharing, recordShare]);

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

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Shares this month</span>
            <span className="font-medium">
              {isLoading ? '...' : `${sharesThisMonth}/${maxShares}`}
            </span>
          </div>
          <Progress value={(sharesThisMonth / maxShares) * 100} className="h-1.5" />
        </div>

        {/* Share buttons */}
        {user && (
          atCap ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">
              <Ban className="h-3.5 w-3.5 shrink-0" />
              Max shares reached this month
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openShareAndRecord('twitter')}
                disabled={isSharing}
                className="flex-1 gap-1.5 text-xs"
              >
                {pendingPlatform === 'twitter' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                )}
                X
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openShareAndRecord('farcaster')}
                disabled={isSharing}
                className="flex-1 gap-1.5 text-xs"
              >
                {pendingPlatform === 'farcaster' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.24 3h13.52v1.2H5.24V3zm-1.2 2.4h15.92v1.2H4.04V5.4zM2.84 7.8h18.32v12.6h-1.8v-1.2h-1.2v1.2H5.84v-1.2H4.64v1.2H2.84V7.8zm3.6 3.6h4.8v3.6H6.44v-3.6zm6.6 0h4.8v3.6h-4.8v-3.6z" />
                  </svg>
                )}
                Farcaster
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openShareAndRecord('telegram')}
                disabled={isSharing}
                className="flex-1 gap-1.5 text-xs"
              >
                {pendingPlatform === 'telegram' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                TG
              </Button>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
