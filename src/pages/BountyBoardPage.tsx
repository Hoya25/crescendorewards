import { useState } from 'react';
import { Lock, Gift, Users, Share2, PenTool, Flame, Clock, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';

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
    showProgress: true,
    progressLabel: 'Streak progress',
    progressValue: 3,
    progressMax: 7,
  },
  {
    id: 'social-share',
    title: 'Social Share',
    description: 'Share Crescendo on social media and earn NCTR. Up to 4 shares per month.',
    nctrReward: 750,
    icon: Share2,
    frequency: 'Per share • Max 4/month',
    showProgress: true,
    progressLabel: 'Shares this month',
    progressValue: 1,
    progressMax: 4,
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
  const { tier } = useUnifiedUser();

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
          <BountyCardStatic key={bounty.id} bounty={bounty} />
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
        {/* Icon + Title */}
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

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed">{bounty.description}</p>

        {/* NCTR Amount */}
        <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Reward</span>
          <span className="text-lg font-black" style={{ color: '#E2FF6D' }}>
            {bounty.nctrReward.toLocaleString()} NCTR
          </span>
        </div>

        {/* 360LOCK Badge */}
        <Badge
          className="text-[10px] font-bold border-0 gap-1 px-2 py-0.5"
          style={{ backgroundColor: '#E2FF6D', color: '#1A1A2E' }}
        >
          <Lock className="h-3 w-3" /> 360LOCK
        </Badge>

        {/* Progress bar */}
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
