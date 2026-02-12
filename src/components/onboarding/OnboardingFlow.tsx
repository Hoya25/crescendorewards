import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ShoppingBag, Target, Users, X } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const LIME = '#C8FF00';
const DARK_BG = '#1A1A2E';
const DARK_CARD = '#242442';
const DARK_BORDER = '#33335a';

const TIER_COLORS = {
  Bronze: '#CD7F32',
  Silver: '#C0C0C0',
  Gold: '#FFD700',
  Platinum: '#E5E4E2',
  Diamond: '#B9F2FF',
};

const tiers = [
  { name: 'Bronze', nctr: '100+', color: TIER_COLORS.Bronze },
  { name: 'Silver', nctr: '500+', color: TIER_COLORS.Silver },
  { name: 'Gold', nctr: '2,000+', color: TIER_COLORS.Gold },
  { name: 'Platinum', nctr: '10,000+', color: TIER_COLORS.Platinum },
  { name: 'Diamond', nctr: '50,000+', color: TIER_COLORS.Diamond },
];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { profile, refreshUnifiedProfile } = useUnifiedUser();
  const totalSteps = 3;

  const completeOnboarding = useCallback(async () => {
    if (!profile) return;
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

        await supabase.from('cross_platform_activity_log').insert({
          user_id: profile.id,
          platform: 'crescendo',
          action_type: 'signup_bonus',
          action_data: { amount: 25, type: 'signup_bonus', description: 'Welcome to Crescendo' },
        });
      }

      await refreshUnifiedProfile();
    } catch (err) {
      console.error('Error completing onboarding:', err);
    }
    onComplete();
    toast.success('🎉 Welcome to Crescendo!');
  }, [profile, refreshUnifiedProfile, onComplete]);

  const handleSkip = useCallback(async () => {
    await completeOnboarding();
    navigate('/dashboard');
  }, [completeOnboarding, navigate]);

  const handleDashboard = useCallback(async () => {
    await completeOnboarding();
    navigate('/dashboard');
  }, [completeOnboarding, navigate]);

  const next = () => step < totalSteps - 1 && setStep(s => s + 1);
  const prev = () => step > 0 && setStep(s => s - 1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div
        className="relative w-full max-w-[600px] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ backgroundColor: DARK_BG }}
      >
        {/* Top bar: progress dots + skip */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 24 : 10,
                  backgroundColor: i === step ? LIME : i < step ? `${LIME}88` : '#555',
                }}
              />
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="text-xs hover:opacity-80 transition-opacity flex items-center gap-1"
            style={{ color: '#888' }}
          >
            Skip <X className="w-3 h-3" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-6">
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
              {step === 2 && (
                <StepAction
                  onNavigate={(path) => {
                    completeOnboarding();
                    if (path.startsWith('http')) {
                      window.open(path, '_blank');
                      navigate('/dashboard');
                    } else {
                      navigate(path);
                    }
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom nav */}
        <div className="flex items-center justify-between px-6 pb-5 pt-2">
          {step > 0 ? (
            <button
              onClick={prev}
              className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: '#aaa' }}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps - 1 ? (
            <button
              onClick={next}
              className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:brightness-110"
              style={{ backgroundColor: LIME, color: DARK_BG }}
            >
              Next <ArrowRight className="w-4 h-4 inline ml-1" />
            </button>
          ) : (
            <button
              onClick={handleDashboard}
              className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:brightness-110"
              style={{ backgroundColor: LIME, color: DARK_BG }}
            >
              Go to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Welcome ────────────────────────────────────────

function StepWelcome() {
  const flywheel = [
    { emoji: '💰', label: 'Earn' },
    { emoji: '🔒', label: 'Commit' },
    { emoji: '🎁', label: 'Unlock' },
  ];

  return (
    <div className="pt-6 pb-2 text-center">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-white mb-3"
      >
        Welcome to Crescendo
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-base mb-6"
        style={{ color: '#ccc' }}
      >
        The rewards marketplace built by the people, for the people.
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm leading-relaxed mb-8 max-w-md mx-auto"
        style={{ color: '#999' }}
      >
        Here is how it works: You earn NCTR by shopping, completing bounties, and participating. 
        Then you commit your NCTR through 360LOCK to level up your Crescendo Status and unlock better rewards.
      </motion.p>

      {/* Earn → Commit → Unlock */}
      <div className="flex items-center justify-center gap-3 md:gap-5">
        {flywheel.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.12 }}
            className="flex flex-col items-center"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-2"
              style={{ backgroundColor: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}
            >
              {item.emoji}
            </div>
            <span className="text-sm font-semibold text-white">{item.label}</span>
          </motion.div>
        ))}
        {/* Arrows between */}
        {[0, 1].map(i => (
          <motion.div
            key={`arrow-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute"
            style={{
              display: 'none', // hidden; arrows rendered inline via layout
            }}
          />
        ))}
      </div>

      {/* Arrows rendered inline using flexbox gaps */}
      <div className="flex items-center justify-center gap-0 mt-[-52px] mb-4 pointer-events-none">
        <div className="w-16" />
        <ArrowRight className="w-4 h-4 mx-1" style={{ color: LIME }} />
        <div className="w-16" />
        <ArrowRight className="w-4 h-4 mx-1" style={{ color: LIME }} />
        <div className="w-16" />
      </div>
    </div>
  );
}

// ─── Step 2: Status Journey ──────────────────────────────────

function StepStatus() {
  return (
    <div className="pt-6 pb-2 text-center">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-white mb-3"
      >
        Your Crescendo Status
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-sm mb-6 max-w-md mx-auto"
        style={{ color: '#999' }}
      >
        Your status is determined by how much NCTR you have locked. Higher status = access to better rewards and opportunities.
      </motion.p>

      {/* Tier progression */}
      <div className="flex items-center justify-between gap-1 mb-6 px-2">
        {tiers.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="flex flex-col items-center flex-1"
          >
            <div
              className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-1.5 shadow-lg"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${t.color}ee, ${t.color}88)`,
                border: `2px solid ${t.color}`,
              }}
            >
              <span className="text-xs md:text-sm font-bold" style={{ color: t.name === 'Platinum' || t.name === 'Silver' ? '#333' : '#fff' }}>
                {t.name[0]}
              </span>
            </div>
            <span className="text-[10px] md:text-xs font-semibold text-white">{t.name}</span>
            <span className="text-[9px] md:text-[10px]" style={{ color: '#888' }}>{t.nctr}</span>
            {i < tiers.length - 1 && (
              <div className="absolute" style={{ display: 'none' }} />
            )}
          </motion.div>
        ))}
      </div>

      {/* Arrows between tiers */}
      <div className="flex items-center justify-between px-8 -mt-[72px] mb-[42px] pointer-events-none">
        {[0, 1, 2, 3].map(i => (
          <ArrowRight key={i} className="w-3 h-3 flex-shrink-0" style={{ color: `${LIME}88` }} />
        ))}
      </div>

      {/* Highlight Bronze */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-xl p-4 text-center"
        style={{ backgroundColor: `${TIER_COLORS.Bronze}15`, border: `1px solid ${TIER_COLORS.Bronze}44` }}
      >
        <p className="text-sm" style={{ color: '#ddd' }}>
          <span className="font-bold" style={{ color: TIER_COLORS.Bronze }}>Start here!</span>{' '}
          Earn your first 100 NCTR to reach Bronze.
        </p>
      </motion.div>
    </div>
  );
}

// ─── Step 3: First Action ────────────────────────────────────

function StepAction({ onNavigate }: { onNavigate: (path: string) => void }) {
  const actions = [
    {
      icon: ShoppingBag,
      title: 'Shop The Garden',
      desc: 'Earn NCTR on every purchase from 6,000+ brands',
      cta: 'Start Shopping',
      path: 'https://thegarden.nctr.live/',
    },
    {
      icon: Target,
      title: 'Complete a Bounty',
      desc: 'Share content, earn NCTR rewards',
      cta: 'View Bounties',
      path: '/bounties',
    },
    {
      icon: Users,
      title: 'Invite a Friend',
      desc: 'Both earn 500 NCTR when they join',
      cta: 'Get Referral Link',
      path: '/invite',
    },
  ];

  return (
    <div className="pt-6 pb-2 text-center">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-white mb-3"
      >
        Ready to Start Earning?
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-sm mb-6"
        style={{ color: '#999' }}
      >
        Here are the fastest ways to earn your first NCTR:
      </motion.p>

      <div className="space-y-3">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1 }}
              className="rounded-xl p-4 flex items-start gap-4 text-left"
              style={{ backgroundColor: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${LIME}15`, border: `1px solid ${LIME}33` }}
              >
                <Icon className="w-5 h-5" style={{ color: LIME }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-white mb-0.5">{action.title}</h3>
                <p className="text-xs mb-2" style={{ color: '#999' }}>{action.desc}</p>
                <button
                  onClick={() => onNavigate(action.path)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:brightness-110"
                  style={{ backgroundColor: `${LIME}20`, color: LIME, border: `1px solid ${LIME}44` }}
                >
                  {action.cta} →
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default OnboardingFlow;
