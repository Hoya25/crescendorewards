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
      'Lock your earned NCTR to build your Crescendo status. Higher status = higher earning multiplier on everything you earn. Plus, NCTR merch purchases and bounties get an automatic 3x bonus with 360LOCK. Your NCTR stays yours — locking is commitment, not spending.',
  },
  {
    emoji: '🏆',
    title: 'Unlock Rewards & Status',
    description:
      'Your locked NCTR determines your Crescendo status: Bronze → Silver → Gold → Platinum → Diamond. Higher status gives you a higher earning multiplier on everything — 1.25x at Silver up to 2x at Diamond. Plus exclusive bounties, better rewards, and premium experiences.',
  },
];

export function HowItWorksLanding() {
  const { setShowAuthModal, setAuthMode } = useAuthContext();

  const handleJoin = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  return (
    <section id="how-it-works" className="py-20 md:py-28 px-4 md:px-6 bg-page-bg-alt">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-14 text-text-heading">
          Three Steps. Real Rewards.
        </h2>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="rounded-2xl p-6 md:p-8 text-center border border-border-card bg-page-bg transition-all hover:border-accent-lime/30"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl"
                style={{ background: 'hsl(var(--accent-lime-subtle))' }}
              >
                {step.emoji}
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-text-body-muted">
                Step {i + 1}
              </span>
              <h3 className="text-xl font-bold mt-1 mb-3 text-text-heading">{step.title}</h3>
              <p className="text-sm leading-relaxed text-text-body">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div
          className="rounded-xl p-5 text-center mb-8 border"
          style={{ background: 'hsl(var(--accent-lime-subtle))', borderColor: 'hsl(var(--accent-lime) / 0.15)' }}
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
            className="font-semibold rounded-full px-8 gap-2 bg-cta text-cta-foreground hover:bg-cta/90"
          >
            Start Earning <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
