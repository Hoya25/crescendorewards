import { Gift, Users, Share2, PenTool, Flame, Info, ShoppingBag, ShoppingCart, Trophy, Star, Shirt, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useReferralStats } from '@/hooks/useReferralStats';
import { usePurchaseMilestones } from '@/hooks/usePurchaseMilestones';
import { useMerchMilestones } from '@/hooks/useMerchMilestones';
import { BountyCardStatic, type StaticBounty } from '@/components/bounty/BountyCardStatic';
import { ReferralBountyCard } from '@/components/bounty/ReferralBountyCard';
import { StreakBountyCard } from '@/components/bounty/StreakBountyCard';
import { SocialShareBountyCard } from '@/components/bounty/SocialShareBountyCard';
import { useMemo, useState } from 'react';



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
    id: 'early-adopter',
    title: 'Early Adopter Bonus',
    description: "Joined during our launch period? Extra NCTR for being here early.",
    nctrReward: 1250,
    icon: Star,
    tag: 'LIMITED TIME',
    frequency: 'One-time · Launch period only',
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
    description: 'Earn on every purchase your referrals make. Early adopters earn 500, standard earn 100.',
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

// SECTIONS moved inside component to use dynamic revenueBounties

// ── 360LOCK EXPLAINER CARD ───────────────────────────────────────────
function LockExplainerCard({ dismissed, onDismiss }: { dismissed: boolean; onDismiss: () => void }) {
  if (dismissed) {
    // Collapsed persistent version
    return (
      <div
        className="col-span-full rounded-lg bg-card p-3 flex items-center gap-2"
        style={{ borderLeft: '4px solid #E2FF6D' }}
      >
        <span className="text-sm">🔒</span>
        <p className="text-xs font-medium text-muted-foreground">
          360LOCK: Commit 360 days → 3x rewards
        </p>
      </div>
    );
  }

  return (
    <div
      className="col-span-full rounded-lg bg-card p-4 sm:px-5 relative"
      style={{ borderLeft: '4px solid #E2FF6D' }}
    >
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-2 mb-2">
        <span className="text-lg leading-none mt-0.5">🔒</span>
        <h3 className="text-[15px] font-bold text-foreground">Why 360LOCK?</h3>
      </div>
      <p className="text-sm leading-relaxed mb-2" style={{ color: '#5A5A58' }}>
        Every bounty reward can be amplified 3x by choosing 360LOCK — a 360-day commitment.
        Your rewards stay yours. They just stay committed for 360 days. In return, you unlock
        higher Crescendo status, premium rewards, and a stronger position in the ecosystem.
        It's one decision that changes everything.
      </p>
      <p className="text-xs italic" style={{ color: '#D9D9D9' }}>
        This same commitment principle applies to every participant in the ecosystem — members, brands, and partners alike.
      </p>
    </div>
  );
}

// ── BOUNTY GRID ITEM (renders card + optional explainer) ────────────
function BountyGridItem({
  bounty,
  referralCode,
  referralCount,
  showExplainer,
  explainerDismissed,
  onDismissExplainer,
}: {
  bounty: StaticBounty;
  referralCode: string;
  referralCount: number;
  showExplainer: boolean;
  explainerDismissed: boolean;
  onDismissExplainer: () => void;
}) {
  const card = bounty.isReferral ? (
    <ReferralBountyCard bounty={bounty} referralCode={referralCode} referralCount={referralCount} />
  ) : bounty.isStreak ? (
    <StreakBountyCard bounty={bounty} />
  ) : bounty.isSocialShare ? (
    <SocialShareBountyCard bounty={bounty} />
  ) : (
    <BountyCardStatic bounty={bounty} />
  );

  return (
    <>
      {showExplainer && (
        <LockExplainerCard dismissed={explainerDismissed} onDismiss={onDismissExplainer} />
      )}
      {card}
    </>
  );
}

// ── MAIN PAGE ───────────────────────────────────────────────────────

export default function BountyBoardPage() {
  const { tier, profile } = useUnifiedUser();
  const { data: stats } = useReferralStats();
  const { data: milestones } = usePurchaseMilestones();
  const { data: merchData } = useMerchMilestones();
  const [lockExplainerDismissed, setLockExplainerDismissed] = useState(
    () => localStorage.getItem('360lock_explainer_dismissed') === '1'
  );

  const crescendoData = profile?.crescendo_data || {};
  const referralCode = crescendoData.referral_code || '';

  // Build revenue bounties with real purchase data
  const revenueBounties = useMemo(() => {
    const totalPurchases = milestones?.total_purchases ?? 0;
    const milestonesHit = milestones?.milestones_hit ?? [];
    const totalDripNctr = milestones?.total_drip_nctr ?? 0;

    return REVENUE_BOUNTIES.map((b) => {
      const copy = { ...b };

      if (b.id === 'first-purchase') {
        if (milestonesHit.includes(1)) {
          copy.completed = true;
          copy.completedLabel = 'Completed ✓';
        } else {
          copy.description = 'Make your first purchase to earn 2,500 NCTR.';
        }
      } else if (b.id === 'every-purchase') {
        copy.subtitle = `${totalPurchases} purchase${totalPurchases !== 1 ? 's' : ''} · ${Number(totalDripNctr).toLocaleString()} NCTR earned`;
      } else if (b.id === '5th-purchase') {
        if (milestonesHit.includes(5)) {
          copy.completed = true;
        } else {
          copy.progressValue = Math.min(totalPurchases, 5);
        }
      } else if (b.id === '10th-purchase') {
        if (milestonesHit.includes(10)) {
          copy.completed = true;
        } else {
          copy.progressValue = Math.min(totalPurchases, 10);
        }
      } else if (b.id === '25th-purchase') {
        if (milestonesHit.includes(25)) {
          copy.completed = true;
        } else {
          copy.progressValue = Math.min(totalPurchases, 25);
        }
      }
      return copy;
    });
  }, [milestones]);

  // Build merch bounties with real data
  const merchBounties = useMemo(() => {
    const totalMerch = merchData?.total_merch_purchases ?? 0;
    const firstDone = merchData?.first_merch_completed ?? false;
    const totalMerchDrip = merchData?.total_merch_drip_nctr ?? 0;

    return MERCH_BOUNTIES.map((b) => {
      const copy = { ...b };
      if (b.id === 'first-merch') {
        if (firstDone) {
          copy.completed = true;
          copy.completedLabel = 'Completed ✓';
        } else {
          copy.description = 'Shop NCTR merch to earn 5,000 NCTR.';
        }
      } else if (b.id === 'every-merch') {
        copy.subtitle = `${totalMerch} merch purchase${totalMerch !== 1 ? 's' : ''} · ${Number(totalMerchDrip).toLocaleString()} NCTR earned`;
      }
      return copy;
    });
  }, [merchData]);

  const sections: BountySection[] = useMemo(() => [
    { title: 'Get Started', emoji: '🚀', bounties: ENTRY_BOUNTIES },
    { title: 'Shop & Earn', emoji: '🛒', bounties: revenueBounties },
    { title: 'Merch Rewards', emoji: '👕', bounties: merchBounties },
    { title: 'Build Your Team', emoji: '🤝', bounties: REFERRAL_BOUNTIES },
    { title: 'Stay Active', emoji: '🔥', bounties: ENGAGEMENT_BOUNTIES },
  ], [revenueBounties, merchBounties]);

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
      {sections.map((section, sectionIdx) => (
        <div key={section.title} className="space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <span>{section.emoji}</span> {section.title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {section.bounties.map((bounty, bountyIdx) => (
              <BountyGridItem
                key={bounty.id}
                bounty={bounty}
                referralCode={referralCode}
                referralCount={stats?.totalReferrals || 0}
                showExplainer={sectionIdx === 0 && bountyIdx === 2}
                explainerDismissed={lockExplainerDismissed}
                onDismissExplainer={() => {
                  localStorage.setItem('360lock_explainer_dismissed', '1');
                  setLockExplainerDismissed(true);
                }}
              />
            ))}
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
        <a href="/how-it-works#360lock" className="text-xs font-medium hover:underline" style={{ color: '#E2FF6D' }}>
          How does this work? →
        </a>
      </div>

      {/* How It Works Banner */}
      <div
        className="rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        style={{ background: '#1a1a1a', border: '1px solid rgba(226,255,109,0.1)' }}
      >
        <div>
          <p className="text-sm font-medium text-white/80">Want to understand how this all works?</p>
        </div>
        <a
          href="/how-it-works"
          className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg shrink-0"
          style={{ backgroundColor: '#E2FF6D', color: '#111' }}
        >
          See How It Works →
        </a>
      </div>
    </div>
  );
}
