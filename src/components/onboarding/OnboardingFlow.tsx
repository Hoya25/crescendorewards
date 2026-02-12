import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const LIME = '#AAFF00';
const DARK_BG = '#1A1A1A';
const DARK_CARD = '#242424';
const DARK_BORDER = '#333333';

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [screen, setScreen] = useState(0);
  const navigate = useNavigate();
  const { profile, refreshUnifiedProfile, updateUnifiedProfile } = useUnifiedUser();
  const totalScreens = 4;

  // Screen 4 state
  const [displayName, setDisplayName] = useState('');
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [animatedNCTR, setAnimatedNCTR] = useState(25); // starts at 25 (signup)
  const animationRef = useRef<number | null>(null);

  const animateNCTR = useCallback((from: number, to: number) => {
    const duration = 600;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedNCTR(Math.round(from + (to - from) * eased));
      if (progress < 1) animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleNameSubmit = useCallback(async () => {
    if (!displayName.trim() || !profile) return;
    try {
      await updateUnifiedProfile({ display_name: displayName.trim() });
      setNameSubmitted(true);
      animateNCTR(25, 35);
    } catch (err) {
      console.error('Error updating name:', err);
    }
  }, [displayName, profile, updateUnifiedProfile, animateNCTR]);

  const completeOnboarding = useCallback(async () => {
    if (!profile) return;

    try {
      // Mark onboarding complete
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

      const totalBonus = nameSubmitted ? 35 : 25;

      if (!(profileCheck as any)?.signup_bonus_awarded) {
        const currentAvailable = (profile.crescendo_data?.available_nctr as number) || 0;
        await supabase
          .from('unified_profiles')
          .update({
            signup_bonus_awarded: true,
            crescendo_data: {
              ...profile.crescendo_data,
              available_nctr: currentAvailable + totalBonus,
            },
          } as any)
          .eq('id', profile.id);

        // Record transactions
        await supabase.from('cross_platform_activity_log').insert([
          {
            user_id: profile.id,
            platform: 'crescendo',
            action_type: 'signup_bonus',
            action_data: { amount: 25, type: 'signup_bonus', description: 'Welcome to Crescendo' },
          },
          ...(nameSubmitted ? [{
            user_id: profile.id,
            platform: 'crescendo',
            action_type: 'profile_completion',
            action_data: { amount: 10, type: 'profile_completion', description: 'Profile completed during onboarding' },
          }] : []),
        ]);
      }

      await refreshUnifiedProfile();
    } catch (err) {
      console.error('Error completing onboarding:', err);
    }

    onComplete();

    // Navigate based on selected path
    if (selectedPath === 'garden') {
      window.open('https://thegarden.nctr.live/', '_blank');
      navigate('/dashboard');
    } else if (selectedPath === 'merch') {
      window.open('https://nctr-merch.myshopify.com', '_blank');
      navigate('/dashboard');
    } else if (selectedPath === 'bounties') {
      navigate('/bounties');
    } else {
      navigate('/dashboard');
    }

    const totalBonus = nameSubmitted ? 35 : 25;
    toast.success(`🎉 You earned ${totalBonus} NCTR! Welcome to Crescendo.`);
  }, [profile, refreshUnifiedProfile, onComplete, navigate, nameSubmitted, selectedPath]);

  const handleSkip = useCallback(async () => {
    if (!profile) return;
    try {
      await supabase
        .from('unified_profiles')
        .update({ has_completed_onboarding: true } as any)
        .eq('id', profile.id);

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

        await supabase.from('cross_platform_activity_log').insert({
          user_id: profile.id,
          platform: 'crescendo',
          action_type: 'signup_bonus',
          action_data: { amount: 25, type: 'signup_bonus', description: 'Welcome to Crescendo' },
        });
      }

      await refreshUnifiedProfile();
    } catch (err) {
      console.error('Error skipping onboarding:', err);
    }

    onComplete();
    navigate('/dashboard');
    toast.success('Welcome to Crescendo! 🎉');
  }, [profile, refreshUnifiedProfile, onComplete, navigate]);

  const next = () => {
    if (screen < totalScreens - 1) setScreen(s => s + 1);
  };

  const canComplete = displayName.trim().length > 0 && selectedPath !== null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: DARK_BG }}>
      <div className="relative w-full max-w-[480px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {screen === 0 && <ScreenWelcome onNext={next} onSkip={handleSkip} />}
              {screen === 1 && <ScreenEarn onNext={next} onSkip={handleSkip} />}
              {screen === 2 && <ScreenCommit onNext={next} onSkip={handleSkip} />}
              {screen === 3 && (
                <ScreenFirstEarn
                  displayName={displayName}
                  setDisplayName={setDisplayName}
                  nameSubmitted={nameSubmitted}
                  onNameSubmit={handleNameSubmit}
                  selectedPath={selectedPath}
                  setSelectedPath={setSelectedPath}
                  animatedNCTR={animatedNCTR}
                  canComplete={canComplete}
                  onComplete={completeOnboarding}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 py-5">
          {Array.from({ length: totalScreens }).map((_, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full transition-all duration-300"
              style={{
                backgroundColor: i === screen ? LIME : i < screen ? `${LIME}66` : '#555',
                transform: i === screen ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────

function CTAButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full md:w-[300px] mx-auto block py-4 rounded-xl font-bold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        backgroundColor: disabled ? '#555' : LIME,
        color: disabled ? '#999' : DARK_BG,
      }}
    >
      {children}
    </button>
  );
}

function SkipLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="block mx-auto mt-3 text-sm transition-colors"
      style={{ color: '#888' }}
    >
      Skip
    </button>
  );
}

// ─── Screen 1: Welcome ──────────────────────────────────────

function ScreenWelcome({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="px-6 md:px-8 pt-12 pb-6 text-center">
      <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: LIME }}>
        NCTR ALLIANCE
      </p>

      {/* Animated icon */}
      <div className="w-24 h-24 mx-auto mb-8 relative">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: `2px solid ${LIME}33` }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{ border: `2px solid ${LIME}55` }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0.2, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />
        <div
          className="absolute inset-4 rounded-full flex items-center justify-center text-3xl"
          style={{ backgroundColor: `${LIME}15`, border: `2px solid ${LIME}44` }}
        >
          🧑
        </div>
      </div>

      <h1 className="text-3xl font-bold text-white mb-3">Welcome to Crescendo</h1>
      <p className="text-base mb-4" style={{ color: '#ccc' }}>
        The rewards program that pays you to participate.
      </p>
      <p className="text-sm leading-relaxed mb-10" style={{ color: '#999' }}>
        Most rewards programs reward spending. Crescendo rewards contribution. The more you
        participate and commit, the more you earn.
      </p>

      <CTAButton onClick={onNext}>How It Works →</CTAButton>
      <SkipLink onClick={onSkip} />
    </div>
  );
}

// ─── Screen 2: Earn ─────────────────────────────────────────

function ScreenEarn({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const cards = [
    { emoji: '🛍️', title: 'Shop The Garden', desc: '6,000+ brands. Same prices. You earn NCTR.' },
    { emoji: '👕', title: 'Rep the Brand', desc: 'Buy NCTR merch. Unlock content bounties. Earn 3x.' },
    { emoji: '📸', title: 'Complete Bounties', desc: 'Create content, refer friends, hit milestones. Get paid in NCTR.' },
    { emoji: '🤝', title: 'Invite Friends', desc: 'They join, you both earn. Simple.' },
  ];

  return (
    <div className="px-6 md:px-8 pt-12 pb-6 text-center">
      <h1 className="text-3xl font-bold text-white mb-2">Earn NCTR Your Way</h1>
      <p className="text-sm mb-8" style={{ color: '#999' }}>
        Four ways to earn — pick what fits your life.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {cards.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl p-4 text-left"
            style={{ backgroundColor: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}
          >
            <div className="text-2xl mb-2">{c.emoji}</div>
            <h3 className="font-semibold text-sm text-white mb-1">{c.title}</h3>
            <p className="text-xs leading-relaxed" style={{ color: '#999' }}>{c.desc}</p>
          </motion.div>
        ))}
      </div>

      <CTAButton onClick={onNext}>What Do I Do With NCTR? →</CTAButton>
      <SkipLink onClick={onSkip} />
    </div>
  );
}

// ─── Screen 3: Commit ───────────────────────────────────────

function ScreenCommit({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const tiers = [
    { emoji: '🥉', name: 'Bronze', desc: 'Just getting started' },
    { emoji: '🥈', name: 'Silver', desc: 'Unlocks Tier 2 bounties + better rewards' },
    { emoji: '🥇', name: 'Gold', desc: 'Unlocks campaign bounties worth up to 3,000 NCTR' },
    { emoji: '💎', name: 'Platinum', desc: 'Premium access + exclusive experiences' },
    { emoji: '👑', name: 'Diamond', desc: 'Top tier. Maximum rewards. Community leader.' },
  ];

  return (
    <div className="px-6 md:px-8 pt-12 pb-6 text-center">
      <h1 className="text-3xl font-bold text-white mb-2">Commit More, Unlock More</h1>
      <p className="text-sm mb-6" style={{ color: '#999' }}>
        Your NCTR is always yours. Locking it is a commitment, not a cost.
      </p>

      {/* Tier ladder */}
      <div className="space-y-2 mb-6">
        {tiers.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-left"
            style={{ backgroundColor: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}
          >
            <span className="text-xl flex-shrink-0">{t.emoji}</span>
            <div className="min-w-0">
              <span className="font-semibold text-sm text-white">{t.name}</span>
              <span className="text-xs ml-2" style={{ color: '#888' }}>— {t.desc}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 360LOCK callout */}
      <div
        className="rounded-xl p-4 mb-8 text-left"
        style={{ backgroundColor: `${LIME}10`, border: `1px solid ${LIME}33` }}
      >
        <p className="text-sm leading-relaxed" style={{ color: '#ccc' }}>
          <span className="font-bold" style={{ color: LIME }}>The secret:</span>{' '}
          Choose 360LOCK when you earn and your rewards are multiplied 3x. Lock longer = earn more = level up faster.
        </p>
      </div>

      <CTAButton onClick={onNext}>Let's Earn Your First NCTR →</CTAButton>
      <SkipLink onClick={onSkip} />
    </div>
  );
}

// ─── Screen 4: First Earn ───────────────────────────────────

interface ScreenFirstEarnProps {
  displayName: string;
  setDisplayName: (v: string) => void;
  nameSubmitted: boolean;
  onNameSubmit: () => void;
  selectedPath: string | null;
  setSelectedPath: (v: string) => void;
  animatedNCTR: number;
  canComplete: boolean;
  onComplete: () => void;
}

function ScreenFirstEarn({
  displayName,
  setDisplayName,
  nameSubmitted,
  onNameSubmit,
  selectedPath,
  setSelectedPath,
  animatedNCTR,
  canComplete,
  onComplete,
}: ScreenFirstEarnProps) {
  const paths = [
    { id: 'garden', emoji: '🛍️', label: 'Shop The Garden' },
    { id: 'merch', emoji: '👕', label: 'Browse NCTR Merch' },
    { id: 'bounties', emoji: '📸', label: 'See Available Bounties' },
  ];

  return (
    <div className="px-6 md:px-8 pt-12 pb-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Let's make it official.</h1>
        <p className="text-sm" style={{ color: '#999' }}>
          Complete your profile and earn your first NCTR right now.
        </p>
      </div>

      {/* Checklist */}
      <div className="space-y-3 mb-6">
        {/* Item 1: Signed up — auto-complete */}
        <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: LIME }}>
            <Check className="w-4 h-4" style={{ color: DARK_BG }} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-white line-through opacity-70">Signed up for Crescendo</span>
          </div>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: `${LIME}20`, color: LIME }}
          >
            +25 NCTR
          </motion.span>
        </div>

        {/* Item 2: Display name */}
        <div className="rounded-xl px-4 py-3" style={{ backgroundColor: DARK_CARD, border: `1px solid ${nameSubmitted ? LIME : DARK_BORDER}` }}>
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: nameSubmitted ? LIME : 'transparent',
                border: nameSubmitted ? 'none' : '2px solid #555',
              }}
            >
              {nameSubmitted && <Check className="w-4 h-4" style={{ color: DARK_BG }} />}
            </div>
            <span className={cn('text-sm flex-1', nameSubmitted ? 'line-through opacity-70' : '')} style={{ color: '#fff' }}>
              Add your display name
            </span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: `${LIME}20`, color: LIME }}
            >
              +10 NCTR
            </span>
          </div>
          {!nameSubmitted && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="flex gap-2 mt-3"
            >
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="flex-1 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:ring-1"
                style={{ backgroundColor: '#333', border: `1px solid ${DARK_BORDER}` }}
                onKeyDown={(e) => e.key === 'Enter' && displayName.trim() && onNameSubmit()}
              />
              <button
                onClick={onNameSubmit}
                disabled={!displayName.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-30"
                style={{ backgroundColor: LIME, color: DARK_BG }}
              >
                Save
              </button>
            </motion.div>
          )}
        </div>

        {/* Item 3: Choose path */}
        <div className="rounded-xl px-4 py-3" style={{ backgroundColor: DARK_CARD, border: `1px solid ${selectedPath ? LIME : DARK_BORDER}` }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: selectedPath ? LIME : 'transparent',
                border: selectedPath ? 'none' : '2px solid #555',
              }}
            >
              {selectedPath && <Check className="w-4 h-4" style={{ color: DARK_BG }} />}
            </div>
            <span className={cn('text-sm flex-1', selectedPath ? 'text-white' : '')} style={{ color: selectedPath ? undefined : '#fff' }}>
              Choose your first earning path
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {paths.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPath(p.id)}
                className="rounded-lg px-2 py-3 text-center transition-all"
                style={{
                  backgroundColor: selectedPath === p.id ? `${LIME}15` : '#333',
                  border: `1px solid ${selectedPath === p.id ? LIME : DARK_BORDER}`,
                }}
              >
                <div className="text-xl mb-1">{p.emoji}</div>
                <div className="text-[11px] leading-tight" style={{ color: selectedPath === p.id ? LIME : '#bbb' }}>
                  {p.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Running total */}
      <div className="text-center mb-6">
        <p className="text-sm" style={{ color: '#999' }}>
          Your NCTR:{' '}
          <span className="text-2xl font-bold" style={{ color: LIME }}>
            {animatedNCTR}
          </span>
        </p>
        <p className="text-xs mt-1" style={{ color: '#666' }}>
          This NCTR is yours. After onboarding you'll choose how to lock it.
        </p>
      </div>

      <CTAButton onClick={onComplete} disabled={!canComplete}>
        Enter Crescendo →
      </CTAButton>
    </div>
  );
}
