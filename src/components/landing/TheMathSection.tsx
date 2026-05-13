import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { NCTRLogo } from '@/components/NCTRLogo';

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
          Buy a $55 <NCTRLogo variant="wordmark-grey" height={14} /> hoodie. Here's what happens.
        </p>

        <div className="grid md:grid-cols-2 gap-5 mb-10">
          {/* Without 360LOCK */}
          <div className="p-6 border border-border-card bg-page-bg space-y-4" style={{ borderRadius: '0px' }}>
            <p className="text-xs font-bold uppercase tracking-wider text-text-body-muted">
              Without 360LOCK
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-body">Purchase reward (1x)</span>
                <span className="text-text-heading font-medium">1x</span>
              </div>
            </div>
            <div className="pt-3 border-t border-border-card">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-text-heading">Total</span>
                <span className="text-xl font-bold text-text-heading">1x</span>
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
                { label: 'Purchase reward at your tier multiplier', amount: '' },
                { label: 'Merch participation bonus', amount: '' },
                { label: 'Brand representation bonus', amount: '' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-sm text-text-body">{item.label}</span>
                  {item.amount && <span className="font-medium text-text-accent">{item.amount}</span>}
                </div>
              ))}
            </div>
            <div className="pt-3 border-t" style={{ borderColor: 'hsl(var(--accent-lime) / 0.2)' }}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-text-heading">Total</span>
                <span className="text-2xl font-black text-text-accent">
                  meaningfully more
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm md:text-base max-w-2xl mx-auto mb-2 text-text-body">
          Same hoodie. Different commitment.
        </p>
        <p className="text-center text-sm max-w-2xl mx-auto mb-4 text-text-body">
          Bronze sets the floor. Gold (1.5x) compounds it. Diamond (2.5x) compounds it again.{' '}
          <span className="font-bold text-text-accent">Status multiplies everything.</span>
        </p>

        {/* Multiplier teaser */}
        <div
          className="p-5 text-center mb-10 border"
          style={{ background: 'hsl(var(--accent-lime-subtle))', borderColor: 'hsl(var(--accent-lime) / 0.15)', borderRadius: '0px' }}
        >
          <p className="text-sm text-text-body">
            And every <NCTRLogo variant="wordmark-grey" height={14} /> you commit raises your Crescendo status. Which unlocks better bounties.
            Which earn more <NCTRLogo variant="wordmark-grey" height={14} />. Which raises your status more.{' '}
            <span className="font-bold text-text-heading">The flywheel never stops.</span>
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
