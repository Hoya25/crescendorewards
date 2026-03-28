import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

const barlow = "'Barlow Condensed', sans-serif";

const steps = [
  {
    emoji: '🛍️',
    title: 'Earn in Bounty Hunter',
    description:
      'Shop at thousands of brands, complete bounties, buy NCTR merch, and refer friends — all inside Bounty Hunter. Brands power the rewards through Beacon. Every action earns NCTR automatically.',
  },
  {
    emoji: '🔒',
    title: 'Commit with 360LOCK',
    description:
      'Lock your earned NCTR for 360 days to build Crescendo status. 360LOCK gives you a 3x multiplier on everything you earn. Your NCTR stays yours — locking is commitment, not spending.',
  },
  {
    emoji: '🏆',
    title: 'Unlock Rewards & Status',
    description:
      'Your locked NCTR determines your Crescendo status: Bronze through Diamond. Higher status means higher earning multipliers, exclusive rewards, and premium experiences. The more you commit, the more you unlock.',
  },
];

export function HowItWorksLanding() {
  const { setShowAuthModal, setAuthMode } = useAuthContext();

  const handleJoin = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  return (
    <section id="how-it-works" className="py-12 md:py-16 px-4 md:px-6 bg-page-bg-alt">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-14 text-text-heading" style={{ fontFamily: barlow, letterSpacing: '-0.02em' }}>
          Three Steps. Real Rewards.
        </h2>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="p-6 md:p-8 text-center border border-border-card bg-page-bg transition-all hover:border-accent-lime/30"
              style={{ borderRadius: '0px' }}
            >
              <div
                className="w-16 h-16 flex items-center justify-center mx-auto mb-5 text-3xl"
                style={{ background: 'hsl(var(--accent-lime-subtle))', borderRadius: '0px' }}
              >
                {step.emoji}
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-text-body-muted">
                Step {i + 1}
              </span>
              <h3 className="text-xl mt-1 mb-3 text-text-heading" style={{ fontFamily: barlow, fontWeight: 700 }}>{step.title}</h3>
              <p className="text-sm leading-relaxed text-text-body">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div
          className="p-5 text-center mb-8 border"
          style={{ background: 'hsl(var(--accent-lime-subtle))', borderColor: 'hsl(var(--accent-lime) / 0.15)', borderRadius: '0px' }}
        >
          <p className="text-sm md:text-base text-text-body">
            This isn't a rewards program that expires. Your NCTR is a{' '}
            <span className="font-semibold text-text-heading">real digital reward</span>.
            Your status is <span className="font-semibold text-text-heading">earned, not bought</span>.
          </p>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={handleJoin}
            className="font-semibold px-8 gap-2 hover:opacity-90"
            style={{ borderRadius: '0px', backgroundColor: '#323232', color: '#FFFFFF' }}
          >
            Start Earning <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
