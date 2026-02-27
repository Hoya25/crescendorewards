import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Zap, Trophy, Flame, Diamond, ChevronDown, ChevronUp,
  ShoppingCart, Users, Share2, Heart, Check, ExternalLink,
  Sun, Moon, ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { useTheme } from '@/components/ThemeProvider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ── TYPES ────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard';
type Category = 'shopping' | 'referral' | 'social' | 'engagement';
type BountyStatus = 'completed' | 'in_progress' | 'claim_ready' | 'not_started' | 'recurring';

interface DisplayBounty {
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

const VALID_CATEGORIES: Category[] = ['shopping', 'referral', 'social', 'engagement'];

const CATEGORIES: { key: Category; label: string; icon: React.ElementType }[] = [
  { key: 'shopping', label: 'Shopping', icon: ShoppingCart },
  { key: 'referral', label: 'Referral', icon: Users },
  { key: 'social', label: 'Social', icon: Share2 },
  { key: 'engagement', label: 'Engagement', icon: Heart },
];

// ── MOCK USER STATS (will be replaced with real data later) ──────────
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
    bottomBarBg: dark ? 'rgba(50, 50, 50, 0.92)' : 'rgba(255, 255, 255, 0.92)',
    bottomBarBorder: dark ? '1px solid rgba(226,255,109,0.1)' : '1px solid #D9D9D9',
    cardBg: dark ? 'rgba(50, 50, 50, 0.6)' : '#FFFFFF',
    cardBorder: dark ? '1px solid rgba(226,255,109,0.15)' : '1px solid #D9D9D9',
    cardBorderHover: dark ? 'rgba(226,255,109,0.4)' : '#5A5A58',
    cardShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
    cardCompletedBg: dark
      ? 'radial-gradient(ellipse at top left, rgba(226,255,109,0.06), rgba(50,50,50,0.6) 60%)'
      : '#FFFFFF',
    cardClaimBorder: dark ? '1px solid rgba(226,255,109,0.3)' : '1px solid #323232',
    textPrimary: dark ? '#FFFFFF' : '#323232',
    textSecondary: dark ? '#8A8A88' : '#5A5A58',
    textMuted: dark ? '#8A8A88' : '#5A5A58',
    lime: '#E2FF6D',
    amountColor: dark ? '#E2FF6D' : '#323232',
    amountAccent: '#E2FF6D',
    ctaBg: dark ? '#E2FF6D' : '#323232',
    ctaText: dark ? '#323232' : '#FFFFFF',
    ctaHoverBg: dark ? '#C8FF3C' : '#5A5A58',
    claimBg: dark ? '#E2FF6D' : '#323232',
    claimText: dark ? '#323232' : '#FFFFFF',
    claimShadow: dark ? '0 0 12px rgba(226,255,109,0.3)' : '0 1px 4px rgba(0,0,0,0.12)',
    diffEasy: dark
      ? { bg: 'rgba(226, 255, 109, 0.2)', color: '#E2FF6D' }
      : { bg: 'rgba(50, 50, 50, 0.1)', color: '#323232' },
    diffMedium: dark
      ? { bg: 'rgba(250, 204, 21, 0.2)', color: '#FACC15' }
      : { bg: 'rgba(180, 130, 0, 0.12)', color: '#8B6914' },
    diffHard: dark
      ? { bg: 'rgba(255, 68, 68, 0.2)', color: '#FF4444' }
      : { bg: 'rgba(200, 0, 0, 0.1)', color: '#CC0000' },
    progressTrack: dark ? 'rgba(255,255,255,0.07)' : '#D9D9D9',
    progressFill: dark ? 'linear-gradient(90deg, #E2FF6D, #C8FF3C)' : 'linear-gradient(90deg, #323232, #5A5A58)',
    progressGlow: dark ? '0 0 8px rgba(226,255,109,0.5)' : 'none',
    progressRingTrack: dark ? 'rgba(255,255,255,0.08)' : '#D9D9D9',
    iconBoxBg: dark ? 'rgba(42,42,42,1)' : 'rgba(0,0,0,0.04)',
    iconBoxBorder: dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid #D9D9D9',
    iconBoxCompletedBg: dark ? 'rgba(226,255,109,0.12)' : 'rgba(50,50,50,0.06)',
    iconBoxCompletedBorder: dark ? '1px solid rgba(226,255,109,0.2)' : '1px solid #D9D9D9',
    divider: dark ? 'rgba(255,255,255,0.10)' : '#D9D9D9',
    tabActiveBg: dark ? 'rgba(226,255,109,0.06)' : 'rgba(50,50,50,0.06)',
    tabActiveColor: dark ? '#E2FF6D' : '#323232',
    tabCountBg: dark ? 'rgba(226,255,109,0.15)' : 'rgba(50,50,50,0.12)',
    tabCountInactiveBg: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    tabUnderline: dark ? '#E2FF6D' : '#323232',
    tabUnderlineShadow: dark ? '0 0 6px rgba(226,255,109,0.5)' : 'none',
    historyRowBorder: dark ? '1px solid rgba(255,255,255,0.04)' : '1px solid #D9D9D9',
    specialNoteBg: dark ? 'rgba(30,30,30,1)' : 'rgba(0,0,0,0.03)',
    specialNoteBorder: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #D9D9D9',
    inProgressBg: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    expandedBorder: dark ? 'border-white/5' : 'border-[#D9D9D9]',
    expandedDescColor: dark ? '#D9D9D9' : '#5A5A58',
    streakBannerBg: dark ? 'rgba(50,50,50,0.6)' : '#FFFFFF',
    streakBannerBorder: dark ? '1px solid rgba(255, 150, 50, 0.15)' : '1px solid #D9D9D9',
    streakTextColor: dark ? '#E2FF6D' : '#323232',
    streakNumberColor: dark ? '#E2FF6D' : '#323232',
    footerBrandColor: dark ? '#E2FF6D' : '#323232',
    badgeLimeBg: dark ? 'rgba(226,255,109,0.12)' : 'rgba(50,50,50,0.08)',
    badgeLimeColor: dark ? '#E2FF6D' : '#323232',
    claimReadyBadgeBg: dark ? 'rgba(226,255,109,0.2)' : 'rgba(50,50,50,0.1)',
    claimReadyBadgeColor: dark ? '#E2FF6D' : '#323232',
    completedBadgeBg: dark ? 'rgba(226,255,109,0.15)' : 'rgba(50,50,50,0.1)',
    completedBadgeColor: dark ? '#E2FF6D' : '#323232',
    inProgressBadgeBg: dark ? 'rgba(250,204,21,0.12)' : 'rgba(180,130,0,0.1)',
    inProgressBadgeColor: dark ? '#FACC15' : '#8B6914',
    weekDotEmpty: dark ? 'rgba(255,255,255,0.07)' : '#D9D9D9',
    weekDotFilled: dark ? '#E2FF6D' : '#323232',
    weekDotGlow: dark ? '0 0 6px rgba(226,255,109,0.4)' : 'none',
    streakDayEmptyBg: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    streakDayFilledBg: dark ? 'rgba(226,255,109,0.12)' : 'rgba(50,50,50,0.08)',
    streakDayFilledColor: dark ? '#E2FF6D' : '#323232',
    checkCircleBg: dark ? '#E2FF6D' : '#323232',
    checkCircleBorder: dark ? '1.5px solid #E2FF6D' : '1.5px solid #323232',
    historyAmountColor: dark ? '#E2FF6D' : '#323232',
    statIconColor: dark ? '#E2FF6D' : '#323232',
  }), [dark]);
}

// ── MAP DB ROW → DISPLAY BOUNTY ──────────────────────────────────────
function mapDbToDisplay(row: any): DisplayBounty | null {
  const cat = (row.category || '').toLowerCase() as Category;
  if (!VALID_CATEGORIES.includes(cat)) return null;
  
  const isRecurring = !!row.is_recurring;

  return {
    id: row.id,
    emoji: row.image_emoji || '🎯',
    title: row.title,
    description: row.description || '',
    nctrAmount: row.nctr_reward || 0,
    difficulty: (['easy', 'medium', 'hard'].includes(row.difficulty) ? row.difficulty : 'medium') as Difficulty,
    category: cat,
    status: isRecurring ? 'recurring' : 'not_started',
    isWide: !!row.is_wide,
    isViral: cat === 'referral',
    capLabel: row.cap_per_month ? `Cap: ${row.cap_per_month}/month` : undefined,
    progressTarget: row.progress_target || undefined,
    progressCurrent: 0,
    specialNote: row.completion_message || undefined,
    resetsLabel: row.is_recurring && row.recurrence_period ? `Resets ${row.recurrence_period}` : undefined,
  };
}

// ── PROGRESS RING ────────────────────────────────────────────────────
function ProgressRing({ percent, tokens }: { percent: number; tokens: ReturnType<typeof useTokens> }) {
  const r = 18; const c = 2 * Math.PI * r;
  const [offset, setOffset] = useState(c);
  useEffect(() => {
    const t = setTimeout(() => setOffset(c - (c * percent) / 100), 100);
    return () => clearTimeout(t);
  }, [percent, c]);
  const ringStroke = tokens.dark ? '#E2FF6D' : '#323232';
  const ringFilter = tokens.dark ? 'drop-shadow(0 0 4px rgba(226,255,109,0.5))' : 'none';
  return (
    <div className="relative w-11 h-11 shrink-0">
      <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke={tokens.progressRingTrack} strokeWidth="3" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={ringStroke} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.3s ease', filter: ringFilter }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-bold leading-none" style={{ color: tokens.dark ? '#E2FF6D' : '#323232', fontFamily: "'DM Mono', monospace" }}>{percent}%</span>
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
  bounty: DisplayBounty; expanded: boolean; onToggle: () => void; onClaim: (bounty: DisplayBounty) => void;
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
      : bounty.specialGlow ? (tokens.dark ? '1px solid rgba(226,255,109,0.4)' : '1px solid #323232')
      : tokens.cardBorder,
    backdropFilter: tokens.dark ? 'blur(10px)' : 'none',
    boxShadow: isClaimReady
      ? (tokens.dark ? '0 0 0 1px rgba(226,255,109,0.15)' : '0 0 0 1px rgba(50,50,50,0.2), 0 1px 3px rgba(0,0,0,0.08)')
      : bounty.specialGlow
      ? (tokens.dark ? '0 0 16px rgba(226,255,109,0.12), 0 0 0 1px rgba(226,255,109,0.2)' : '0 0 8px rgba(50,50,50,0.08), 0 1px 3px rgba(0,0,0,0.08)')
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
        const border = isClaimReady ? (tokens.dark ? 'rgba(226,255,109,0.3)' : '#323232')
          : bounty.specialGlow ? (tokens.dark ? 'rgba(226,255,109,0.4)' : 'rgba(50,50,50,0.3)')
          : (tokens.dark ? 'rgba(226,255,109,0.15)' : '#D9D9D9');
        (e.currentTarget as HTMLElement).style.borderColor = border;
      }}
      onClick={onToggle}
    >
      <div className="p-4 flex items-start gap-3">
        <div
          className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center shrink-0 text-xl"
          style={{
            background: isCompleted ? tokens.iconBoxCompletedBg : isInProgress ? (tokens.dark ? 'rgba(226,255,109,0.08)' : 'rgba(50,50,50,0.06)') : tokens.iconBoxBg,
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
                style={{ background: tokens.dark ? 'rgba(226,255,109,0.2)' : 'rgba(50,50,50,0.1)', color: tokens.badgeLimeColor }}>
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
                    background: tokens.progressFill,
                    boxShadow: tokens.progressGlow,
                  }} />
              </div>
            </div>
          )}

          {bounty.weekDots && (
            <div className="flex gap-2 mt-2.5">
              {bounty.weekDots.map((filled, i) => (
                <div key={i} className="w-6 h-2 rounded-full" style={{
                  background: filled ? tokens.weekDotFilled : tokens.weekDotEmpty,
                  boxShadow: filled ? tokens.weekDotGlow : 'none',
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
                        boxShadow: isToday ? (tokens.dark ? '0 0 8px rgba(226,255,109,0.4)' : '0 0 6px rgba(50,50,50,0.2)') : 'none',
                        border: isToday ? (tokens.dark ? '1px solid rgba(226,255,109,0.4)' : '1px solid #323232') : '1px solid transparent',
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
              <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center" style={{ background: tokens.checkCircleBg, border: tokens.checkCircleBorder }}>
                <Check className="w-3 h-3" style={{ color: tokens.dark ? '#323232' : '#FFFFFF' }} />
              </div>
              <span className="text-[11px] font-medium bg-clip-text text-transparent animate-shimmer"
                style={{ backgroundImage: tokens.dark ? 'linear-gradient(90deg, #E2FF6D 0%, #fff 50%, #E2FF6D 100%)' : 'linear-gradient(90deg, #323232 0%, #5A5A58 50%, #323232 100%)', backgroundSize: '200% 100%' }}>
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
                style={{ background: tokens.ctaBg, color: tokens.ctaText, boxShadow: tokens.dark ? '0 0 16px rgba(226,255,109,0.3)' : '0 1px 4px rgba(0,0,0,0.12)' }}>
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Category>('shopping');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [localOverrides, setLocalOverrides] = useState<Record<string, Partial<DisplayBounty>>>({});
  const [balance, setBalance] = useState(MOCK_STATS.balance);
  const [completedCount, setCompletedCount] = useState(MOCK_STATS.completed);
  const [history, setHistory] = useState<{ emoji: string; title: string; date: string; amount: number }[]>([]);
  const tabsRef = useRef<HTMLDivElement>(null);
  const claimBtnRef = useRef<HTMLButtonElement>(null);

  // ── FETCH BOUNTIES FROM SUPABASE ──
  const { data: dbBounties = [], isLoading } = useQuery({
    queryKey: ['bounty-board'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bounties')
        .select('*')
        .eq('status', 'active')
        .order('sort_order', { ascending: true })
        .order('nctr_reward', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  // ── MAP DB → DISPLAY ──
  const bountyData = useMemo(() => {
    const result: Record<Category, DisplayBounty[]> = { shopping: [], referral: [], social: [], engagement: [] };
    for (const row of dbBounties) {
      const mapped = mapDbToDisplay(row);
      if (!mapped) continue;
      // Apply local overrides (for claim/status changes during session)
      const override = localOverrides[mapped.id];
      const final = override ? { ...mapped, ...override } : mapped;
      result[final.category].push(final);
    }
    return result;
  }, [dbBounties, localOverrides]);

  const bounties = bountyData[activeTab];
  const totalBounties = Object.values(bountyData).reduce((s, l) => s + l.length, 0);
  const completionPercent = totalBounties > 0 ? Math.round((completedCount / totalBounties) * 100) : 0;

  const categoryCounts = useMemo(() => {
    const counts: Record<Category, number> = { shopping: 0, referral: 0, social: 0, engagement: 0 };
    for (const [cat, list] of Object.entries(bountyData)) counts[cat as Category] = list.length;
    return counts;
  }, [bountyData]);

  const claimBounty = useCallback((bounty: DisplayBounty) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setLocalOverrides(prev => ({
      ...prev,
      [bounty.id]: { status: 'completed' as BountyStatus, completedDate: dateStr },
    }));
    setBalance(prev => prev + bounty.nctrAmount);
    setCompletedCount(prev => prev + 1);
    setHistory(prev => [{ emoji: bounty.emoji, title: bounty.title, date: dateStr, amount: bounty.nctrAmount }, ...prev]);
    toast.success(`🎉 ${bounty.nctrAmount.toLocaleString()} NCTR Claimed!`, {
      style: { background: '#323232', color: '#E2FF6D', border: '1px solid rgba(226,255,109,0.3)', boxShadow: '0 0 12px rgba(226,255,109,0.15)' },
      duration: 2500,
    });
  }, []);

  const claimAll = useCallback(() => {
    const allClaimReady: DisplayBounty[] = [];
    for (const list of Object.values(bountyData)) {
      for (const b of list) {
        if (b.status === 'claim_ready') allClaimReady.push(b);
      }
    }
    if (allClaimReady.length === 0) {
      toast('No rewards ready to claim yet', {
        style: { background: '#323232', color: '#8A8A88', border: '1px solid rgba(255,255,255,0.1)' },
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: tokens.pageBg }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: tokens.amountColor, borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: tokens.textMuted }}>Loading bounties…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 transition-colors duration-300" style={{ background: tokens.pageBg, fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── STICKY HEADER ─────────────────────────────── */}
      <div className="sticky top-0 z-50 transition-colors duration-300" style={{ background: tokens.headerBg, backdropFilter: 'blur(20px)', borderBottom: tokens.headerBorder }}>
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
           <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/')}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors no-min-touch"
                style={{ background: 'transparent' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = tokens.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" style={{ color: tokens.textPrimary }} />
              </button>
              <div>
              <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: tokens.textPrimary }}>
                <img src="/nctr-n-lime.svg" alt="NCTR" className="w-6 h-6" style={{ filter: tokens.dark ? 'none' : 'brightness(0) saturate(100%)' }} />
                Bounty Board
              </h1>
              <p className="text-[11px] uppercase tracking-widest" style={{ color: tokens.textMuted }}>Crescendo Rewards</p>
            </div>
            </div>
            <div className="flex items-center gap-2">
              <ProgressRing percent={completionPercent} tokens={tokens} />
              <BountyThemeToggle />
            </div>
          </div>

          <div className="flex items-center gap-0 overflow-x-auto no-scrollbar py-2 -mx-4 px-4">
            {[
              { icon: <Zap className="w-3.5 h-3.5" style={{ color: tokens.statIconColor }} />, value: balance.toLocaleString(), label: 'Your NCTR', color: tokens.amountColor },
              { icon: <Trophy className="w-3.5 h-3.5" style={{ color: tokens.textPrimary }} />, value: `${completedCount}/${totalBounties}`, label: 'Completed', color: tokens.textPrimary },
              { icon: <Flame className="w-3.5 h-3.5" style={{ color: MOCK_STATS.streak > 0 ? tokens.statIconColor : tokens.textMuted }} />, value: String(MOCK_STATS.streak), label: 'Day Streak', color: MOCK_STATS.streak > 0 ? tokens.amountColor : tokens.textMuted },
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
                    color: isActive ? tokens.tabActiveColor : (tokens.dark ? '#D9D9D9' : tokens.textMuted),
                    background: isActive ? tokens.tabActiveBg : 'transparent',
                    borderRadius: '8px 8px 0 0',
                  }}
                  onMouseEnter={e => { if (!isActive && tokens.dark) (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = tokens.dark ? '#D9D9D9' : tokens.textMuted; }}>
                  {cat.label}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: isActive ? tokens.tabCountBg : (tokens.dark ? 'rgba(255,255,255,0.08)' : tokens.tabCountInactiveBg), color: isActive ? tokens.tabActiveColor : (tokens.dark ? '#D9D9D9' : tokens.textMuted) }}>
                    {categoryCounts[cat.key]}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-[15%] right-[15%] h-[2.5px] rounded-full"
                      style={{ background: tokens.tabUnderline, boxShadow: tokens.tabUnderlineShadow }} />
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
          {bounties.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-sm" style={{ color: tokens.textMuted }}>No bounties in this category yet.</p>
            </div>
          )}
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
              {history.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-xs" style={{ color: tokens.textMuted }}>No completed bounties yet. Start earning!</p>
                </div>
              ) : history.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-fade-in"
                  style={{ borderBottom: i < history.length - 1 ? tokens.historyRowBorder : 'none', animationDelay: `${i * 0.08}s` }}>
                  <span className="text-base">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold" style={{ color: tokens.textPrimary }}>{item.title}</span>
                    <span className="text-[10px] ml-2" style={{ color: tokens.textMuted }}>{item.date}</span>
                  </div>
                  <span className="text-xs font-bold shrink-0" style={{ color: tokens.historyAmountColor, fontFamily: "'DM Mono', monospace" }}>
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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: tokens.dark ? 'rgba(226,255,109,0.1)' : 'rgba(50,50,50,0.08)' }}>
              <Zap className="w-4 h-4" style={{ color: tokens.statIconColor }} />
            </div>
            <div>
              <span className="text-sm font-bold" style={{ color: tokens.amountColor, fontFamily: "'DM Mono', monospace" }}>{balance.toLocaleString()} NCTR</span>
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
