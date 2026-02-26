import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Zap, Trophy, Flame, Diamond, ChevronDown, ChevronUp,
  ShoppingCart, Users, Share2, Heart, Check, ExternalLink,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// ── TYPES ────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard';
type Category = 'shopping' | 'referral' | 'social' | 'engagement';
type BountyStatus = 'completed' | 'in_progress' | 'claim_ready' | 'not_started' | 'recurring';

interface MockBounty {
  id: string;
  emoji: string;
  title: string;
  description: string;
  nctrAmount: number;
  nctrLabel?: string;
  difficulty: Difficulty;
  category: Category;
  status: BountyStatus;
  completedDate?: string;
  progressCurrent?: number;
  progressTarget?: number;
  progressUnit?: string;
  isWide?: boolean;
  isViral?: boolean;
  capLabel?: string;
  streakDays?: boolean[];
  weekDots?: boolean[];
  specialGlow?: boolean;
  specialNote?: string;
  resetsLabel?: string;
}

// ── MOCK DATA ────────────────────────────────────────────────────────

const SHOPPING_BOUNTIES: MockBounty[] = [
  { id: 's1', emoji: '🛒', title: 'First Purchase', description: 'Make any purchase through The Garden', nctrAmount: 2500, difficulty: 'easy', category: 'shopping', status: 'completed', completedDate: 'Feb 12, 2026' },
  { id: 's2', emoji: '🧭', title: 'Brand Explorer', description: 'Shop from 3 different categories in The Garden', nctrAmount: 2500, difficulty: 'medium', category: 'shopping', status: 'in_progress', progressCurrent: 1, progressTarget: 3 },
  { id: 's3', emoji: '📅', title: 'Weekly Shopper', description: 'Make a Garden purchase 3 weeks in a row', nctrAmount: 5000, difficulty: 'hard', category: 'shopping', status: 'not_started', progressCurrent: 0, progressTarget: 3, progressUnit: 'weeks', weekDots: [false, false, false], isWide: true },
  { id: 's4', emoji: '🏅', title: '5th Purchase', description: 'Reach 5 total purchases', nctrAmount: 5000, difficulty: 'medium', category: 'shopping', status: 'not_started', progressCurrent: 0, progressTarget: 5 },
  { id: 's5', emoji: '🏆', title: '10th Purchase', description: 'Reach 10 total purchases', nctrAmount: 10000, difficulty: 'hard', category: 'shopping', status: 'not_started', progressCurrent: 0, progressTarget: 10 },
  { id: 's6', emoji: '👑', title: '25th Purchase', description: 'Reach 25 purchases, Legend status', nctrAmount: 25000, difficulty: 'hard', category: 'shopping', status: 'not_started', progressCurrent: 0, progressTarget: 25, isWide: true },
  { id: 's7', emoji: '👕', title: 'Rep the Brand', description: 'Make your first NCTR merch purchase', nctrAmount: 5000, difficulty: 'easy', category: 'shopping', status: 'not_started' },
  { id: 's8', emoji: '💧', title: 'Every Purchase Drip', description: 'Earn 250 NCTR on every Garden purchase', nctrAmount: 250, difficulty: 'easy', category: 'shopping', status: 'recurring' },
];

const REFERRAL_BOUNTIES: MockBounty[] = [
  { id: 'r1', emoji: '🤝', title: 'Invite a Friend', description: 'Friend creates an account using your link', nctrAmount: 625, difficulty: 'easy', category: 'referral', status: 'claim_ready', isViral: true },
  { id: 'r2', emoji: '💰', title: 'Revenue Referral', description: 'Friend makes their first purchase', nctrAmount: 2500, difficulty: 'medium', category: 'referral', status: 'in_progress', progressCurrent: 2, progressTarget: 5, isViral: true },
  { id: 'r3', emoji: '🫂', title: 'Squad Builder', description: 'Refer 5 friends who all make purchases', nctrAmount: 2500, difficulty: 'hard', category: 'referral', status: 'in_progress', progressCurrent: 2, progressTarget: 5, isViral: true },
  { id: 'r4', emoji: '💸', title: 'Referral Purchase Drip', description: 'Earn NCTR every time your referral shops', nctrAmount: 500, nctrLabel: '500 / 100 NCTR', difficulty: 'easy', category: 'referral', status: 'recurring', isViral: true, specialNote: '500 NCTR (Early Adopter) / 100 NCTR (standard)' },
  { id: 'r5', emoji: '🎖️', title: 'Community Captain', description: 'Refer 10+ active members', nctrAmount: 5000, difficulty: 'hard', category: 'referral', status: 'in_progress', progressCurrent: 2, progressTarget: 10, isViral: true, isWide: true },
];

const SOCIAL_BOUNTIES: MockBounty[] = [
  { id: 'so1', emoji: '📱', title: 'Follow NCTR', description: 'Follow @NCTRAlliance on X and Instagram', nctrAmount: 250, difficulty: 'easy', category: 'social', status: 'completed', completedDate: 'Feb 10, 2026' },
  { id: 'so2', emoji: '📣', title: 'Share the Mission', description: 'Share a post about NCTR on any platform', nctrAmount: 250, difficulty: 'easy', category: 'social', status: 'not_started', capLabel: 'Cap: 4/month' },
  { id: 'so3', emoji: '🎬', title: 'Content Creator', description: 'Create original content about the participation economy', nctrAmount: 2000, difficulty: 'medium', category: 'social', status: 'not_started', specialNote: 'Manual review required', isWide: true },
];

const ENGAGEMENT_BOUNTIES: MockBounty[] = [
  { id: 'e1', emoji: '👋', title: 'Welcome Aboard', description: 'Create your Crescendo account', nctrAmount: 625, difficulty: 'easy', category: 'engagement', status: 'completed', completedDate: 'Jan 15, 2026' },
  { id: 'e2', emoji: '🏛️', title: 'Founding 111', description: 'Be among the first 111 members to join AND make a purchase', nctrAmount: 1250, difficulty: 'medium', category: 'engagement', status: 'in_progress', progressCurrent: 47, progressTarget: 111, isWide: true, specialGlow: true, specialNote: '64 spots remaining' },
  { id: 'e3', emoji: '🔒', title: 'First Commit', description: 'Make your first 90LOCK commitment', nctrAmount: 500, difficulty: 'medium', category: 'engagement', status: 'completed', completedDate: 'Jan 28, 2026' },
  { id: 'e4', emoji: '⬆️', title: 'Level Up', description: 'Upgrade from 90LOCK to 360LOCK', nctrAmount: 500, difficulty: 'hard', category: 'engagement', status: 'not_started' },
  { id: 'e5', emoji: '🔥', title: 'Daily Check-in', description: 'Visit Crescendo 7 days in a row', nctrAmount: 500, difficulty: 'medium', category: 'engagement', status: 'in_progress', progressCurrent: 5, progressTarget: 7, streakDays: [true, true, true, true, true, false, false] },
  { id: 'e6', emoji: '🏅', title: 'Monthly Leaderboard', description: 'Finish in the Top 10 earners this month', nctrAmount: 5000, difficulty: 'hard', category: 'engagement', status: 'not_started', resetsLabel: 'Resets monthly' },
];

const ALL_BOUNTIES: Record<Category, MockBounty[]> = {
  shopping: SHOPPING_BOUNTIES,
  referral: REFERRAL_BOUNTIES,
  social: SOCIAL_BOUNTIES,
  engagement: ENGAGEMENT_BOUNTIES,
};

const CATEGORIES: { key: Category; label: string; icon: React.ElementType }[] = [
  { key: 'shopping', label: 'Shopping', icon: ShoppingCart },
  { key: 'referral', label: 'Referral', icon: Users },
  { key: 'social', label: 'Social', icon: Share2 },
  { key: 'engagement', label: 'Engagement', icon: Heart },
];

const COMPLETED_HISTORY = [
  { emoji: '👋', title: 'Welcome Aboard', date: 'Jan 15, 2026', amount: 625 },
  { emoji: '🔒', title: 'First Commit', date: 'Jan 28, 2026', amount: 500 },
  { emoji: '📱', title: 'Follow NCTR', date: 'Feb 10, 2026', amount: 250 },
  { emoji: '🛒', title: 'First Purchase', date: 'Feb 12, 2026', amount: 2500 },
];

// ── MOCK USER STATS ──────────────────────────────────────────────────
const MOCK_STATS = { balance: 3875, completed: 4, total: 24, streak: 5, tier: 'Silver' as const };
const TIER_COLORS: Record<string, string> = { Bronze: '#CD7F32', Silver: '#C0C0C0', Gold: '#FFD700', Platinum: '#E5E4E2', Diamond: '#B9F2FF' };

// ── DIFFICULTY CONFIG ────────────────────────────────────────────────
const DIFF_STYLES: Record<Difficulty, { bg: string; color: string }> = {
  easy: { bg: 'rgba(226, 255, 109, 0.2)', color: '#E2FF6D' },
  medium: { bg: 'rgba(250, 204, 21, 0.2)', color: '#FACC15' },
  hard: { bg: 'rgba(255, 68, 68, 0.2)', color: '#FF4444' },
};

// ── PROGRESS RING ────────────────────────────────────────────────────
function ProgressRing({ percent }: { percent: number }) {
  const r = 18; const c = 2 * Math.PI * r;
  const [offset, setOffset] = useState(c);
  useEffect(() => {
    const t = setTimeout(() => setOffset(c - (c * percent) / 100), 100);
    return () => clearTimeout(t);
  }, [percent, c]);
  return (
    <div className="relative w-11 h-11 shrink-0">
      <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle cx="22" cy="22" r={r} fill="none" stroke="#E2FF6D" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.3s ease', filter: 'drop-shadow(0 0 4px rgba(226,255,109,0.5))' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-bold leading-none" style={{ color: '#E2FF6D', fontFamily: "'DM Mono', monospace" }}>{percent}%</span>
        <span className="text-[7px] uppercase" style={{ color: '#5A5A58' }}>Done</span>
      </div>
    </div>
  );
}

// ── BOUNTY CARD ──────────────────────────────────────────────────────
function BountyCard({ bounty, expanded, onToggle }: { bounty: MockBounty; expanded: boolean; onToggle: () => void }) {
  const isCompleted = bounty.status === 'completed';
  const isClaimReady = bounty.status === 'claim_ready';
  const isInProgress = bounty.status === 'in_progress';

  const cardStyle: React.CSSProperties = {
    background: isCompleted
      ? 'radial-gradient(ellipse at top left, rgba(226,255,109,0.06), rgba(50,50,50,0.6) 60%)'
      : 'rgba(50, 50, 50, 0.6)',
    border: isClaimReady
      ? '1px solid rgba(226, 255, 109, 0.3)'
      : bounty.specialGlow
      ? '1px solid rgba(226, 255, 109, 0.4)'
      : '1px solid rgba(226, 255, 109, 0.15)',
    backdropFilter: 'blur(10px)',
    boxShadow: isClaimReady
      ? '0 0 0 1px rgba(226,255,109,0.15)'
      : bounty.specialGlow
      ? '0 0 16px rgba(226,255,109,0.12), 0 0 0 1px rgba(226,255,109,0.2)'
      : 'none',
    fontFamily: "'DM Sans', sans-serif",
  };

  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div
      className={`rounded-xl cursor-pointer transition-all duration-300 hover:border-[rgba(226,255,109,0.4)] ${bounty.isWide ? 'col-span-full' : ''}`}
      style={cardStyle}
      onClick={onToggle}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Emoji icon box */}
        <div
          className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center shrink-0 text-xl"
          style={{
            background: isCompleted ? 'rgba(226,255,109,0.12)' : isInProgress ? 'rgba(226,255,109,0.08)' : 'rgba(42,42,42,1)',
            border: isCompleted ? '1px solid rgba(226,255,109,0.2)' : '1px solid rgba(255,255,255,0.10)',
          }}
        >
          {bounty.emoji}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-sm text-white leading-tight">{bounty.title}</h3>
            <span className="shrink-0 font-bold text-sm" style={{ color: '#E2FF6D', fontFamily: "'DM Mono', monospace" }}>
              {bounty.nctrLabel || `${bounty.nctrAmount.toLocaleString()} NCTR`}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: '#5A5A58' }}>{bounty.description}</p>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
              style={{ background: DIFF_STYLES[bounty.difficulty].bg, color: DIFF_STYLES[bounty.difficulty].color }}>
              {bounty.difficulty}
            </span>
            {bounty.isViral && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(226,255,109,0.12)', color: '#E2FF6D' }}>
                Earns more bounties
              </span>
            )}
            {bounty.capLabel && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: '#5A5A58' }}>{bounty.capLabel}</span>}
            {bounty.resetsLabel && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: '#5A5A58' }}>{bounty.resetsLabel}</span>}

            {/* Status badge */}
            {isCompleted && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ml-auto"
                style={{ background: 'rgba(226,255,109,0.15)', color: '#E2FF6D' }}>
                <Check className="w-3 h-3" /> Completed
              </span>
            )}
            {isInProgress && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto"
                style={{ background: 'rgba(250,204,21,0.12)', color: '#FACC15' }}>
                In Progress
              </span>
            )}
            {bounty.status === 'recurring' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto"
                style={{ background: 'rgba(226,255,109,0.12)', color: '#E2FF6D' }}>
                Recurring
              </span>
            )}
            {isClaimReady && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto animate-pulse"
                style={{ background: 'rgba(226,255,109,0.2)', color: '#E2FF6D' }}>
                Claim Ready!
              </span>
            )}
          </div>

          {/* Progress bar */}
          {bounty.progressTarget && bounty.progressTarget > 0 && !bounty.streakDays && !bounty.weekDots && (
            <div className="mt-2.5">
              <div className="flex justify-between text-[10px] mb-1">
                <span style={{ color: '#5A5A58' }}>{bounty.progressCurrent}/{bounty.progressTarget} {bounty.progressUnit || ''}</span>
                {bounty.specialNote && <span style={{ color: '#E2FF6D' }}>{bounty.specialNote}</span>}
              </div>
              <div className="h-[5px] rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${((bounty.progressCurrent || 0) / bounty.progressTarget) * 100}%`,
                    background: 'linear-gradient(90deg, #E2FF6D, #C8FF3C)',
                    boxShadow: '0 0 8px rgba(226,255,109,0.5)',
                  }} />
              </div>
            </div>
          )}

          {/* Week dots */}
          {bounty.weekDots && (
            <div className="flex gap-2 mt-2.5">
              {bounty.weekDots.map((filled, i) => (
                <div key={i} className="w-6 h-2 rounded-full" style={{
                  background: filled ? '#E2FF6D' : 'rgba(255,255,255,0.07)',
                  boxShadow: filled ? '0 0 6px rgba(226,255,109,0.4)' : 'none',
                }} />
              ))}
            </div>
          )}

          {/* Streak day dots */}
          {bounty.streakDays && (
            <div className="flex items-center gap-1.5 mt-2.5">
              {DAY_LABELS.map((label, i) => {
                const filled = bounty.streakDays![i];
                const isToday = i === (bounty.progressCurrent || 0) - 1;
                return (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold"
                      style={{
                        background: filled ? 'rgba(226,255,109,0.12)' : 'rgba(255,255,255,0.04)',
                        color: filled ? '#E2FF6D' : '#5A5A58',
                        boxShadow: isToday ? '0 0 8px rgba(226,255,109,0.4)' : 'none',
                        border: isToday ? '1px solid rgba(226,255,109,0.4)' : '1px solid transparent',
                      }}>
                      {label}
                    </div>
                  </div>
                );
              })}
              <span className="text-base ml-1">🔥</span>
            </div>
          )}

          {/* Completed date with shimmer */}
          {isCompleted && bounty.completedDate && (
            <div className="flex items-center gap-1.5 mt-2.5">
              <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center" style={{ background: '#E2FF6D', border: '1.5px solid #E2FF6D' }}>
                <Check className="w-3 h-3" style={{ color: '#323232' }} />
              </div>
              <span className="text-[11px] font-medium bg-clip-text text-transparent animate-shimmer"
                style={{ backgroundImage: 'linear-gradient(90deg, #E2FF6D 0%, #fff 50%, #E2FF6D 100%)', backgroundSize: '200% 100%' }}>
                Completed — {bounty.completedDate}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-white/5 animate-fade-in">
          <div className="mt-3 space-y-3">
            <p className="text-xs leading-relaxed" style={{ color: '#D9D9D9' }}>{bounty.description}</p>
            {bounty.specialNote && !bounty.progressTarget && (
              <div className="rounded-lg p-3" style={{ background: 'rgba(30,30,30,1)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[11px]" style={{ color: '#5A5A58' }}>{bounty.specialNote}</p>
              </div>
            )}
            {bounty.id === 'e2' && (
              <div className="rounded-lg p-3" style={{ background: 'rgba(30,30,30,1)', border: '1px solid rgba(226,255,109,0.1)' }}>
                <p className="text-[11px] leading-relaxed" style={{ color: '#D9D9D9' }}>
                  Sign up AND make your first purchase to claim your Founding spot. Early Adopters earn 5X referral rewards for the first 6 months. Once 111 spots fill, this closes forever.
                </p>
              </div>
            )}
            {/* CTA */}
            {isClaimReady && (
              <button className="w-full py-2.5 rounded-xl text-sm font-extrabold transition-transform hover:scale-[1.03]"
                style={{ background: '#E2FF6D', color: '#323232', boxShadow: '0 0 16px rgba(226,255,109,0.3)' }}>
                Claim {bounty.nctrAmount.toLocaleString()} NCTR
              </button>
            )}
            {bounty.status === 'not_started' && bounty.category === 'shopping' && (
              <a href="https://thegarden.nctr.live" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-extrabold transition-transform hover:scale-[1.03]"
                style={{ background: '#E2FF6D', color: '#323232' }}>
                Start Shopping <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {isInProgress && (
              <button className="w-full py-2.5 rounded-xl text-sm font-semibold opacity-50 cursor-not-allowed"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#5A5A58' }} disabled>
                In Progress
              </button>
            )}
            {isCompleted && (
              <button className="w-full py-2.5 rounded-xl text-sm font-semibold opacity-40 cursor-not-allowed"
                style={{ background: 'rgba(255,255,255,0.04)', color: '#5A5A58' }} disabled>
                Completed
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN PAGE ────────────────────────────────────────────────────────

export default function BountyBoardPage() {
  const [activeTab, setActiveTab] = useState<Category>('shopping');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const bounties = ALL_BOUNTIES[activeTab];
  const completionPercent = Math.round((MOCK_STATS.completed / MOCK_STATS.total) * 100);

  const categoryCounts = useMemo(() => {
    const counts: Record<Category, number> = { shopping: 0, referral: 0, social: 0, engagement: 0 };
    for (const [cat, list] of Object.entries(ALL_BOUNTIES)) counts[cat as Category] = list.length;
    return counts;
  }, []);

  const handleToggle = (id: string) => setExpandedId(prev => (prev === id ? null : id));

  return (
    <div className="min-h-screen pb-28" style={{ background: '#323232', fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── STICKY HEADER ─────────────────────────────── */}
      <div className="sticky top-0 z-50" style={{ background: 'rgba(50, 50, 50, 0.88)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-3xl mx-auto px-4">
          {/* Top row */}
          <div className="flex items-center justify-between py-3">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <img src="/nctr-n-lime.svg" alt="NCTR" className="w-6 h-6" />
                Bounty Board
              </h1>
              <p className="text-[11px] uppercase tracking-widest" style={{ color: '#5A5A58' }}>Crescendo Rewards</p>
            </div>
            <ProgressRing percent={completionPercent} />
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-0 overflow-x-auto no-scrollbar py-2 -mx-4 px-4">
            {[
              { icon: <Zap className="w-3.5 h-3.5" style={{ color: '#E2FF6D' }} />, value: MOCK_STATS.balance.toLocaleString(), label: 'Your NCTR', color: '#E2FF6D' },
              { icon: <Trophy className="w-3.5 h-3.5 text-white" />, value: `${MOCK_STATS.completed}/${MOCK_STATS.total}`, label: 'Completed', color: '#fff' },
              { icon: <Flame className="w-3.5 h-3.5" style={{ color: MOCK_STATS.streak > 0 ? '#E2FF6D' : '#5A5A58' }} />, value: String(MOCK_STATS.streak), label: 'Day Streak', color: MOCK_STATS.streak > 0 ? '#E2FF6D' : '#5A5A58' },
              { icon: <Diamond className="w-3.5 h-3.5" style={{ color: TIER_COLORS[MOCK_STATS.tier] }} />, value: MOCK_STATS.tier, label: 'Tier', color: TIER_COLORS[MOCK_STATS.tier] },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-0">
                {i > 0 && <div className="w-px h-5 mx-3 shrink-0" style={{ background: 'rgba(255,255,255,0.10)' }} />}
                <div className="flex items-center gap-1.5 shrink-0">
                  {stat.icon}
                  <div>
                    <span className="text-xs font-bold" style={{ color: stat.color, fontFamily: "'DM Mono', monospace" }}>{stat.value}</span>
                    <span className="text-[9px] ml-1" style={{ color: '#5A5A58' }}>{stat.label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Category tabs */}
          <div ref={tabsRef} className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
            {CATEGORIES.map(cat => {
              const isActive = activeTab === cat.key;
              return (
                <button key={cat.key}
                  onClick={() => { setActiveTab(cat.key); setExpandedId(null); }}
                  className="relative flex items-center gap-1.5 px-3 py-2 text-sm font-semibold shrink-0 transition-colors"
                  style={{ color: isActive ? '#E2FF6D' : '#5A5A58', background: isActive ? 'rgba(226,255,109,0.06)' : 'transparent', borderRadius: '8px 8px 0 0' }}>
                  {cat.label}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: isActive ? 'rgba(226,255,109,0.15)' : 'rgba(255,255,255,0.06)', color: isActive ? '#E2FF6D' : '#5A5A58' }}>
                    {categoryCounts[cat.key]}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-[15%] right-[15%] h-[2.5px] rounded-full"
                      style={{ background: '#E2FF6D', boxShadow: '0 0 6px rgba(226,255,109,0.5)' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── BOUNTY CARDS ──────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {bounties.map((b, i) => (
            <div key={b.id} className={`${b.isWide ? 'col-span-full' : ''} animate-fade-in`}
              style={{ animationDelay: `${i * 0.06}s`, animationFillMode: 'both' }}>
              <BountyCard bounty={b} expanded={expandedId === b.id} onToggle={() => handleToggle(b.id)} />
            </div>
          ))}
        </div>

        {/* ── STREAK BANNER ─────────────────────────────── */}
        {MOCK_STATS.streak > 0 && (
          <div className="mt-4 rounded-xl p-4 flex items-center gap-4"
            style={{ background: 'rgba(50,50,50,0.6)', border: '1px solid rgba(255, 150, 50, 0.15)', boxShadow: '0 0 30px rgba(226,255,109,0.06)' }}>
            <span className="text-[28px] shrink-0">🔥</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm" style={{ color: '#E2FF6D' }}>{MOCK_STATS.streak}-day streak!</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#5A5A58' }}>Come back tomorrow to keep it alive and unlock bonus multipliers.</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[28px] font-bold leading-none" style={{ color: '#E2FF6D', fontFamily: "'DM Mono', monospace" }}>{MOCK_STATS.streak}</span>
              <p className="text-[9px] uppercase" style={{ color: '#5A5A58' }}>Days</p>
            </div>
          </div>
        )}

        {/* ── BOUNTY HISTORY ──────────────────────────── */}
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen} className="mt-6">
          <CollapsibleTrigger className="w-full">
            <div className="rounded-xl p-4 flex items-center justify-between cursor-pointer transition-colors"
              style={{ background: 'rgba(50,50,50,0.6)', border: '1px solid rgba(226,255,109,0.1)' }}>
              <div>
                <h3 className="text-sm font-bold text-white">Your Bounty History</h3>
                <p className="text-[11px]" style={{ color: '#5A5A58' }}>{COMPLETED_HISTORY.length} completed bounties</p>
              </div>
              <div className="transition-transform duration-200" style={{ transform: historyOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <ChevronDown className="w-5 h-5" style={{ color: '#5A5A58' }} />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 rounded-xl overflow-hidden" style={{ background: 'rgba(50,50,50,0.4)', border: '1px solid rgba(226,255,109,0.08)' }}>
              {COMPLETED_HISTORY.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-fade-in"
                  style={{ borderBottom: i < COMPLETED_HISTORY.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', animationDelay: `${i * 0.08}s` }}>
                  <span className="text-base">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-white">{item.title}</span>
                    <span className="text-[10px] ml-2" style={{ color: '#5A5A58' }}>{item.date}</span>
                  </div>
                  <span className="text-xs font-bold shrink-0" style={{ color: '#E2FF6D', fontFamily: "'DM Mono', monospace" }}>
                    +{item.amount.toLocaleString()} NCTR
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ── FOOTER ──────────────────────────────────── */}
        <div className="mt-10 mb-4 text-center">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: '#5A5A58' }}>
            Powered by <span className="font-bold" style={{ color: '#E2FF6D' }}>NCTR Alliance</span> · Crescendo Rewards
          </p>
        </div>
      </div>

      {/* ── BOTTOM STICKY BAR ─────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50" style={{ background: 'rgba(50, 50, 50, 0.92)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(226,255,109,0.1)' }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(226,255,109,0.1)' }}>
              <Zap className="w-4 h-4" style={{ color: '#E2FF6D' }} />
            </div>
            <div>
              <span className="text-sm font-bold" style={{ color: '#E2FF6D', fontFamily: "'DM Mono', monospace" }}>{MOCK_STATS.balance.toLocaleString()} NCTR</span>
              <p className="text-[9px] uppercase" style={{ color: '#5A5A58' }}>Your Balance</p>
            </div>
          </div>
          <div className="text-center hidden sm:block">
            <p className="text-[9px] uppercase" style={{ color: '#5A5A58' }}>Next reward</p>
            <p className="text-xs font-bold text-white">625 NCTR ready</p>
          </div>
          <button className="px-5 py-2.5 rounded-[14px] text-sm font-extrabold transition-all hover:scale-[1.03]"
            style={{ background: '#E2FF6D', color: '#323232', boxShadow: '0 0 12px rgba(226,255,109,0.3)' }}>
            Claim Now
          </button>
        </div>
      </div>

      {/* ── SHIMMER ANIMATION ─────────────────────────── */}
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .animate-shimmer { animation: shimmer 3s linear infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
