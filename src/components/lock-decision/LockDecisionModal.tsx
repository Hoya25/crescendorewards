import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Lock, Star, ChevronRight, Sparkles, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LockDecisionRequest } from '@/contexts/LockDecisionContext';

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
  const { tier, nextTier, total360Locked, allTiers, profile } = useUnifiedUser();
  const multiplier = request.lockMultiplier || 3;
  const amount360 = request.baseAmount * multiplier;
  const is360Required = request.requires360Lock;
  
  const [selected, setSelected] = useState<'90lock' | '360lock'>('360lock');
  const [phase, setPhase] = useState<'choose' | 'success'>('choose');
  const [animatedAmount, setAnimatedAmount] = useState(request.baseAmount);
  const [showFirstTimeHint, setShowFirstTimeHint] = useState(false);
  const animRef = useRef<number>();

  // Check if first time
  useEffect(() => {
    const hasSeenLock = localStorage.getItem('crescendo_seen_lock_decision');
    if (!hasSeenLock) {
      setShowFirstTimeHint(true);
    }
  }, []);

  // Animate amount when switching to 360lock
  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    
    const target = selected === '360lock' ? amount360 : request.baseAmount;
    const start = animatedAmount;
    const duration = 400;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedAmount(Math.round(start + (target - start) * eased));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [selected]);

  const selectedAmount = selected === '360lock' ? amount360 : request.baseAmount;
  const lockDays = selected === '360lock' ? 360 : 90;

  // Status impact calculation
  const newLocked = total360Locked + selectedAmount;
  const sortedTiers = [...allTiers].sort((a, b) => a.min_nctr_360_locked - b.min_nctr_360_locked);
  const newTier = [...sortedTiers].reverse().find(t => newLocked >= t.min_nctr_360_locked) || sortedTiers[0];
  const newNextTier = sortedTiers.find(t => t.min_nctr_360_locked > newLocked) || null;
  const wouldLevelUp = newTier && tier && newTier.sort_order > tier.sort_order;
  const nctrToNewNext = newNextTier ? Math.max(0, newNextTier.min_nctr_360_locked - newLocked) : 0;

  const handleConfirm = async () => {
    // Record the lock
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

        // Update crescendo_data locked amounts
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

    // Dismiss first-time hint
    localStorage.setItem('crescendo_seen_lock_decision', 'true');

    setPhase('success');

    // Celebration for 360lock
    if (selected === '360lock') {
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#AAFF00', '#FFD700', '#00CED1'],
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

  const emoji = SOURCE_EMOJI[request.sourceType] || '⭐';

  // ─── SUCCESS PHASE ───
  if (phase === 'success') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
        <div className="w-full max-w-md rounded-2xl p-6 text-center space-y-5"
             style={{ background: '#1A1A1A' }}>
          {selected === '360lock' ? (
            <>
              <div className="text-5xl">🎉</div>
              <h2 className="text-2xl font-bold text-white">
                {selectedAmount.toLocaleString()} NCTR Locked!
              </h2>
              <p className="text-sm" style={{ color: '#AAFF00' }}>
                {multiplier}x multiplier applied
              </p>

              {/* Status bar */}
              <div className="space-y-2 p-4 rounded-xl" style={{ background: '#222' }}>
                <div className="flex justify-between text-xs text-white/60">
                  <span>{newTier?.badge_emoji} {newTier?.display_name}</span>
                  {newNextTier && <span>{newNextTier.badge_emoji} {newNextTier.display_name}</span>}
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#333' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      background: '#AAFF00',
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

              {wouldLevelUp && (
                <div className="p-3 rounded-lg border" style={{ borderColor: '#AAFF00', background: 'rgba(170,255,0,0.08)' }}>
                  <p className="text-sm font-semibold" style={{ color: '#AAFF00' }}>
                    🎉 You've reached {newTier?.display_name}!
                  </p>
                </div>
              )}

              <Button
                className="w-full font-semibold"
                style={{ background: '#AAFF00', color: '#000' }}
                onClick={handleDone}
              >
                Keep Earning →
              </Button>
            </>
          ) : (
            <>
              <div className="text-4xl">✓</div>
              <h2 className="text-xl font-bold text-white">
                {selectedAmount.toLocaleString()} NCTR Locked
              </h2>

              <div className="p-3 rounded-lg text-left" style={{ background: '#222' }}>
                <p className="text-xs text-white/60">
                  💡 <span className="font-semibold text-white/80">Tip:</span> Choose 360LOCK next time to earn {multiplier}x. It adds up fast.
                </p>
              </div>

              {/* Status bar */}
              <div className="space-y-2 p-4 rounded-xl" style={{ background: '#222' }}>
                <div className="flex justify-between text-xs text-white/60">
                  <span>{newTier?.badge_emoji} {newTier?.display_name}</span>
                  {newNextTier && <span>{newNextTier.badge_emoji} {newNextTier.display_name}</span>}
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#333' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      background: newTier?.badge_color || '#CD7F32',
                      width: newNextTier
                        ? `${Math.min(100, ((newLocked - newTier!.min_nctr_360_locked) / (newNextTier.min_nctr_360_locked - newTier!.min_nctr_360_locked)) * 100)}%`
                        : '100%',
                    }}
                  />
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full text-white border-white/20 hover:bg-white/10"
                onClick={handleDone}
              >
                Got It →
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── CHOOSE PHASE ───
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden my-4"
        style={{ background: '#1A1A1A' }}
      >
        {/* TOP: What You Earned */}
        <div className="p-6 text-center border-b border-white/10">
          <span className="text-4xl block mb-2">{emoji}</span>
          <h2 className="text-xl font-bold text-white">You earned NCTR!</h2>
          <p className="text-sm text-white/50 mt-1">{request.sourceName}</p>
          <p className="text-3xl font-bold text-white mt-3">
            {request.baseAmount.toLocaleString()} NCTR
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* First-time hint */}
          {showFirstTimeHint && !is360Required && (
            <div className="p-4 rounded-xl border border-amber-500/30" style={{ background: 'rgba(255,193,7,0.06)' }}>
              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white/90 leading-relaxed">
                    <span className="font-semibold">First time?</span> When you earn NCTR, you choose how long to lock it. Longer lock = bigger reward. Your NCTR is always yours — locking just means you're committing it for a set time. That commitment is what builds your Crescendo status.
                  </p>
                  <button
                    onClick={() => {
                      setShowFirstTimeHint(false);
                      localStorage.setItem('crescendo_seen_lock_decision', 'true');
                    }}
                    className="text-xs font-medium mt-2 hover:underline"
                    style={{ color: '#AAFF00' }}
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MIDDLE: Choose commitment */}
          {is360Required ? (
            // 360LOCK required
            <div className="space-y-3">
              <p className="text-sm text-white/60 text-center">
                This bounty requires 360LOCK commitment.
              </p>
              <div
                className="rounded-xl p-5 border-2 text-center space-y-2"
                style={{ borderColor: '#AAFF00', background: 'rgba(170,255,0,0.04)' }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" style={{ color: '#AAFF00' }} />
                  <span className="font-bold text-white">360LOCK</span>
                </div>
                <p className="text-sm text-white/60">Locked for 360 days</p>
                <p className="text-3xl font-bold" style={{ color: '#AAFF00' }}>
                  {amount360.toLocaleString()} NCTR
                </p>
                <p className="text-sm" style={{ color: '#AAFF00' }}>
                  {multiplier}x multiplier!
                </p>
                <p className="text-xs text-white/40">
                  +{amount360.toLocaleString()} toward your Crescendo status
                </p>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: '#222' }}>
                <Info className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
                <p className="text-xs text-white/50">
                  Why 360LOCK only? Merch bounties reward commitment. The {multiplier}x multiplier is built in.
                </p>
              </div>
            </div>
          ) : (
            // Choice between 90 and 360
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white/80 text-center">Choose Your Commitment</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 90LOCK */}
                <button
                  onClick={() => setSelected('90lock')}
                  className={cn(
                    'rounded-xl p-4 text-left border-2 transition-all',
                    selected === '90lock'
                      ? 'border-white/50'
                      : 'border-white/10 hover:border-white/25'
                  )}
                  style={{ background: '#222' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-white/60" />
                    <span className="font-bold text-white text-sm">90LOCK</span>
                  </div>
                  <p className="text-xs text-white/40 mb-3">Locked for 90 days</p>
                  <p className="text-2xl font-bold text-white">
                    {request.baseAmount.toLocaleString()} NCTR
                  </p>
                  <p className="text-xs text-white/40 mt-1">1x (base)</p>
                  <p className="text-xs text-white/40 mt-2">
                    +{request.baseAmount.toLocaleString()} toward status
                  </p>
                  <p className="text-[11px] text-white/30 mt-2">Unlocks sooner. Base rewards.</p>
                </button>

                {/* 360LOCK */}
                <button
                  onClick={() => setSelected('360lock')}
                  className={cn(
                    'rounded-xl p-4 text-left border-2 transition-all relative',
                    selected === '360lock'
                      ? 'shadow-lg shadow-[#AAFF00]/10'
                      : 'hover:border-[#AAFF00]/50'
                  )}
                  style={{
                    borderColor: selected === '360lock' ? '#AAFF00' : 'rgba(170,255,0,0.3)',
                    background: selected === '360lock' ? 'rgba(170,255,0,0.04)' : '#222',
                  }}
                >
                  <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold"
                       style={{ background: '#AAFF00', color: '#000' }}>
                    ★ RECOMMENDED
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4" style={{ color: '#AAFF00' }} />
                    <span className="font-bold text-white text-sm">360LOCK</span>
                  </div>
                  <p className="text-xs text-white/40 mb-3">Locked for 360 days</p>
                  <p className="text-2xl font-bold" style={{ color: '#AAFF00' }}>
                    {animatedAmount.toLocaleString()} NCTR
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#AAFF00' }}>
                    {multiplier}x multiplier!
                  </p>
                  <p className="text-xs text-white/40 mt-2">
                    +{amount360.toLocaleString()} toward status
                  </p>
                  <p className="text-[11px] text-white/30 mt-2">
                    Commit longer. Earn {multiplier}x. Level up faster.
                  </p>
                </button>
              </div>

              {/* Comparison line */}
              <div className="text-center p-3 rounded-lg" style={{ background: '#222' }}>
                <p className="text-xs text-white/60">
                  90LOCK: <span className="text-white font-medium">{request.baseAmount.toLocaleString()}</span> →
                  360LOCK: <span className="font-medium" style={{ color: '#AAFF00' }}>{amount360.toLocaleString()}</span>
                  {' — '}that's <span className="font-semibold text-white">{(amount360 - request.baseAmount).toLocaleString()} more NCTR</span> for the same effort.
                </p>
              </div>
            </div>
          )}

          {/* BOTTOM: Status impact */}
          <div className="p-4 rounded-xl space-y-2" style={{ background: '#222' }}>
            <p className="text-xs text-white/40 font-medium uppercase tracking-wider">
              What This Means For Your Status
            </p>
            <p className="text-sm text-white/70">
              Your locked NCTR:{' '}
              <span className="text-white font-medium">{total360Locked.toLocaleString()}</span>
              {' → '}
              <span className="font-semibold" style={{ color: wouldLevelUp ? '#AAFF00' : 'white' }}>
                {newLocked.toLocaleString()}
              </span>
            </p>
            {wouldLevelUp ? (
              <p className="text-sm font-semibold" style={{ color: '#AAFF00' }}>
                🎉 This puts you at {newTier?.display_name}!
              </p>
            ) : (
              <p className="text-xs text-white/50">
                Status: {newTier?.badge_emoji} {newTier?.display_name} — {nctrToNewNext.toLocaleString()} NCTR away from {newNextTier?.display_name || 'max tier'}
              </p>
            )}
            <p className="text-[11px] text-white/30 mt-1">
              Your NCTR stays yours. Locking = commitment, not spending. After the lock period, your NCTR unlocks fully.
            </p>
          </div>

          {/* Confirm button */}
          {is360Required ? (
            <Button
              className="w-full h-12 font-semibold text-base"
              style={{ background: '#AAFF00', color: '#000' }}
              onClick={handleConfirm}
            >
              Lock {amount360.toLocaleString()} NCTR →
            </Button>
          ) : (
            <Button
              className={cn(
                'w-full font-semibold transition-all',
                selected === '360lock' ? 'h-12 text-base' : 'h-10 text-sm'
              )}
              style={
                selected === '360lock'
                  ? { background: '#AAFF00', color: '#000' }
                  : { background: '#444', color: '#fff' }
              }
              onClick={handleConfirm}
            >
              Lock {selectedAmount.toLocaleString()} NCTR for {lockDays} Days
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
