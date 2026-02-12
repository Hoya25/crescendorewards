import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface HeroSectionProps {
  onJoin: () => void;
}

export function HeroSection({ onJoin }: HeroSectionProps) {
  const [memberCount, setMemberCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { count } = await supabase
          .from('unified_profiles')
          .select('id', { count: 'exact', head: true });
        if (count) setMemberCount(count);
      } catch {
        // fail silently
      }
    };
    fetchCount();
  }, []);

  const displayCount = memberCount > 10 ? memberCount : null;

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      className="relative min-h-[90vh] md:min-h-screen flex items-center px-4 md:px-6 overflow-hidden"
      style={{ background: '#1A1A1A' }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.07] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #AAFF00 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        {/* Left: Copy */}
        <div className="space-y-6 md:space-y-8">
          <span
            className="inline-block text-xs font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border"
            style={{ color: '#888', borderColor: '#333' }}
          >
            NCTR Alliance
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-white">
            Get Rewarded for{' '}
            <span style={{ color: '#AAFF00' }}>Showing Up.</span>
          </h1>

          <p className="text-base md:text-lg leading-relaxed max-w-lg" style={{ color: '#999' }}>
            Crescendo is the rewards program that pays you to participate — not
            just spend. Shop, create, refer, contribute. The more you commit,
            the more you earn.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              onClick={onJoin}
              className="font-bold text-base md:text-lg px-8 py-6 rounded-full shadow-lg transition-all hover:scale-[1.02]"
              style={{ background: '#AAFF00', color: '#111' }}
            >
              Join Crescendo — It's Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={scrollToHowItWorks}
              className="rounded-full px-6 py-6 text-white border-white/20 hover:bg-white/5"
            >
              See How It Works
              <ArrowDown className="ml-2 w-4 h-4" />
            </Button>
          </div>

          <p className="text-sm" style={{ color: '#666' }}>
            {displayCount
              ? `${displayCount.toLocaleString()}+ members earning rewards`
              : 'Beta — Limited Access'}
          </p>
        </div>

        {/* Right: Flywheel visual */}
        <div className="hidden md:flex items-center justify-center">
          <div className="relative w-80 h-80">
            {/* Outer ring */}
            <div
              className="absolute inset-0 rounded-full border-2 animate-spin"
              style={{
                borderColor: 'rgba(170,255,0,0.15)',
                animationDuration: '20s',
              }}
            />
            {/* Inner ring */}
            <div
              className="absolute inset-8 rounded-full border"
              style={{ borderColor: 'rgba(170,255,0,0.08)' }}
            />

            {/* Step nodes */}
            {[
              { label: 'Earn', emoji: '🛍️', angle: -90 },
              { label: 'Commit', emoji: '🔒', angle: 30 },
              { label: 'Unlock', emoji: '🏆', angle: 150 },
            ].map((step) => {
              const rad = (step.angle * Math.PI) / 180;
              const r = 120;
              const x = 50 + (r / 160) * 50 * Math.cos(rad);
              const y = 50 + (r / 160) * 50 * Math.sin(rad);
              return (
                <div
                  key={step.label}
                  className="absolute flex flex-col items-center gap-1"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl border"
                    style={{
                      background: 'rgba(170,255,0,0.08)',
                      borderColor: 'rgba(170,255,0,0.25)',
                    }}
                  >
                    {step.emoji}
                  </div>
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: '#AAFF00' }}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}

            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-black text-white">3x</p>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: '#AAFF00' }}>
                  Multiplier
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
