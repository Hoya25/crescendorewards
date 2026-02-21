import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Lock, ChevronRight, ChevronDown, Star, Info, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addDays } from 'date-fns';
import { TierUpgradeCelebration } from '@/components/TierUpgradeCelebration';
import { calculateReward, DEFAULT_EARNING_MULTIPLIERS } from '@/utils/calculateReward';
import type { LockDecisionRequest } from '@/contexts/LockDecisionContext';

const TIER_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
};

const SOURCE_EMOJI: Record<string, string> = {
  bounty: '📸',
  shopping: '🛍️',
  merch: '👕',
  referral: '🤝',
  signup: '🎉',
  profile: '✅',
  other: '⭐',
};

interface LockDecisionResult {
  lockType: '90lock' | '360lock';
  baseAmount: number;
  finalAmount: number;
  multiplier: number;
}

interface Props {
  request: LockDecisionRequest;
  onComplete: (result: LockDecisionResult | null) => void;
}

export function LockDecisionModalInner({ request, onComplete }: Props) {
  const navigate = useNavigate();
  const { tier, nextTier, total360Locked, allTiers, profile } = useUnifiedUser();
  const tierName = (tier?.tier_name || 'bronze').toLowerCase();
  const statusMultiplier = (tier as any)?.earning_multiplier ?? DEFAULT_EARNING_MULTIPLIERS[tierName] ?? 1;
  const isMerch = request.sourceType === 'merch' || (request.sourceType === 'bounty' && request.requires360Lock);

  const calc360 = calculateReward(request.baseAmount, {
    statusMultiplier,
    tierName,
    isMerch,
    is360Lock: true,
  });
  const calc90 = calculateReward(request.baseAmount, {
    statusMultiplier,
    tierName,
    isMerch: false,
    is360Lock: false,
  });

  const multiplier = request.lockMultiplier || 3;
  const amount360 = calc360.finalAmount;
  const amount90 = calc90.finalAmount || request.baseAmount;
  const is360Required = request.requires360Lock;

  const [selected, setSelected] = useState<'90lock' | '360lock'>('360lock');
  const [phase, setPhase] = useState<'choose' | 'success' | 'levelup'>('choose');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const selectedAmount = selected === '360lock' ? amount360 : amount90;
  const lockDays = selected === '360lock' ? 360 : 90;

  // Status impact
  const newLocked360 = total360Locked + amount360;
  const newLocked90 = total360Locked + amount90;
  const newLocked = selected === '360lock' ? newLocked360 : newLocked90;
  const sortedTiers = [...allTiers].sort((a, b) => a.min_nctr_360_locked - b.min_nctr_360_locked);
  const newTier = [...sortedTiers].reverse().find(t => newLocked >= t.min_nctr_360_locked) || sortedTiers[0];
  const newNextTier = sortedTiers.find(t => t.min_nctr_360_locked > newLocked) || null;
  const wouldLevelUp = newTier && tier && newTier.sort_order > tier.sort_order;
  const nctrToNewNext = newNextTier ? Math.max(0, newNextTier.min_nctr_360_locked - newLocked) : 0;

  const handleConfirm = async () => {
    if (profile?.id) {
      try {
        await supabase.from('cross_platform_activity_log').insert({
          user_id: profile.id,
          platform: 'crescendo',
          action_type: `${selected}_lock`,
          action_data: {
            base_amount: request.baseAmount,
            final_amount: selectedAmount,
            multiplier: selected === '360lock' ? multiplier : 1,
            lock_days: lockDays,
            source_type: request.sourceType,
            source_name: request.sourceName,
          },
        });

        const currentData = (profile.crescendo_data || {}) as Record<string, any>;
        const currentLocked = (currentData.locked_nctr as number) || 0;
        await supabase
          .from('unified_profiles')
          .update({
            crescendo_data: {
              ...currentData,
              locked_nctr: currentLocked + selectedAmount,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id);
      } catch (err) {
        console.error('Error recording lock:', err);
      }
    }

    localStorage.setItem('crescendo_seen_lock_decision', 'true');

    if (wouldLevelUp) {
      setPhase('levelup');
      return;
    }

    setPhase('success');

    if (selected === '360lock') {
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#C8FF00', '#FFD700', '#00CED1'],
        });
      }, 100);
    }
  };

  const handleDone = () => {
    onComplete({
      lockType: selected,
      baseAmount: request.baseAmount,
      finalAmount: selectedAmount,
      multiplier: selected === '360lock' ? multiplier : 1,
    });
  };

  // ─── LEVEL-UP CELEBRATION ───
  if (phase === 'levelup' && tier && newTier) {
    const celebrationNextTier = sortedTiers.find(t => t.min_nctr_360_locked > newLocked) || null;
    return (
      <TierUpgradeCelebration
        isOpen={true}
        onClose={handleDone}
        previousTier={tier}
        newTier={newTier}
        totalLockedNctr={newLocked}
        nextTierThreshold={celebrationNextTier?.min_nctr_360_locked || null}
        nextTierName={celebrationNextTier?.display_name || null}
      />
    );
  }

  // ─── SUCCESS PHASE ───
  if (phase === 'success') {
    const is360 = selected === '360lock';
    const unlockDate = format(addDays(new Date(), is360 ? 360 : 90), 'MMMM d, yyyy');
    const tierDisplayName = newTier?.display_name || tier?.display_name || 'Bronze';

    if (is360) {
      return <Lock360Celebration
        amount={selectedAmount}
        tierName={tierDisplayName}
        tierEmoji={newTier?.badge_emoji || tier?.badge_emoji || '🥉'}
        tierColor={TIER_COLORS[(newTier?.tier_name || newTier?.display_name || tierName).toLowerCase()] || '#CD7F32'}
        unlockDate={unlockDate}
        onViewRewards={() => {
          handleDone();
          navigate('/rewards');
        }}
      />;
    }

    // 90-day success (unchanged)
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
        <div className="w-full max-w-md rounded-2xl p-6 text-center space-y-5" style={{ background: '#323232' }}>
          <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ background: 'rgba(226,255,109,0.1)' }}>
            <Check className="w-7 h-7" style={{ color: '#E2FF6D' }} />
          </div>
          <h2 className="text-xl font-bold text-white">
            {selectedAmount.toLocaleString()} NCTR Locked
          </h2>
          <div className="p-3 rounded-lg text-left" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p className="text-xs text-white/60">
              💡 <span className="font-semibold text-white/80">Tip:</span> Choose 360LOCK next time to earn {multiplier}x. It adds up fast.
            </p>
          </div>
          <StatusBar
            newTier={newTier}
            newNextTier={newNextTier}
            newLocked={newLocked}
            nctrToNewNext={nctrToNewNext}
            barColor={newTier?.badge_color || '#CD7F32'}
          />
          <Button
            variant="outline"
            className="w-full text-white border-white/20 hover:bg-white/10"
            onClick={handleDone}
          >
            Got It →
          </Button>
        </div>
      </div>
    );
  }

  // ─── CHOOSE PHASE ───
  const faqs = [
    {
      q: 'What happens to my NCTR when I commit it?',
      a: 'Your NCTR stays in your wallet — it is not spent or consumed. It is simply committed for the chosen period. After the period ends, it becomes available and you can use it freely or re-commit for continued status.',
    },
    {
      q: 'Can I withdraw my NCTR before 360 days?',
      a: 'No. Once committed, your NCTR is held for the full period. This is what makes Crescendo status meaningful — it represents real commitment to the community.',
    },
    {
      q: 'What is Crescendo status?',
      a: 'Your status tier (Bronze through Diamond) determines what rewards and opportunities you can access. Higher status = better access. It is determined by your total committed NCTR amount.',
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="w-full max-w-[800px] rounded-2xl overflow-hidden my-4" style={{ background: '#1A1A2E' }}>

        {/* SECTION 1 — Header */}
        <div className="p-6 pb-4 text-center border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Commit Your NCTR</h2>
          <p className="text-sm text-white/60 mt-1.5 max-w-md mx-auto">
            Choose how long to commit. Longer commitment = bigger rewards + higher Crescendo status.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)' }}>
            <span className="text-xs text-white/50">Available to commit:</span>
            <span className="text-sm font-bold text-white">{request.baseAmount.toLocaleString()} NCTR</span>
          </div>
          {request.sourceName && (
            <p className="text-xs text-white/40 mt-2">
              {SOURCE_EMOJI[request.sourceType] || '⭐'} From: {request.sourceName}
            </p>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* SECTION 2 — Side-by-Side Comparison */}
          {is360Required ? (
            <Required360View amount360={amount360} multiplier={multiplier} calc360={calc360} statusMultiplier={statusMultiplier} tierName={tierName} baseAmount={request.baseAmount} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 90-Day Card */}
              <button
                onClick={() => setSelected('90lock')}
                className={cn(
                  'rounded-xl p-5 text-left border-2 transition-all flex flex-col order-2 sm:order-1',
                  selected === '90lock'
                    ? 'border-white/40 bg-white/5'
                    : 'border-white/10 hover:border-white/25 bg-white/[0.02]'
                )}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-3">Standard</span>
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="w-4 h-4 text-white/50" />
                  <span className="font-bold text-white">90-Day Lock</span>
                </div>
                <p className="text-xs text-white/40 mb-4">Lock {request.baseAmount.toLocaleString()} NCTR for 90 days</p>

                <div className="text-2xl font-bold text-white mb-1">1x <span className="text-base font-normal text-white/50">rewards</span></div>

                <div className="flex items-center gap-1.5 text-xs text-white/50 mb-3">
                  <Check className="w-3 h-3" />
                  <span>Counts toward your Crescendo status</span>
                </div>

                <div className="rounded-lg p-3 mb-4 flex-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-xs text-white/50">
                    <span className="text-white/70 font-medium">Example:</span> Earn a 250 NCTR bounty → receive <span className="text-white font-semibold">250 NCTR</span>
                  </p>
                </div>

                <p className="text-[11px] text-white/30 mt-auto">
                  Your NCTR remains yours — it unlocks after 90 days
                </p>

                <div className={cn(
                  'mt-4 w-full py-2.5 rounded-lg text-center text-sm font-semibold transition-all',
                  selected === '90lock'
                    ? 'bg-white text-[#1A1A2E]'
                    : 'bg-white/10 text-white/60'
                )}>
                  Lock for 90 Days
                </div>
              </button>

              {/* 360-Day Card (HIGHLIGHTED) */}
              <button
                onClick={() => setSelected('360lock')}
                className={cn(
                  'rounded-xl p-5 text-left border-2 transition-all flex flex-col relative order-1 sm:order-2',
                  selected === '360lock'
                    ? 'shadow-xl'
                    : 'hover:shadow-lg'
                )}
                style={{
                  borderColor: selected === '360lock' ? '#C8FF00' : 'rgba(200,255,0,0.3)',
                  background: selected === '360lock' ? 'rgba(200,255,0,0.06)' : 'rgba(200,255,0,0.02)',
                  boxShadow: selected === '360lock' ? '0 0 30px rgba(200,255,0,0.1)' : undefined,
                }}
              >
                <span
                  className="absolute -top-3 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: '#C8FF00', color: '#1A1A2E' }}
                >
                  ★ Recommended
                </span>

                <span className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#C8FF00' }}>Best Value</span>
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="w-4 h-4" style={{ color: '#C8FF00' }} />
                  <span className="font-bold text-white">360-Day Lock</span>
                </div>
                <p className="text-xs text-white/40 mb-4">Lock {request.baseAmount.toLocaleString()} NCTR for 360 days</p>

                <div className="mb-1">
                  <span className="text-3xl font-bold" style={{ color: '#C8FF00' }}>3x</span>
                  <span className="text-base font-normal text-white/50 ml-1">rewards</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1">
                  <Check className="w-3 h-3" style={{ color: '#C8FF00' }} />
                  <span>Counts toward your Crescendo status</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs mb-3" style={{ color: '#C8FF00' }}>
                  <Sparkles className="w-3 h-3" />
                  <span className="font-medium">Unlocks exclusive merch bounties</span>
                </div>

                <div className="rounded-lg p-3 mb-3" style={{ background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.1)' }}>
                  <p className="text-xs text-white/50">
                    <span className="font-medium" style={{ color: '#C8FF00' }}>Example:</span> Earn a 250 NCTR bounty → receive <span className="font-bold" style={{ color: '#C8FF00' }}>750 NCTR</span>
                  </p>
                </div>

                <div className="rounded-lg p-2.5 mb-3 text-center" style={{ background: 'rgba(200,255,0,0.08)' }}>
                  <p className="text-xs font-semibold" style={{ color: '#C8FF00' }}>
                    3x more NCTR for the same effort
                  </p>
                </div>

                <p className="text-[11px] text-white/30 mt-auto">
                  Your NCTR remains yours — it unlocks after 360 days
                </p>

                <div
                  className={cn(
                    'mt-4 w-full py-3 rounded-lg text-center font-semibold transition-all',
                    selected === '360lock' ? 'text-base' : 'text-sm'
                  )}
                  style={{
                    background: selected === '360lock' ? '#C8FF00' : 'rgba(200,255,0,0.15)',
                    color: selected === '360lock' ? '#1A1A2E' : '#C8FF00',
                  }}
                >
                  Lock for 360 Days
                </div>
              </button>
            </div>
          )}

          {/* SECTION 3 — Status Impact Preview */}
          <div className="rounded-xl p-5 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/40">
              Status Impact Preview
            </h4>
            <p className="text-sm text-white/60">
              If you lock {request.baseAmount.toLocaleString()} NCTR for {lockDays} days:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Current Status</p>
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{ background: TIER_COLORS[tierName] || '#CD7F32' }}
                  >
                    {tier?.badge_emoji || '🥉'}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{tier?.display_name || 'Bronze'}</p>
                    <p className="text-[11px] text-white/40">{total360Locked.toLocaleString()} NCTR locked</p>
                  </div>
                </div>
              </div>

              <div
                className="rounded-lg p-3"
                style={{
                  background: wouldLevelUp ? 'rgba(200,255,0,0.06)' : 'rgba(255,255,255,0.04)',
                  border: wouldLevelUp ? '1px solid rgba(200,255,0,0.2)' : '1px solid transparent',
                }}
              >
                <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">New Status</p>
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{ background: TIER_COLORS[(newTier?.tier_name || newTier?.display_name || '').toLowerCase()] || TIER_COLORS[tierName] }}
                  >
                    {newTier?.badge_emoji || tier?.badge_emoji}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{newTier?.display_name || tier?.display_name}</p>
                    <p className="text-[11px] text-white/40">{newLocked.toLocaleString()} NCTR locked</p>
                  </div>
                </div>
              </div>
            </div>

            {wouldLevelUp ? (
              <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)' }}>
                <p className="text-sm font-bold" style={{ color: '#C8FF00' }}>
                  🎉 You will reach {newTier?.display_name}!
                </p>
              </div>
            ) : newNextTier ? (
              <p className="text-xs text-white/50 text-center">
                {nctrToNewNext.toLocaleString()} more NCTR to reach{' '}
                <span className="font-semibold text-white/70">{newNextTier.display_name}</span>
              </p>
            ) : (
              <p className="text-xs text-white/50 text-center">You've reached the highest Crescendo status!</p>
            )}
          </div>

          {/* Confirm button */}
          {is360Required ? (
            <Button
              className="w-full h-12 font-semibold text-base"
              style={{ background: '#C8FF00', color: '#1A1A2E' }}
              onClick={handleConfirm}
            >
              Lock {amount360.toLocaleString()} NCTR for 360 Days
            </Button>
          ) : (
            <Button
              className={cn(
                'w-full font-semibold transition-all',
                selected === '360lock' ? 'h-12 text-base' : 'h-10 text-sm'
              )}
              style={
                selected === '360lock'
                  ? { background: '#C8FF00', color: '#1A1A2E' }
                  : { background: 'rgba(255,255,255,0.15)', color: '#fff' }
              }
              onClick={handleConfirm}
            >
              {selected === '360lock'
                ? `Lock ${amount360.toLocaleString()} NCTR for 360 Days`
                : `Lock ${amount90.toLocaleString()} NCTR for 90 Days`
              }
            </Button>
          )}

          {/* SECTION 4 — FAQ Accordion */}
          <div className="space-y-0 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {faqs.map((faq, i) => (
              <div key={i} className={cn(i > 0 && 'border-t border-white/5')}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-sm text-white/70 font-medium pr-4">{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-white/30 shrink-0 transition-transform',
                      openFaq === i && 'rotate-180'
                    )}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-xs text-white/50 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 360LOCK Celebratory Confirmation ─── */
function Lock360Celebration({
  amount,
  tierName,
  tierEmoji,
  tierColor,
  unlockDate,
  onViewRewards,
}: {
  amount: number;
  tierName: string;
  tierEmoji: string;
  tierColor: string;
  unlockDate: string;
  onViewRewards: () => void;
}) {
  const [bgFlash, setBgFlash] = useState(true);

  useEffect(() => {
    // Fire confetti on mount
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#E2FF6D', '#FFD700', '#00CED1', '#ffffff'],
    });
    // Flash lime background for 1 second then settle
    const timer = setTimeout(() => setBgFlash(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const summaryItems = [
    { label: 'Amount Locked', value: `${amount.toLocaleString()} NCTR` },
    { label: 'Lock Duration', value: '360 Days' },
    { label: 'Status Tier', value: tierName, isBadge: true, badgeColor: tierColor, badgeEmoji: tierEmoji },
    { label: 'Unlock Date', value: unlockDate },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-colors duration-1000"
      style={{ background: bgFlash ? '#E2FF6D' : '#323232' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-8 text-center space-y-6 animate-scale-in"
        style={{ background: '#323232', border: '1px solid rgba(226,255,109,0.15)' }}
      >
        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            🔒 Locked & Loaded!
          </h1>
          <p className="text-base text-white/80">
            Your <span className="font-bold" style={{ color: '#E2FF6D' }}>{amount.toLocaleString()} NCTR</span> is committed for 360 days.
          </p>
          <p className="text-sm" style={{ color: '#5A5A58' }}>
            Your {tierName} status is now active. Your rewards are waiting below.
          </p>
        </div>

        {/* Lock Summary — 4 items in a row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="rounded-xl p-3 space-y-1"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-[10px] uppercase tracking-wider" style={{ color: '#5A5A58' }}>
                {item.label}
              </p>
              {item.isBadge ? (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: item.badgeColor, color: '#323232' }}
                >
                  {item.badgeEmoji} {item.value}
                </span>
              ) : (
                <p className="text-sm font-bold text-white">{item.value}</p>
              )}
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          className="w-full h-14 text-base font-bold rounded-xl"
          style={{ background: '#E2FF6D', color: '#323232' }}
          onClick={onViewRewards}
        >
          View My Rewards
        </Button>
      </div>
    </div>
  );
}

/* Shared status bar for success phase */
function StatusBar({
  newTier,
  newNextTier,
  newLocked,
  nctrToNewNext,
  barColor,
}: {
  newTier: any;
  newNextTier: any;
  newLocked: number;
  nctrToNewNext: number;
  barColor: string;
}) {
  return (
    <div className="space-y-2 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <div className="flex justify-between text-xs text-white/60">
        <span>{newTier?.badge_emoji} {newTier?.display_name}</span>
        {newNextTier && <span>{newNextTier.badge_emoji} {newNextTier.display_name}</span>}
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            background: barColor,
            width: newNextTier
              ? `${Math.min(100, ((newLocked - newTier!.min_nctr_360_locked) / (newNextTier.min_nctr_360_locked - newTier!.min_nctr_360_locked)) * 100)}%`
              : '100%',
          }}
        />
      </div>
      {newNextTier && (
        <p className="text-xs text-white/50">
          {nctrToNewNext.toLocaleString()} NCTR to {newNextTier.display_name}
        </p>
      )}
    </div>
  );
}

/* Required 360LOCK view (merch bounties) */
function Required360View({
  amount360,
  multiplier,
  calc360,
  statusMultiplier,
  tierName,
  baseAmount,
}: {
  amount360: number;
  multiplier: number;
  calc360: any;
  statusMultiplier: number;
  tierName: string;
  baseAmount: number;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-white/60 text-center">
        This bounty requires 360LOCK commitment.
      </p>
      <div
        className="rounded-xl p-5 border-2 text-center space-y-2"
        style={{ borderColor: '#C8FF00', background: 'rgba(200,255,0,0.04)' }}
      >
        <div className="flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" style={{ color: '#C8FF00' }} />
          <span className="font-bold text-white">360LOCK</span>
        </div>
        <p className="text-xs text-white/40">Locked for 360 days</p>
        <p className="text-3xl font-bold" style={{ color: '#C8FF00' }}>
          {amount360.toLocaleString()} NCTR
        </p>
        <div className="space-y-1 text-xs text-white/50">
          <p>{baseAmount.toLocaleString()} base</p>
          {calc360.merchBonus > 1 && <p>× {calc360.merchBonus}x merch 360LOCK bonus</p>}
          {statusMultiplier > 1 && (
            <p>× {statusMultiplier}x <span className="capitalize">{tierName}</span> status multiplier</p>
          )}
        </div>
        <p className="text-xs text-white/40">
          +{amount360.toLocaleString()} toward your Crescendo status
        </p>
      </div>
      <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <Info className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
        <p className="text-xs text-white/50">
          Why 360LOCK only? Merch bounties reward commitment. The {calc360.merchBonus > 1 ? `${calc360.merchBonus}x merch bonus` : `${multiplier}x multiplier`} is built in.
          {statusMultiplier > 1 && ` Your ${tierName} status adds ${statusMultiplier}x on top.`}
        </p>
      </div>
    </div>
  );
}
