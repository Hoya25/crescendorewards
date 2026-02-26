import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Zap, Trophy, Flame, Diamond, ChevronDown, ChevronUp,
  ShoppingCart, Users, Share2, Heart, Check, ExternalLink,
  Sun, Moon,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { useTheme } from '@/components/ThemeProvider';

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
  tag?: string;
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
  { id: 'e2', emoji: '⭐', title: 'Early Adopter Bonus', description: 'Joined during our launch period? Extra NCTR for being here early.', nctrAmount: 1250, difficulty: 'easy', category: 'engagement', status: 'completed', completedDate: 'Jan 15, 2026', tag: 'LIMITED TIME' },
  { id: 'e3', emoji: '🔒', title: 'First Commit', description: 'Make your first 90LOCK commitment', nctrAmount: 500, difficulty: 'medium', category: 'engagement', status: 'completed', completedDate: 'Jan 28, 2026' },
  { id: 'e4', emoji: '⬆️', title: 'Level Up', description: 'Upgrade from 90LOCK to 360LOCK', nctrAmount: 500, difficulty: 'hard', category: 'engagement', status: 'not_started' },
  { id: 'e5', emoji: '🔥', title: 'Daily Check-in', description: 'Visit Crescendo 7 days in a row', nctrAmount: 500, difficulty: 'medium', category: 'engagement', status: 'in_progress', progressCurrent: 5, progressTarget: 7, streakDays: [true, true, true, true, true, false, false] },
  { id: 'e6', emoji: '🏅', title: 'Monthly Leaderboard', description: 'Finish in the Top 10 earners this month', nctrAmount: 5000, difficulty: 'hard', category: 'engagement', status: 'not_started', resetsLabel: 'Resets monthly' },
];

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

// ── THEME-AWARE TOKENS ──────────────────────────────────────────────
function useTokens() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  return useMemo(() => ({
    dark,
    pageBg: dark ? '#323232' : '#F5F5F0',
    headerBg: dark ? 'rgba(50, 50, 50, 0.88)' : 'rgba(245, 245, 240, 0.88)',
    headerBorder: dark ? 'none' : '1px solid #D9D9D9',
    bottomBarBg: dark ? 'rgba(50, 50, 50, 0.92)' : 'rgba(245, 245, 240, 0.92)',
    bottomBarBorder: dark ? '1px solid rgba(226,255,109,0.1)' : '1px solid #D9D9D9',
    cardBg: dark ? 'rgba(50, 50, 50, 0.6)' : '#FFFFFF',
    cardBorder: dark ? '1px solid rgba(226,255,109,0.15)' : '1px solid #D9D9D9',
    cardBorderHover: dark ? 'rgba(226,255,109,0.4)' : '#5A5A58',
    cardShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
    cardCompletedBg: dark
      ? 'radial-gradient(ellipse at top left, rgba(226,255,109,0.06), rgba(50,50,50,0.6) 60%)'
      : '#FFFFFF',
    cardClaimBorder: dark ? '1px solid rgba(226,255,109,0.3)' : '1px solid #E2FF6D',
    textPrimary: dark ? '#FFFFFF' : '#323232',
    textSecondary: '#5A5A58',
    textMuted: '#5A5A58',
    lime: '#E2FF6D',
    // In light mode, lime accent text on amounts — still use lime for mono numbers
    amountColor: dark ? '#E2FF6D' : '#323232',
    amountAccent: '#E2FF6D', // used for lime-on-dark contexts
    // CTA colors
    ctaBg: dark ? '#E2FF6D' : '#323232',
    ctaText: dark ? '#323232' : '#FFFFFF',
    ctaHoverBg: dark ? '#C8FF3C' : '#5A5A58',
    // Claim Now button
    claimBg: dark ? '#E2FF6D' : '#323232',
    claimText: dark ? '#323232' : '#E2FF6D',
    claimShadow: dark ? '0 0 12px rgba(226,255,109,0.3)' : '0 1px 4px rgba(0,0,0,0.12)',
    // Difficulty badges
    diffEasy: dark
      ? { bg: 'rgba(226, 255, 109, 0.2)', color: '#E2FF6D' }
      : { bg: 'rgba(50, 50, 50, 0.08)', color: '#323232' },
    diffMedium: dark
      ? { bg: 'rgba(250, 204, 21, 0.2)', color: '#FACC15' }
      : { bg: 'rgba(250, 204, 21, 0.15)', color: '#B8860B' },
    diffHard: dark
      ? { bg: 'rgba(255, 68, 68, 0.2)', color: '#FF4444' }
      : { bg: 'rgba(255, 68, 68, 0.12)', color: '#CC0000' },
    // Progress bar
    progressTrack: dark ? 'rgba(255,255,255,0.07)' : '#D9D9D9',
    progressRingTrack: dark ? 'rgba(255,255,255,0.08)' : '#D9D9D9',
    // Emoji icon box
    iconBoxBg: dark ? 'rgba(42,42,42,1)' : 'rgba(0,0,0,0.04)',
    iconBoxBorder: dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid #D9D9D9',
    iconBoxCompletedBg: dark ? 'rgba(226,255,109,0.12)' : 'rgba(226,255,109,0.12)',
    iconBoxCompletedBorder: dark ? '1px solid rgba(226,255,109,0.2)' : '1px solid rgba(226,255,109,0.3)',
    // Misc
    divider: dark ? 'rgba(255,255,255,0.10)' : '#D9D9D9',
    tabActiveBg: dark ? 'rgba(226,255,109,0.06)' : 'rgba(50,50,50,0.06)',
    tabCountBg: dark ? 'rgba(226,255,109,0.15)' : 'rgba(50,50,50,0.08)',
    tabCountInactiveBg: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    historyRowBorder: dark ? '1px solid rgba(255,255,255,0.04)' : '1px solid #D9D9D9',
    specialNoteBg: dark ? 'rgba(30,30,30,1)' : 'rgba(0,0,0,0.03)',
    specialNoteBorder: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #D9D9D9',
    inProgressBg: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    expandedBorder: dark ? 'border-white/5' : 'border-[#D9D9D9]',
    expandedDescColor: dark ? '#D9D9D9' : '#5A5A58',
    streakBannerBg: dark ? 'rgba(50,50,50,0.6)' : '#FFFFFF',
    streakBannerBorder: dark ? '1px solid rgba(255, 150, 50, 0.15)' : '1px solid #D9D9D9',
    streakTextColor: dark ? '#E2FF6D' : '#323232',
    streakNumberColor: dark ? '#E2FF6D' : '#E2FF6D',
    footerBrandColor: dark ? '#E2FF6D' : '#323232',
    badgeLimeBg: dark ? 'rgba(226,255,109,0.12)' : 'rgba(226,255,109,0.15)',
    badgeLimeColor: dark ? '#E2FF6D' : '#5A8A00',
    claimReadyBadgeBg: dark ? 'rgba(226,255,109,0.2)' : 'rgba(226,255,109,0.2)',
    claimReadyBadgeColor: dark ? '#E2FF6D' : '#5A8A00',
    completedBadgeBg: dark ? 'rgba(226,255,109,0.15)' : 'rgba(50,50,50,0.08)',
    completedBadgeColor: dark ? '#E2FF6D' : '#323232',
    inProgressBadgeBg: dark ? 'rgba(250,204,21,0.12)' : 'rgba(250,204,21,0.15)',
    inProgressBadgeColor: dark ? '#FACC15' : '#B8860B',
    weekDotEmpty: dark ? 'rgba(255,255,255,0.07)' : '#D9D9D9',
    streakDayEmptyBg: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    streakDayFilledBg: dark ? 'rgba(226,255,109,0.12)' : 'rgba(226,255,109,0.15)',
    streakDayFilledColor: dark ? '#E2FF6D' : '#5A8A00',
    checkCircleBg: dark ? '#E2FF6D' : '#E2FF6D',
  }), [dark]);
}

// ── PROGRESS RING ────────────────────────────────────────────────────
function ProgressRing({ percent, tokens }: { percent: number; tokens: ReturnType<typeof useTokens> }) {
  const r = 18; const c = 2 * Math.PI * r;
  const [offset, setOffset] = useState(c);
  useEffect(() => {
    const t = setTimeout(() => setOffset(c - (c * percent) / 100), 100);
    return () => clearTimeout(t);
  }, [percent, c]);
  return (
    <div className="relative w-11 h-11 shrink-0">
      <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke={tokens.progressRingTrack} strokeWidth="3" />
        <circle cx="22" cy="22" r={r} fill="none" stroke="#E2FF6D" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.3s ease', filter: 'drop-shadow(0 0 4px rgba(226,255,109,0.5))' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-bold leading-none" style={{ color: '#E2FF6D', fontFamily: "'DM Mono', monospace" }}>{percent}%</span>
        <span className="text-[7px] uppercase" style={{ color: tokens.textMuted }}>Done</span>
      </div>
    </div>
  );
}

// ── THEME TOGGLE BUTTON (inline for bounty header) ───────────────────
function BountyThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-full flex items-center justify-center transition-colors no-min-touch"
      style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div style={{ transition: 'transform 0.3s ease', transform: isDark ? 'rotate(0deg)' : 'rotate(180deg)' }}>
        {isDark
          ? <Moon className="w-[18px] h-[18px]" style={{ color: '#E2FF6D' }} />
          : <Sun className="w-[18px] h-[18px]" style={{ color: '#323232' }} />
        }
      </div>
    </button>
  );
}

// ── BOUNTY CARD ──────────────────────────────────────────────────────
function BountyCard({ bounty, expanded, onToggle, onClaim, tokens }: {
  bounty: MockBounty; expanded: boolean; onToggle: () => void; onClaim: (bounty: MockBounty) => void;
  tokens: ReturnType<typeof useTokens>;
}) {
  const isCompleted = bounty.status === 'completed';
  const isClaimReady = bounty.status === 'claim_ready';
  const isInProgress = bounty.status === 'in_progress';

  const diffStyles = {
    easy: tokens.diffEasy,
    medium: tokens.diffMedium,
    hard: tokens.diffHard,
  };

  const cardStyle: React.CSSProperties = {
    background: isCompleted ? tokens.cardCompletedBg : tokens.cardBg,
    border: isClaimReady ? tokens.cardClaimBorder
      : bounty.specialGlow ? (tokens.dark ? '1px solid rgba(226,255,109,0.4)' : '1px solid #E2FF6D')
      : tokens.cardBorder,
    backdropFilter: tokens.dark ? 'blur(10px)' : 'none',
    boxShadow: isClaimReady
      ? (tokens.dark ? '0 0 0 1px rgba(226,255,109,0.15)' : '0 0 0 1px rgba(226,255,109,0.2), 0 1px 3px rgba(0,0,0,0.08)')
      : bounty.specialGlow
      ? (tokens.dark ? '0 0 16px rgba(226,255,109,0.12), 0 0 0 1px rgba(226,255,109,0.2)' : '0 0 8px rgba(226,255,109,0.1), 0 1px 3px rgba(0,0,0,0.08)')
      : tokens.cardShadow,
    fontFamily: "'DM Sans', sans-serif",
  };

  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div
      className={`rounded-xl cursor-pointer transition-all duration-300 ${bounty.isWide ? 'col-span-full' : ''}`}
      style={cardStyle}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = tokens.cardBorderHover; }}
      onMouseLeave={e => {
        const border = isClaimReady ? (tokens.dark ? 'rgba(226,255,109,0.3)' : '#E2FF6D')
          : bounty.specialGlow ? (tokens.dark ? 'rgba(226,255,109,0.4)' : '#E2FF6D')
          : (tokens.dark ? 'rgba(226,255,109,0.15)' : '#D9D9D9');
        (e.currentTarget as HTMLElement).style.borderColor = border;
      }}
      onClick={onToggle}
    >
      <div className="p-4 flex items-start gap-3">
        <div
          className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center shrink-0 text-xl"
          style={{
            background: isCompleted ? tokens.iconBoxCompletedBg : isInProgress ? (tokens.dark ? 'rgba(226,255,109,0.08)' : 'rgba(226,255,109,0.06)') : tokens.iconBoxBg,
            border: isCompleted ? tokens.iconBoxCompletedBorder : tokens.iconBoxBorder,
          }}
        >
          {bounty.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-sm leading-tight" style={{ color: tokens.textPrimary }}>{bounty.title}</h3>
            <span className="shrink-0 font-bold text-sm" style={{ color: tokens.amountColor, fontFamily: "'DM Mono', monospace" }}>
              {bounty.nctrLabel || `${bounty.nctrAmount.toLocaleString()} NCTR`}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: tokens.textSecondary }}>{bounty.description}</p>

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
              style={{ background: diffStyles[bounty.difficulty].bg, color: diffStyles[bounty.difficulty].color }}>
              {bounty.difficulty}
            </span>
            {bounty.isViral && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: tokens.badgeLimeBg, color: tokens.badgeLimeColor }}>
                Earns more bounties
              </span>
            )}
            {bounty.tag && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: tokens.dark ? 'rgba(226,255,109,0.2)' : 'rgba(226,255,109,0.15)', color: tokens.badgeLimeColor }}>
                {bounty.tag}
              </span>
            )}
            {bounty.capLabel && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: tokens.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: tokens.textMuted }}>{bounty.capLabel}</span>}
            {bounty.resetsLabel && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: tokens.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: tokens.textMuted }}>{bounty.resetsLabel}</span>}

            {isCompleted && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ml-auto"
                style={{ background: tokens.completedBadgeBg, color: tokens.completedBadgeColor }}>
                <Check className="w-3 h-3" /> Completed
              </span>
            )}
            {isInProgress && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto"
                style={{ background: tokens.inProgressBadgeBg, color: tokens.inProgressBadgeColor }}>
                In Progress
              </span>
            )}
            {bounty.status === 'recurring' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto"
                style={{ background: tokens.badgeLimeBg, color: tokens.badgeLimeColor }}>
                Recurring
              </span>
            )}
            {isClaimReady && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto animate-pulse"
                style={{ background: tokens.claimReadyBadgeBg, color: tokens.claimReadyBadgeColor }}>
                Claim Ready!
              </span>
            )}
          </div>

          {bounty.progressTarget && bounty.progressTarget > 0 && !bounty.streakDays && !bounty.weekDots && (
            <div className="mt-2.5">
              <div className="flex justify-between text-[10px] mb-1">
                <span style={{ color: tokens.textMuted }}>{bounty.progressCurrent}/{bounty.progressTarget} {bounty.progressUnit || ''}</span>
                {bounty.specialNote && <span style={{ color: tokens.badgeLimeColor }}>{bounty.specialNote}</span>}
              </div>
              <div className="h-[5px] rounded-full" style={{ background: tokens.progressTrack }}>
                <div className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${((bounty.progressCurrent || 0) / bounty.progressTarget) * 100}%`,
                    background: 'linear-gradient(90deg, #E2FF6D, #C8FF3C)',
                    boxShadow: '0 0 8px rgba(226,255,109,0.5)',
                  }} />
              </div>
            </div>
          )}

          {bounty.weekDots && (
            <div className="flex gap-2 mt-2.5">
              {bounty.weekDots.map((filled, i) => (
                <div key={i} className="w-6 h-2 rounded-full" style={{
                  background: filled ? '#E2FF6D' : tokens.weekDotEmpty,
                  boxShadow: filled ? '0 0 6px rgba(226,255,109,0.4)' : 'none',
                }} />
              ))}
            </div>
          )}

          {bounty.streakDays && (
            <div className="flex items-center gap-1.5 mt-2.5">
              {DAY_LABELS.map((label, i) => {
                const filled = bounty.streakDays![i];
                const isToday = i === (bounty.progressCurrent || 0) - 1;
                return (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold"
                      style={{
                        background: filled ? tokens.streakDayFilledBg : tokens.streakDayEmptyBg,
                        color: filled ? tokens.streakDayFilledColor : tokens.textMuted,
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

          {isCompleted && bounty.completedDate && (
            <div className="flex items-center gap-1.5 mt-2.5">
              <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center" style={{ background: tokens.checkCircleBg, border: '1.5px solid #E2FF6D' }}>
                <Check className="w-3 h-3" style={{ color: '#323232' }} />
              </div>
              <span className="text-[11px] font-medium bg-clip-text text-transparent animate-shimmer"
                style={{ backgroundImage: tokens.dark ? 'linear-gradient(90deg, #E2FF6D 0%, #fff 50%, #E2FF6D 100%)' : 'linear-gradient(90deg, #5A8A00 0%, #323232 50%, #5A8A00 100%)', backgroundSize: '200% 100%' }}>
                Completed — {bounty.completedDate}
              </span>
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className={`px-4 pb-4 pt-0 border-t ${tokens.expandedBorder} animate-fade-in`}>
          <div className="mt-3 space-y-3">
            <p className="text-xs leading-relaxed" style={{ color: tokens.expandedDescColor }}>{bounty.description}</p>
            {bounty.specialNote && !bounty.progressTarget && (
              <div className="rounded-lg p-3" style={{ background: tokens.specialNoteBg, border: tokens.specialNoteBorder }}>
                <p className="text-[11px]" style={{ color: tokens.textMuted }}>{bounty.specialNote}</p>
              </div>
            )}
            {isClaimReady && (
              <button className="w-full py-2.5 rounded-xl text-sm font-extrabold transition-transform active:scale-[0.97]"
                onClick={(e) => { e.stopPropagation(); onClaim(bounty); }}
                style={{ background: tokens.ctaBg, color: tokens.dark ? '#323232' : '#E2FF6D', boxShadow: tokens.dark ? '0 0 16px rgba(226,255,109,0.3)' : '0 1px 4px rgba(0,0,0,0.12)' }}>
                Claim {bounty.nctrAmount.toLocaleString()} NCTR
              </button>
            )}
            {bounty.status === 'not_started' && bounty.category === 'shopping' && (
              <a href="https://thegarden.nctr.live" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-extrabold transition-transform hover:scale-[1.03]"
                style={{ background: tokens.ctaBg, color: tokens.ctaText }}>
                Start Shopping <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {isInProgress && (
              <button className="w-full py-2.5 rounded-xl text-sm font-semibold opacity-50 cursor-not-allowed"
                style={{ background: tokens.inProgressBg, color: tokens.textMuted }} disabled>
                In Progress
              </button>
            )}
            {isCompleted && (
              <button className="w-full py-2.5 rounded-xl text-sm font-semibold opacity-40 cursor-not-allowed"
                style={{ background: tokens.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', color: tokens.textMuted }} disabled>
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
  const tokens = useTokens();
  const [activeTab, setActiveTab] = useState<Category>('shopping');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [bountyData, setBountyData] = useState<Record<Category, MockBounty[]>>(() => ({
    shopping: [...SHOPPING_BOUNTIES],
    referral: [...REFERRAL_BOUNTIES],
    social: [...SOCIAL_BOUNTIES],
    engagement: [...ENGAGEMENT_BOUNTIES],
  }));
  const [balance, setBalance] = useState(MOCK_STATS.balance);
  const [completedCount, setCompletedCount] = useState(MOCK_STATS.completed);
  const [history, setHistory] = useState([...COMPLETED_HISTORY]);
  const tabsRef = useRef<HTMLDivElement>(null);
  const claimBtnRef = useRef<HTMLButtonElement>(null);

  const bounties = bountyData[activeTab];
  const totalBounties = Object.values(bountyData).reduce((s, l) => s + l.length, 0);
  const completionPercent = Math.round((completedCount / totalBounties) * 100);

  const categoryCounts = useMemo(() => {
    const counts: Record<Category, number> = { shopping: 0, referral: 0, social: 0, engagement: 0 };
    for (const [cat, list] of Object.entries(bountyData)) counts[cat as Category] = list.length;
    return counts;
  }, [bountyData]);

  const claimBounty = useCallback((bounty: MockBounty) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setBountyData(prev => {
      const updated = { ...prev };
      for (const cat of Object.keys(updated) as Category[]) {
        updated[cat] = updated[cat].map(b =>
          b.id === bounty.id ? { ...b, status: 'completed' as BountyStatus, completedDate: dateStr } : b
        );
      }
      return updated;
    });
    setBalance(prev => prev + bounty.nctrAmount);
    setCompletedCount(prev => prev + 1);
    setHistory(prev => [{ emoji: bounty.emoji, title: bounty.title, date: dateStr, amount: bounty.nctrAmount }, ...prev]);
    toast.success(`🎉 ${bounty.nctrAmount.toLocaleString()} NCTR Claimed!`, {
      style: { background: '#323232', color: '#E2FF6D', border: '1px solid rgba(226,255,109,0.3)', boxShadow: '0 0 12px rgba(226,255,109,0.15)' },
      duration: 2500,
    });
  }, []);

  const claimAll = useCallback(() => {
    const allClaimReady: MockBounty[] = [];
    for (const list of Object.values(bountyData)) {
      for (const b of list) {
        if (b.status === 'claim_ready') allClaimReady.push(b);
      }
    }
    if (allClaimReady.length === 0) {
      toast('No rewards ready to claim yet', {
        style: { background: '#323232', color: '#5A5A58', border: '1px solid rgba(255,255,255,0.1)' },
        duration: 2500,
      });
    } else {
      allClaimReady.forEach(b => claimBounty(b));
    }
    if (claimBtnRef.current) {
      claimBtnRef.current.style.transform = 'scale(0.97)';
      setTimeout(() => { if (claimBtnRef.current) claimBtnRef.current.style.transform = 'scale(1)'; }, 150);
    }
  }, [bountyData, claimBounty]);

  const nextClaimAmount = useMemo(() => {
    let total = 0;
    for (const list of Object.values(bountyData)) {
      for (const b of list) {
        if (b.status === 'claim_ready') total += b.nctrAmount;
      }
    }
    return total;
  }, [bountyData]);

  const handleToggle = (id: string) => setExpandedId(prev => (prev === id ? null : id));

  return (
    <div className="min-h-screen pb-28 transition-colors duration-300" style={{ background: tokens.pageBg, fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── STICKY HEADER ─────────────────────────────── */}
      <div className="sticky top-0 z-50 transition-colors duration-300" style={{ background: tokens.headerBg, backdropFilter: 'blur(20px)', borderBottom: tokens.headerBorder }}>
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: tokens.textPrimary }}>
                <img src="/nctr-n-lime.svg" alt="NCTR" className="w-6 h-6" />
                Bounty Board
              </h1>
              <p className="text-[11px] uppercase tracking-widest" style={{ color: tokens.textMuted }}>Crescendo Rewards</p>
            </div>
            <div className="flex items-center gap-2">
              <ProgressRing percent={completionPercent} tokens={tokens} />
              <BountyThemeToggle />
            </div>
          </div>

          <div className="flex items-center gap-0 overflow-x-auto no-scrollbar py-2 -mx-4 px-4">
            {[
              { icon: <Zap className="w-3.5 h-3.5" style={{ color: tokens.dark ? '#E2FF6D' : '#5A8A00' }} />, value: balance.toLocaleString(), label: 'Your NCTR', color: tokens.dark ? '#E2FF6D' : '#323232' },
              { icon: <Trophy className="w-3.5 h-3.5" style={{ color: tokens.textPrimary }} />, value: `${completedCount}/${totalBounties}`, label: 'Completed', color: tokens.textPrimary },
              { icon: <Flame className="w-3.5 h-3.5" style={{ color: MOCK_STATS.streak > 0 ? (tokens.dark ? '#E2FF6D' : '#5A8A00') : tokens.textMuted }} />, value: String(MOCK_STATS.streak), label: 'Day Streak', color: MOCK_STATS.streak > 0 ? (tokens.dark ? '#E2FF6D' : '#5A8A00') : tokens.textMuted },
              { icon: <Diamond className="w-3.5 h-3.5" style={{ color: TIER_COLORS[MOCK_STATS.tier] }} />, value: MOCK_STATS.tier, label: 'Tier', color: TIER_COLORS[MOCK_STATS.tier] },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-0">
                {i > 0 && <div className="w-px h-5 mx-3 shrink-0" style={{ background: tokens.divider }} />}
                <div className="flex items-center gap-1.5 shrink-0">
                  {stat.icon}
                  <div>
                    <span className="text-xs font-bold" style={{ color: stat.color, fontFamily: "'DM Mono', monospace" }}>{stat.value}</span>
                    <span className="text-[9px] ml-1" style={{ color: tokens.textMuted }}>{stat.label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div ref={tabsRef} className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
            {CATEGORIES.map(cat => {
              const isActive = activeTab === cat.key;
              return (
                <button key={cat.key}
                  onClick={() => { setActiveTab(cat.key); setExpandedId(null); }}
                  className="relative flex items-center gap-1.5 px-3 py-2 text-sm font-semibold shrink-0 transition-colors group"
                  style={{
                    color: isActive ? (tokens.dark ? '#E2FF6D' : '#323232') : (tokens.dark ? '#D9D9D9' : tokens.textMuted),
                    background: isActive ? tokens.tabActiveBg : 'transparent',
                    borderRadius: '8px 8px 0 0',
                  }}
                  onMouseEnter={e => { if (!isActive && tokens.dark) (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = tokens.dark ? '#D9D9D9' : tokens.textMuted; }}>
                  {cat.label}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: isActive ? tokens.tabCountBg : (tokens.dark ? 'rgba(255,255,255,0.08)' : tokens.tabCountInactiveBg), color: isActive ? (tokens.dark ? '#E2FF6D' : '#323232') : (tokens.dark ? '#D9D9D9' : tokens.textMuted) }}>
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
              <BountyCard bounty={b} expanded={expandedId === b.id} onToggle={() => handleToggle(b.id)} onClaim={claimBounty} tokens={tokens} />
            </div>
          ))}
        </div>

        {/* ── STREAK BANNER ─────────────────────────────── */}
        {MOCK_STATS.streak > 0 && (
          <div className="mt-4 rounded-xl p-4 flex items-center gap-4 transition-colors duration-300"
            style={{ background: tokens.streakBannerBg, border: tokens.streakBannerBorder, boxShadow: tokens.dark ? '0 0 30px rgba(226,255,109,0.06)' : tokens.cardShadow }}>
            <span className="text-[28px] shrink-0">🔥</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm" style={{ color: tokens.streakTextColor }}>{MOCK_STATS.streak}-day streak!</p>
              <p className="text-[11px] mt-0.5" style={{ color: tokens.textMuted }}>Come back tomorrow to keep it alive and unlock bonus multipliers.</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[28px] font-bold leading-none" style={{ color: tokens.streakNumberColor, fontFamily: "'DM Mono', monospace" }}>{MOCK_STATS.streak}</span>
              <p className="text-[9px] uppercase" style={{ color: tokens.textMuted }}>Days</p>
            </div>
          </div>
        )}

        {/* ── BOUNTY HISTORY ──────────────────────────── */}
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen} className="mt-6">
          <CollapsibleTrigger className="w-full">
            <div className="rounded-xl p-4 flex items-center justify-between cursor-pointer transition-colors"
              style={{ background: tokens.cardBg, border: tokens.cardBorder, boxShadow: tokens.cardShadow }}>
              <div>
                <h3 className="text-sm font-bold" style={{ color: tokens.textPrimary }}>Your Bounty History</h3>
                <p className="text-[11px]" style={{ color: tokens.textMuted }}>{history.length} completed bounties</p>
              </div>
              <div className="transition-transform duration-200" style={{ transform: historyOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <ChevronDown className="w-5 h-5" style={{ color: tokens.textMuted }} />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 rounded-xl overflow-hidden" style={{ background: tokens.cardBg, border: tokens.cardBorder, boxShadow: tokens.cardShadow }}>
              {history.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-fade-in"
                  style={{ borderBottom: i < history.length - 1 ? tokens.historyRowBorder : 'none', animationDelay: `${i * 0.08}s` }}>
                  <span className="text-base">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold" style={{ color: tokens.textPrimary }}>{item.title}</span>
                    <span className="text-[10px] ml-2" style={{ color: tokens.textMuted }}>{item.date}</span>
                  </div>
                  <span className="text-xs font-bold shrink-0" style={{ color: tokens.dark ? '#E2FF6D' : '#5A8A00', fontFamily: "'DM Mono', monospace" }}>
                    +{item.amount.toLocaleString()} NCTR
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ── FOOTER ──────────────────────────────────── */}
        <div className="mt-10 mb-4 text-center">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: tokens.textMuted }}>
            Powered by <span className="font-bold" style={{ color: tokens.footerBrandColor }}>NCTR Alliance</span> · Crescendo Rewards
          </p>
        </div>
      </div>

      {/* ── BOTTOM STICKY BAR ─────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 transition-colors duration-300" style={{ background: tokens.bottomBarBg, backdropFilter: 'blur(20px)', borderTop: tokens.bottomBarBorder }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: tokens.dark ? 'rgba(226,255,109,0.1)' : 'rgba(226,255,109,0.12)' }}>
              <Zap className="w-4 h-4" style={{ color: '#E2FF6D' }} />
            </div>
            <div>
              <span className="text-sm font-bold" style={{ color: tokens.dark ? '#E2FF6D' : '#323232', fontFamily: "'DM Mono', monospace" }}>{balance.toLocaleString()} NCTR</span>
              <p className="text-[9px] uppercase" style={{ color: tokens.textMuted }}>Your Balance</p>
            </div>
          </div>
          <div className="text-center hidden sm:block">
            <p className="text-[9px] uppercase" style={{ color: tokens.textMuted }}>Next reward</p>
            <p className="text-xs font-bold" style={{ color: tokens.textPrimary }}>{nextClaimAmount > 0 ? `${nextClaimAmount.toLocaleString()} NCTR ready` : 'Keep earning!'}</p>
          </div>
          <button ref={claimBtnRef} onClick={claimAll}
            className="px-5 py-2.5 rounded-[14px] text-sm font-extrabold transition-all hover:scale-[1.03]"
            style={{ background: tokens.claimBg, color: tokens.claimText, boxShadow: tokens.claimShadow }}>
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
