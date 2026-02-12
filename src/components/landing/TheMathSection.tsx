import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

export function TheMathSection() {
  const { setShowAuthModal, setAuthMode } = useAuthContext();

  const handleJoin = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  return (
    <section className="py-20 md:py-28 px-4 md:px-6" style={{ background: '#222' }}>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-4 text-white">
          Let's Do the Math
        </h2>
        <p className="text-center mb-12 text-sm md:text-base" style={{ color: '#999' }}>
          Buy a $55 NCTR hoodie. Here's what happens.
        </p>

        <div className="grid md:grid-cols-2 gap-5 mb-10">
          {/* Without 360LOCK */}
          <div
            className="rounded-2xl p-6 border space-y-4"
            style={{ background: '#1A1A1A', borderColor: '#333' }}
          >
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#666' }}>
              Without 360LOCK
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: '#999' }}>Purchase reward</span>
                <span className="text-white font-medium">110 NCTR</span>
              </div>
            </div>
            <div className="pt-3 border-t" style={{ borderColor: '#333' }}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-white">Total</span>
                <span className="text-xl font-bold text-white">110 NCTR</span>
              </div>
              <p className="text-xs mt-2" style={{ color: '#666' }}>That's it.</p>
            </div>
          </div>

          {/* With 360LOCK */}
          <div
            className="rounded-2xl p-6 border-2 space-y-4 relative"
            style={{ background: 'rgba(170,255,0,0.03)', borderColor: '#AAFF00' }}
          >
            <div
              className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: '#AAFF00', color: '#111' }}
            >
              ★ RECOMMENDED
            </div>
            <p
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: '#AAFF00' }}
            >
              With 360LOCK
            </p>
            <div className="space-y-3">
              {[
                { label: 'Purchase reward (3x)', amount: '330 NCTR' },
                { label: 'Rep the Brand bounty', amount: '750 NCTR' },
                { label: 'Unboxing bounty', amount: '900 NCTR' },
                { label: 'Merch Monday (monthly)', amount: '300 NCTR' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#ccc' }}>{item.label}</span>
                  <span className="font-medium" style={{ color: '#AAFF00' }}>{item.amount}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t" style={{ borderColor: 'rgba(170,255,0,0.2)' }}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-white">Month One Total</span>
                <span className="text-2xl font-black" style={{ color: '#AAFF00' }}>
                  2,580+ NCTR
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm md:text-base max-w-2xl mx-auto mb-4" style={{ color: '#999' }}>
          Same hoodie. Different commitment.
        </p>

        <div
          className="rounded-xl p-5 text-center mb-10 border"
          style={{ background: 'rgba(170,255,0,0.04)', borderColor: 'rgba(170,255,0,0.15)' }}
        >
          <p className="text-sm" style={{ color: '#ccc' }}>
            And every NCTR you lock raises your Crescendo status. Which unlocks better bounties.
            Which earn more NCTR. Which raises your status more.{' '}
            <span className="font-bold text-white">The flywheel never stops.</span>
          </p>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={handleJoin}
            className="font-semibold rounded-full px-8 gap-2"
            style={{ background: '#AAFF00', color: '#111' }}
          >
            See the Flywheel in Action <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
