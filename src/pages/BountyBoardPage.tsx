import { Gift, Users, Share2, PenTool, Flame, Info, ShoppingBag, ShoppingCart, Trophy, Star, Shirt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useReferralStats } from '@/hooks/useReferralStats';
import { BountyCardStatic, type StaticBounty } from '@/components/bounty/BountyCardStatic';
import { ReferralBountyCard } from '@/components/bounty/ReferralBountyCard';
import { StreakBountyCard } from '@/components/bounty/StreakBountyCard';
import { SocialShareBountyCard } from '@/components/bounty/SocialShareBountyCard';
import { Founding111BountyCard } from '@/components/bounty/Founding111BountyCard';

// ── BOUNTY DEFINITIONS ──────────────────────────────────────────────

const ENTRY_BOUNTIES: StaticBounty[] = [
  {
    id: 'signup-bonus',
    title: 'Sign-up Bonus',
    description: 'Automatically applied when you create your account. Welcome to Crescendo!',
    nctrReward: 625,
    icon: Gift,
    frequency: 'One-time • Auto-applied',
  },
  {
    id: 'founding-111',
    title: 'Founding 111 Bonus',
    description: 'Be among the first 111 members to join Crescendo and make a purchase. Achieving Founding status is a one-time opportunity that can never be earned again.',
    nctrReward: 1250,
    icon: Star,
    tag: 'LIMITED',
    frequency: 'One-time • First 111 members',
    showProgress: true,
    progressLabel: 'Slots claimed',
    progressValue: 0, // TODO: live counter
    progressMax: 111,
  },
  {
    id: 'referred-welcome',
    title: 'Referred Welcome',
    description: "Joined through a friend's link? You get a bonus too. Everyone wins.",
    nctrReward: 375,
    icon: Users,
    frequency: 'One-time • Auto-applied if referred',
  },
];

const REVENUE_BOUNTIES: StaticBounty[] = [
  {
    id: 'first-purchase',
    title: 'First Purchase',
    description: 'Make any purchase to unlock this reward. Your first step into earning real NCTR.',
    nctrReward: 2500,
    icon: ShoppingBag,
    frequency: 'One-time',
    prominent: true,
  },
  {
    id: 'every-purchase',
    title: 'Every Purchase Drip',
    description: 'Earn NCTR on every single purchase you make. The more you shop, the more you earn.',
    nctrReward: 250,
    icon: ShoppingCart,
    frequency: 'Per purchase • Ongoing',
    prominent: true,
  },
  {
    id: '5th-purchase',
    title: '5th Purchase Milestone',
    description: 'Hit 5 purchases and unlock a major bonus. Consistency pays.',
    nctrReward: 5000,
    icon: Trophy,
    frequency: 'One-time milestone',
    prominent: true,
    showProgress: true,
    progressLabel: 'Purchases',
    progressValue: 0,
    progressMax: 5,
  },
  {
    id: '10th-purchase',
    title: '10th Purchase Milestone',
    description: 'Reach 10 purchases for a massive reward. You\'re building something real.',
    nctrReward: 10000,
    icon: Trophy,
    frequency: 'One-time milestone',
    prominent: true,
    showProgress: true,
    progressLabel: 'Purchases',
    progressValue: 0,
    progressMax: 10,
  },
  {
    id: '25th-purchase',
    title: '25th Purchase Milestone',
    description: 'The ultimate purchase milestone. 25 purchases earns you legend status.',
    nctrReward: 25000,
    icon: Trophy,
    frequency: 'One-time milestone',
    prominent: true,
    showProgress: true,
    progressLabel: 'Purchases',
    progressValue: 0,
    progressMax: 25,
  },
];

const MERCH_BOUNTIES: StaticBounty[] = [
  {
    id: 'first-merch',
    title: 'First Merch Purchase',
    description: 'Buy your first piece of NCTR merch and earn 2× the standard purchase reward.',
    nctrReward: 5000,
    icon: Shirt,
    frequency: 'One-time',
    prominent: true,
  },
  {
    id: 'every-merch',
    title: 'Every Merch Purchase',
    description: 'Every merch purchase earns 2× the standard drip. Rep the brand, earn the rewards.',
    nctrReward: 500,
    icon: Shirt,
    frequency: 'Per merch purchase • Ongoing',
  },
];

const REFERRAL_BOUNTIES: StaticBounty[] = [
  {
    id: 'referral-signup',
    title: 'Referral Signs Up',
    description: 'Share your link and earn NCTR when someone creates an account through it.',
    nctrReward: 625,
    icon: Users,
    frequency: 'Per referral',
    isReferral: true,
  },
  {
    id: 'referral-first-purchase',
    title: 'Referral First Purchase',
    description: 'When your referral makes their first purchase, you earn a big bonus.',
    nctrReward: 2500,
    icon: Users,
    frequency: 'Per referral',
    isReferral: true,
  },
  {
    id: 'referral-every-purchase',
    title: 'Referral Every Purchase',
    description: 'Earn on every purchase your referrals make. Founding 111 members earn 500, standard earn 100.',
    nctrReward: 500,
    icon: Users,
    frequency: 'Per referral purchase',
  },
  {
    id: 'referral-5-purchases',
    title: 'Referral 5 Purchases',
    description: 'When your referral hits 5 purchases, you unlock a milestone bonus.',
    nctrReward: 2500,
    icon: Trophy,
    frequency: 'Per referral milestone',
  },
  {
    id: 'referral-10-purchases',
    title: 'Referral 10 Purchases',
    description: 'When your referral hits 10 purchases, you earn big. Build your team.',
    nctrReward: 5000,
    icon: Trophy,
    frequency: 'Per referral milestone',
  },
];

const ENGAGEMENT_BOUNTIES: StaticBounty[] = [
  {
    id: 'weekly-checkin',
    title: 'Weekly Check-in Streak',
    description: 'Visit 7 days in a row to earn your streak bonus. Consistency is rewarded.',
    nctrReward: 500,
    icon: Flame,
    frequency: 'Weekly',
    isStreak: true,
  },
  {
    id: 'social-share',
    title: 'Social Share',
    description: 'Share Crescendo on social media and earn NCTR. Up to 4 shares per month.',
    nctrReward: 250,
    icon: Share2,
    frequency: 'Per share • Max 4/month',
    isSocialShare: true,
  },
  {
    id: 'content-creation',
    title: 'Content Creation',
    description: 'Create original content about Crescendo or NCTR. Earn NCTR for every approved post.',
    nctrReward: 2000,
    icon: PenTool,
    frequency: 'Per approved post',
  },
];

// ── SECTION CONFIG ──────────────────────────────────────────────────

interface BountySection {
  title: string;
  emoji: string;
  bounties: StaticBounty[];
}

const SECTIONS: BountySection[] = [
  { title: 'Get Started', emoji: '🚀', bounties: ENTRY_BOUNTIES },
  { title: 'Shop & Earn', emoji: '🛒', bounties: REVENUE_BOUNTIES },
  { title: 'Merch Rewards', emoji: '👕', bounties: MERCH_BOUNTIES },
  { title: 'Build Your Team', emoji: '🤝', bounties: REFERRAL_BOUNTIES },
  { title: 'Stay Active', emoji: '🔥', bounties: ENGAGEMENT_BOUNTIES },
];

// (TOTAL_EARNABLE removed — purchase & referral bounties are uncapped)

// ── MAIN PAGE ───────────────────────────────────────────────────────

export default function BountyBoardPage() {
  const { tier, profile } = useUnifiedUser();
  const { data: stats } = useReferralStats();

  const crescendoData = profile?.crescendo_data || {};
  const referralCode = crescendoData.referral_code || '';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
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
          <div className="shrink-0 text-center sm:text-right space-y-1">
            <p className="text-[11px] text-white/50 uppercase tracking-wider">My Earnings</p>
            <p className="text-3xl sm:text-4xl font-black" style={{ color: '#E2FF6D' }}>
              {profile?.crescendo_data?.locked_nctr
                ? Number(profile.crescendo_data.locked_nctr).toLocaleString()
                : '0'}{' '}
              <span className="text-base font-bold text-white/50">NCTR</span>
            </p>
            <p className="text-[11px] text-white/40">
              Sign-up · Purchases · Referrals · Streaks
            </p>
            <p className="text-[10px] text-white/30 italic">
              Keep shopping. Keep sharing. Keep earning.
            </p>
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

      {/* Bounty Sections */}
      {SECTIONS.map((section) => (
        <div key={section.title} className="space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <span>{section.emoji}</span> {section.title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {section.bounties.map((bounty) =>
              bounty.id === 'founding-111' ? (
                <Founding111BountyCard key={bounty.id} bounty={bounty} />
              ) : bounty.isReferral ? (
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
            )}
          </div>
        </div>
      ))}

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
