import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

const steps = [
  {
    emoji: '🛍️',
    title: 'Earn NCTR',
    description:
      'Shop at 6,000+ brands through The Garden. Complete content bounties. Buy and rep NCTR merch. Refer friends. Every action earns NCTR.',
  },
  {
    emoji: '🔒',
    title: 'Commit with 360LOCK',
    description:
      'Choose to lock your NCTR for 360 days and earn 3x rewards. Your NCTR stays yours — locking is commitment, not spending. The longer you commit, the more you earn.',
  },
  {
    emoji: '🏆',
    title: 'Unlock Rewards & Status',
    description:
      'Your locked NCTR determines your Crescendo status: Bronze → Silver → Gold → Platinum → Diamond. Higher status unlocks better rewards, exclusive bounties, and premium experiences.',
  },
];

export function HowItWorksLanding() {
  const { setShowAuthModal, setAuthMode } = useAuthContext();

  const handleJoin = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  return (
    <section id="how-it-works" className="py-20 md:py-28 px-4 md:px-6" style={{ background: '#222' }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-14 text-white">
          Three Steps. Real Rewards.
        </h2>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="rounded-2xl p-6 md:p-8 text-center border transition-all hover:border-[rgba(170,255,0,0.3)]"
              style={{ background: '#1A1A1A', borderColor: '#333' }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl"
                style={{ background: 'rgba(170,255,0,0.08)' }}
              >
                {step.emoji}
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#666' }}>
                Step {i + 1}
              </span>
              <h3 className="text-xl font-bold mt-1 mb-3 text-white">{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#999' }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div
          className="rounded-xl p-5 text-center mb-8 border"
          style={{ background: 'rgba(170,255,0,0.04)', borderColor: 'rgba(170,255,0,0.15)' }}
        >
          <p className="text-sm md:text-base" style={{ color: '#ccc' }}>
            This isn't a points program that expires. Your NCTR is a{' '}
            <span className="font-semibold text-white">real digital asset</span>.
            Your status is <span className="font-semibold text-white">earned, not bought</span>.
          </p>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={handleJoin}
            className="font-semibold rounded-full px-8 gap-2"
            style={{ background: '#AAFF00', color: '#111' }}
          >
            Start Earning <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
