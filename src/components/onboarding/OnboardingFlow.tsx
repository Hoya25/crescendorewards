import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';

const ONBOARDED_KEY = 'crescendo_onboarded';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const ACCENT = '#E2FF6D';
const DARK_BG = '#323232';
const MID_GREY = '#5A5A58';

const tierLadder = [
  { emoji: '💎', name: 'Diamond', desc: 'Top tier — VIP event access, maximum rewards' },
  { emoji: '🥇', name: 'Platinum', desc: 'Priority opportunities, premium partner perks' },
  { emoji: '🥈', name: 'Gold', desc: 'Exclusive partner discounts, enhanced earning' },
  { emoji: '🥉', name: 'Silver', desc: 'Bonus rewards, community recognition' },
  { emoji: '🟫', name: 'Bronze', desc: 'Starting tier — your journey begins here' },
];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { profile, refreshUnifiedProfile } = useUnifiedUser();
  const totalSteps = 3;

  const completeOnboarding = useCallback(async () => {
    localStorage.setItem(ONBOARDED_KEY, 'true');

    if (profile) {
      try {
        await supabase
          .from('unified_profiles')
          .update({ has_completed_onboarding: true } as any)
          .eq('id', profile.id);

        // Award signup bonus if not already awarded
        const { data: profileCheck } = await supabase
          .from('unified_profiles')
          .select('signup_bonus_awarded' as any)
          .eq('id', profile.id)
          .single();

        if (!(profileCheck as any)?.signup_bonus_awarded) {
          const currentAvailable = (profile.crescendo_data?.available_nctr as number) || 0;
          await supabase
            .from('unified_profiles')
            .update({
              signup_bonus_awarded: true,
              crescendo_data: {
                ...profile.crescendo_data,
                available_nctr: currentAvailable + 25,
              },
            } as any)
            .eq('id', profile.id);

          const authUserId = profile.auth_user_id;
          if (authUserId) {
            await supabase
              .from('profiles')
              .update({
                has_claimed_signup_bonus: true,
                claim_balance: (profile.crescendo_data?.claim_balance as number || 0) + 5,
              })
              .eq('id', authUserId);
          }

          await supabase.from('nctr_transactions').insert({
            user_id: profile.id,
            source: 'signup_bonus',
            base_amount: 25,
            status_multiplier: 1,
            merch_lock_multiplier: 1,
            final_amount: 25,
            notes: 'Welcome to Crescendo — 25 NCTR + 5 Claims',
            lock_type: '360lock',
          });

          await supabase.from('cross_platform_activity_log').insert({
            user_id: profile.id,
            platform: 'crescendo',
            action_type: 'signup_bonus',
            action_data: { amount: 25, type: 'signup_bonus', nctr: 25, claims: 5, description: 'Welcome to Crescendo' },
          });
        }

        await refreshUnifiedProfile();
      } catch (err) {
        console.error('Error completing onboarding:', err);
      }
    }

    onComplete();
    toast.success('Welcome! You received 5 free Claims 🎉');
  }, [profile, refreshUnifiedProfile, onComplete]);

  const next = () => step < totalSteps - 1 && setStep(s => s + 1);
  const prev = () => step > 0 && setStep(s => s - 1);

  const handleFinalAction = useCallback(async (path: string) => {
    await completeOnboarding();
    if (path.startsWith('http')) {
      window.open(path, '_blank');
      navigate('/dashboard');
    } else {
      navigate(path);
    }
  }, [completeOnboarding, navigate]);

  const stepButtons: Record<number, string> = {
    0: 'Show Me How →',
    1: 'How Do I Level Up? →',
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
    >
      <div
        className="relative w-full sm:max-w-[480px] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh]"
        style={{ backgroundColor: DARK_BG }}
      >
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 pt-8 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {step === 0 && <StepWelcome />}
              {step === 1 && <StepStatus />}
              {step === 2 && <StepLock onAction={handleFinalAction} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom: buttons + progress dots */}
        <div className="px-6 sm:px-8 pb-6 pt-2 space-y-4">
          {/* Step buttons */}
          {step < 2 ? (
            <button
              onClick={next}
              className="w-full py-3.5 rounded-xl font-bold text-base transition-all hover:brightness-110"
              style={{ backgroundColor: ACCENT, color: DARK_BG }}
            >
              {stepButtons[step]}
            </button>
          ) : null}

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 24 : 8,
                  backgroundColor: i === step ? ACCENT : i < step ? `${ACCENT}88` : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Welcome ─────────────────────────────────────────

function StepWelcome() {
  return (
    <div className="text-center space-y-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-5xl"
      >
        🎵
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-white"
      >
        Welcome to Crescendo
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-sm leading-relaxed max-w-sm mx-auto"
        style={{ color: '#ccc' }}
      >
        Crescendo is your status and rewards platform. Your status level — Bronze through Diamond — determines every reward, opportunity, and benefit available to you.
      </motion.p>
    </div>
  );
}

// ─── Step 2: Status Explained ────────────────────────────────

function StepStatus() {
  return (
    <div className="text-center space-y-5">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-white"
      >
        Your Status Unlocks Everything
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-sm max-w-sm mx-auto"
        style={{ color: '#ccc' }}
      >
        The higher your status, the more you access. Every tier opens new rewards, opportunities, and benefits.
      </motion.p>

      {/* Vertical tier ladder */}
      <div className="space-y-2 text-left">
        {tierLadder.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="flex items-start gap-3 rounded-xl px-4 py-3"
            style={{
              background: i === tierLadder.length - 1 ? `${ACCENT}12` : 'rgba(255,255,255,0.04)',
              border: i === tierLadder.length - 1 ? `1px solid ${ACCENT}33` : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span className="text-xl leading-none mt-0.5">{t.emoji}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{t.name}</p>
              <p className="text-xs" style={{ color: MID_GREY }}>{t.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 3: 360LOCK Explained ───────────────────────────────

function StepLock({ onAction }: { onAction: (path: string) => void }) {
  return (
    <div className="text-center space-y-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-5xl"
      >
        🔒
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-white"
      >
        Level Up with 360LOCK
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-sm leading-relaxed max-w-sm mx-auto"
        style={{ color: '#ccc' }}
      >
        Commit your NCTR for 360 days and your status activates instantly. The more NCTR you commit, the higher your tier. Earn NCTR by shopping in The Garden.
      </motion.p>

      {/* Two buttons side by side */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex flex-col sm:flex-row gap-3 pt-2"
      >
        <button
          onClick={() => onAction('/membership')}
          className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all hover:brightness-110"
          style={{ backgroundColor: ACCENT, color: DARK_BG }}
        >
          Check My Status →
        </button>
        <button
          onClick={() => onAction('https://thegarden.nctr.live')}
          className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all hover:brightness-110 border"
          style={{ backgroundColor: 'transparent', color: ACCENT, borderColor: `${ACCENT}66` }}
        >
          Earn NCTR in The Garden →
        </button>
      </motion.div>
    </div>
  );
}

export default OnboardingFlow;
