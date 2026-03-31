import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

export function TheMathSection() {
  const { setShowAuthModal, setAuthMode } = useAuthContext();

  const handleJoin = () => {
    setAuthMode('signin');
    setShowAuthModal(true);
  };

  return (
    <section className="py-20 md:py-28 px-4 md:px-6 bg-page-bg-alt">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-4 text-text-heading">
          Let's Do the Math
        </h2>
        <p className="text-center mb-12 text-sm md:text-base text-text-body">
          Buy a $55 NCTR hoodie. Here's what happens.
        </p>

        <div className="grid md:grid-cols-2 gap-5 mb-10">
          {/* Without 360LOCK */}
          <div className="p-6 border border-border-card bg-page-bg space-y-4" style={{ borderRadius: '0px' }}>
            <p className="text-xs font-bold uppercase tracking-wider text-text-body-muted">
              Without 360LOCK
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-body">Purchase reward</span>
                <span className="text-text-heading font-medium">275 NCTR</span>
              </div>
            </div>
            <div className="pt-3 border-t border-border-card">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-text-heading">Total</span>
                <span className="text-xl font-bold text-text-heading">275 NCTR</span>
              </div>
              <p className="text-xs mt-2 text-text-body-muted">That's it.</p>
            </div>
          </div>

          {/* With 360LOCK */}
          <div
            className="p-6 space-y-4 relative"
            style={{ background: 'hsl(var(--accent-lime-subtle))', border: '1px solid #323232', borderRadius: '0px' }}
          >
            <div className="absolute -top-3 right-4 px-3 py-1 text-xs font-bold" style={{ backgroundColor: '#323232', color: '#FFFFFF', borderRadius: '0px' }}>
              ★ RECOMMENDED
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-text-accent">
              With 360LOCK
            </p>
            <div className="space-y-3">
              {[
                { label: 'Purchase reward (3x merch)', amount: '825 NCTR' },
                { label: 'First Merch Purchase bounty', amount: '5,000 NCTR' },
                { label: 'Rep the Brand bounty', amount: '750 NCTR' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-sm text-text-body">{item.label}</span>
                  <span className="font-medium text-text-accent">{item.amount}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t" style={{ borderColor: 'hsl(var(--accent-lime) / 0.2)' }}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-text-heading">Total</span>
                <span className="text-2xl font-black text-text-accent">
                  6,575 NCTR
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm md:text-base max-w-2xl mx-auto mb-2 text-text-body">
          Same hoodie. Different commitment.
        </p>
        <p className="text-center text-sm max-w-2xl mx-auto mb-4 text-text-body">
          And that's just at Bronze. Hit Gold (1.5x) and that 6,575 becomes{' '}
          <span className="font-semibold text-text-heading">9,862 NCTR</span>.
          At Diamond (2.5x)?{' '}
          <span className="font-bold text-text-accent">16,437 NCTR</span>.{' '}
          <span className="font-bold text-text-accent">Status multiplies everything.</span>
        </p>

        {/* Multiplier teaser */}
        <div
          className="p-5 text-center mb-4 border"
          style={{ background: 'hsl(var(--accent-lime-subtle))', borderColor: 'hsl(var(--accent-lime) / 0.15)', borderRadius: '0px' }}
        >
          <p className="text-sm text-text-body">
            And every NCTR you commit raises your Crescendo status. Which unlocks better bounties.
            Which earn more NCTR. Which raises your status more.{' '}
            <span className="font-bold text-text-heading">The flywheel never stops.</span>
          </p>
        </div>

        <div className="p-4 text-center mb-10 border border-border-card bg-page-bg" style={{ borderRadius: '0px' }}>
          <p className="text-sm text-text-body">
            💡 <span className="font-semibold text-text-heading">At Gold status</span>, your earning multiplier jumps to{' '}
            <span className="font-bold text-text-accent">1.5x on everything</span>.
            That same 6,575 NCTR becomes{' '}
            <span className="font-bold text-text-accent">9,862 NCTR</span>.
            At Diamond? <span className="font-bold text-text-accent">16,437 NCTR</span>. The math keeps getting better.
          </p>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={handleJoin}
            className="font-semibold px-8 gap-2 hover:opacity-90"
            style={{ borderRadius: '0px', backgroundColor: '#323232', color: '#FFFFFF' }}
          >
            See the Flywheel in Action <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
