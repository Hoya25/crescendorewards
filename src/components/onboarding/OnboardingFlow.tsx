import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [screen, setScreen] = useState(0);
  const navigate = useNavigate();
  const { profile, refreshUnifiedProfile } = useUnifiedUser();
  const totalScreens = 5;

  const completeOnboarding = useCallback(async (navigateTo?: string) => {
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

      if (!(profileCheck as any)?.signup_bonus_awarded) {
        // Update available NCTR in crescendo_data
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

        // Record the transaction in cross_platform_activity_log
        await supabase.from('cross_platform_activity_log').insert({
          user_id: profile.id,
          platform: 'crescendo',
          action_type: 'signup_bonus',
          action_data: { amount: 25, type: 'signup_bonus' },
        });

        setTimeout(() => {
          toast.success('🎉 +25 NCTR earned for joining Crescendo!');
        }, 800);
      }

      await refreshUnifiedProfile();
    } catch (err) {
      console.error('Error completing onboarding:', err);
    }

    onComplete();

    if (navigateTo) {
      navigate(navigateTo);
    }

    toast.success('Welcome to Crescendo! 🎉');
  }, [profile, refreshUnifiedProfile, onComplete, navigate]);

  const next = () => {
    if (screen < totalScreens - 1) setScreen(s => s + 1);
  };

  const screens = [
    <ScreenWelcome key="welcome" onNext={next} />,
    <ScreenEarn key="earn" onNext={next} />,
    <ScreenCommit key="commit" onNext={next} />,
    <ScreenLevelUp key="levelup" onNext={next} />,
    <ScreenFirstNCTR key="first" onAction={completeOnboarding} />,
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-[480px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Skip button */}
        <button
          onClick={() => completeOnboarding()}
          className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"
        >
          Skip <X className="w-3.5 h-3.5" />
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {screens[screen]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 py-4 border-t">
          {Array.from({ length: totalScreens }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === screen
                  ? 'bg-cta scale-110'
                  : i < screen
                  ? 'bg-cta/40'
                  : 'bg-muted-foreground/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Screen Components ───────────────────────────────────────

function ScreenWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="p-6 md:p-8 text-center">
      <div className="text-5xl mb-6 leading-none">🎉🏆💰</div>
      <h2 className="text-2xl font-bold mb-3 text-foreground">
        Welcome to Crescendo
      </h2>
      <p className="text-lg font-semibold text-foreground mb-2">
        The Rewards Program That Rewards YOU
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed mb-2">
        Crescendo is different. You don't just spend money to earn points. You earn NCTR by
        participating — shopping, creating content, repping the brand, and contributing to the
        community.
      </p>
      <p className="text-xs text-muted-foreground/70 mb-8">
        And you actually own what you earn.
      </p>
      <CTAButton onClick={onNext}>How It Works →</CTAButton>
    </div>
  );
}

function ScreenEarn({ onNext }: { onNext: () => void }) {
  const cards = [
    { emoji: '🛍️', title: 'Shop The Garden', desc: '6,000+ brands. Same prices. You earn NCTR.' },
    { emoji: '👕', title: 'Buy & Rep Merch', desc: 'Buy NCTR gear. Complete photo/video bounties. Earn big.' },
    { emoji: '📸', title: 'Complete Bounties', desc: 'Content challenges that pay NCTR. Photos, videos, reviews.' },
    { emoji: '🤝', title: 'Invite Friends', desc: 'Both of you earn NCTR when they join.' },
  ];

  return (
    <div className="p-6 md:p-8 text-center">
      <h2 className="text-2xl font-bold mb-6 text-foreground">How You Earn NCTR</h2>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {cards.map((c) => (
          <div key={c.title} className="bg-muted/50 rounded-xl p-4 text-left border">
            <div className="text-2xl mb-2">{c.emoji}</div>
            <h3 className="font-semibold text-sm text-foreground mb-1">{c.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mb-6 italic">
        Every NCTR you earn is yours. Now here's where it gets interesting...
      </p>
      <CTAButton onClick={onNext}>Next →</CTAButton>
    </div>
  );
}

function ScreenCommit({ onNext }: { onNext: () => void }) {
  return (
    <div className="p-6 md:p-8 text-center">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Commit More. Earn More.</h2>

      <div className="flex gap-3 mb-6">
        {/* 90-day option */}
        <div className="flex-1 bg-muted/50 rounded-xl p-4 border border-border/50 opacity-70">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Lock 90 Days</p>
          <p className="text-2xl font-bold text-foreground mb-1">250</p>
          <p className="text-xs text-muted-foreground">NCTR</p>
          <span className="inline-block mt-2 text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
            Standard
          </span>
        </div>
        {/* 360-day option */}
        <div className="flex-1 bg-cta/5 rounded-xl p-4 border-2 border-cta relative">
          <p className="text-xs font-semibold text-cta-foreground uppercase mb-2">Lock 360 Days</p>
          <p className="text-2xl font-bold text-foreground mb-1">750</p>
          <p className="text-xs text-muted-foreground">NCTR (3x!)</p>
          <span className="inline-block mt-2 text-[10px] bg-cta/20 text-foreground px-2 py-0.5 rounded-full font-semibold">
            360LOCK ⭐
          </span>
        </div>
      </div>

      <h3 className="font-bold text-sm mb-2 text-foreground">
        Same effort. Different commitment. 3x the reward.
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
        When you earn NCTR, you choose how long to commit it. Lock for 360 days and you earn 3x.
        Your NCTR stays yours — it's just committed, not spent.
      </p>
      <p className="text-xs text-muted-foreground/70 italic mb-6">
        And the more NCTR you lock, the higher your Crescendo status climbs...
      </p>
      <CTAButton onClick={onNext}>Next →</CTAButton>
    </div>
  );
}

function ScreenLevelUp({ onNext }: { onNext: () => void }) {
  const tiers = [
    { emoji: '🥉', name: 'Bronze' },
    { emoji: '🥈', name: 'Silver' },
    { emoji: '🥇', name: 'Gold' },
    { emoji: '💎', name: 'Platinum' },
    { emoji: '👑', name: 'Diamond' },
  ];

  return (
    <div className="p-6 md:p-8 text-center">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Level Up Your Status</h2>

      <div className="flex items-center justify-center gap-1 mb-6 flex-wrap">
        {tiers.map((t, i) => (
          <div key={t.name} className="flex items-center">
            {i > 0 && <span className="text-muted-foreground mx-0.5">→</span>}
            <div className="flex flex-col items-center">
              <span className="text-2xl">{t.emoji}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{t.name}</span>
            </div>
          </div>
        ))}
      </div>

      <h3 className="font-bold text-sm mb-2 text-foreground">Higher Status = Better Rewards</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
        Your Crescendo status is based on how much NCTR you have locked. Higher status unlocks
        exclusive bounties, premium rewards, and opportunities that lower tiers can't access.
      </p>

      <div className="bg-muted/50 rounded-xl p-4 border text-left mb-6">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Example:</strong> Bronze members get Tier 1 bounties.
          Silver unlocks Tier 2 (worth up to 1,500 NCTR each). Gold unlocks Tier 3 campaign bounties
          (up to 3,000 NCTR each).
        </p>
      </div>

      <CTAButton onClick={onNext}>Let's Get Started! 🚀</CTAButton>
    </div>
  );
}

function ScreenFirstNCTR({ onAction }: { onAction: (nav?: string) => void }) {
  const actions = [
    {
      emoji: '👤',
      title: 'Complete Your Profile',
      reward: '+25 NCTR',
      subtitle: 'Add your name and avatar. Takes 30 seconds.',
      nav: '/profile',
    },
    {
      emoji: '🏪',
      title: 'Browse The Garden',
      reward: 'Earn NCTR shopping',
      subtitle: 'See 6,000+ brands where you earn NCTR.',
      nav: '/brands',
    },
    {
      emoji: '🎁',
      title: 'Browse Rewards',
      reward: 'See what you can unlock',
      subtitle: "See what\'s waiting for you as you level up.",
      nav: '/rewards',
    },
  ];

  return (
    <div className="p-6 md:p-8 text-center">
      <h2 className="text-2xl font-bold mb-2 text-foreground">Your First NCTR</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Let's earn your first NCTR right now
      </p>

      <div className="flex flex-col gap-3 mb-5">
        {actions.map((a) => (
          <button
            key={a.title}
            onClick={() => onAction(a.nav)}
            className="flex items-center gap-4 bg-muted/50 hover:bg-muted rounded-xl p-4 border text-left transition-colors group"
          >
            <span className="text-2xl">{a.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-sm text-foreground">{a.title}</span>
                <span className="text-[10px] font-bold text-cta bg-cta/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {a.reward}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{a.subtitle}</p>
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Don't worry — you can always find these in your dashboard.
      </p>
    </div>
  );
}

// ─── Shared CTA Button ──────────────────────────────────────

function CTAButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      className="w-full bg-cta hover:bg-cta/90 text-cta-foreground font-bold text-base rounded-xl py-5"
    >
      {children}
    </Button>
  );
}
