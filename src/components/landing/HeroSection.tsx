import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronDown, TrendingUp, Lock, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useFounding111 } from '@/hooks/useFounding111';

interface HeroSectionProps {
  onJoin: () => void;
}

const FLYWHEEL_NODES = [
  { label: 'Earn', sub: 'Shop, contribute, refer', Icon: TrendingUp, angle: -90 },
  { label: 'Commit', sub: 'Commit for 360 days', Icon: Lock, angle: 30 },
  { label: 'Unlock', sub: 'Level up your status', Icon: Trophy, angle: 150 },
];

export function HeroSection({ onJoin }: HeroSectionProps) {
  const [memberCount, setMemberCount] = useState<number>(0);
  const { data: founding111Count = 0 } = useFounding111();
  const founding111SpotsLeft = Math.max(0, 111 - founding111Count);
  const showFounding111 = founding111Count < 111;

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
    <section className="relative min-h-[90vh] md:min-h-screen flex items-center px-6 md:px-12 overflow-hidden pt-20 md:pt-0 bg-page-bg">
      {/* Radial glow */}
      <div
        className="absolute top-1/2 right-[25%] -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none hidden md:block"
        style={{ background: 'radial-gradient(ellipse at center, hsl(var(--accent-lime-subtle)) 0%, transparent 60%)' }}
      />

      <div className="relative z-10 max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        {/* Left: Copy */}
        <div className="space-y-6 md:space-y-8">
          <h1 className="text-[2.5rem] md:text-[3.25rem] lg:text-[4rem] font-black tracking-tight leading-[1.05] text-text-heading">
            Don't Buy It.{' '}
            <span className="text-accent-lime" style={{ textShadow: '0 0 30px hsl(var(--accent-lime) / 0.25)' }}>
              Earn It. Own It.
            </span>
          </h1>

          <p className="text-base md:text-lg lg:text-xl leading-relaxed max-w-lg text-text-body">
            You already shop, share, and create. Crescendo turns all of it into
            NCTR. Commit it. Build your status. Unlock rewards others pay
            thousands for.
          </p>

          <img
            src="/brands/nctr-alliance-grey.png"
            alt="by NCTR Alliance"
            className="h-6 opacity-50"
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              onClick={onJoin}
              className="font-bold text-base px-8 py-6 rounded-full shadow-lg transition-all hover:scale-[1.02] no-min-touch bg-cta text-cta-foreground"
              style={{ boxShadow: '0 0 30px hsl(var(--accent-lime) / 0.12)' }}
            >
              Join Crescendo — It's Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={scrollToHowItWorks}
              className="rounded-full px-6 py-6 text-text-body hover:text-text-accent transition-colors no-min-touch border border-border-card bg-transparent"
            >
              See How It Works
              <ChevronDown className="ml-2 w-4 h-4" />
            </Button>
          </div>

          {showFounding111 && (
            <p className="text-sm font-semibold" style={{ color: '#E2FF6D' }}>
              Join the Founding 111 — only {founding111SpotsLeft} spots left
            </p>
          )}

          <p className="text-sm text-text-body-muted">
            {displayCount
              ? `${displayCount.toLocaleString()}+ members earning rewards`
              : 'Beta — Limited Access'}
          </p>
        </div>

        {/* Right: Flywheel */}
        <div className="flex items-center justify-center md:justify-end">
          <div className="relative w-72 h-72 md:w-[22rem] md:h-[22rem]">
            <svg viewBox="0 0 300 300" fill="none" className="absolute inset-0 w-full h-full">
              <circle cx="150" cy="150" r="130" stroke="hsl(var(--flywheel-orbit))" strokeWidth="1.5" strokeDasharray="8 6"
                className="animate-[spin_25s_linear_infinite]" style={{ transformOrigin: '150px 150px' }} />
              <circle cx="150" cy="150" r="95" stroke="hsl(var(--flywheel-orbit, 0 0% 50% / 0.15))" strokeWidth="1" />
              {[0, 120, 240].map((deg) => {
                const midAngle = deg + 60;
                const rad = (midAngle * Math.PI) / 180;
                const cx = 150 + 130 * Math.cos(rad);
                const cy = 150 + 130 * Math.sin(rad);
                const rot = midAngle + 90;
                return (
                  <polygon key={deg} points="-4,-5 4,-5 0,5" fill="hsl(var(--flywheel-arrow))"
                    transform={`translate(${cx},${cy}) rotate(${rot})`} />
                );
              })}
            </svg>

            {FLYWHEEL_NODES.map((node) => {
              const rad = (node.angle * Math.PI) / 180;
              const r = 130;
              const x = 50 + (r / 150) * 50 * Math.cos(rad);
              const y = 50 + (r / 150) * 50 * Math.sin(rad);
              const NodeIcon = node.Icon;
              return (
                <div key={node.label} className="absolute flex flex-col items-center gap-1.5"
                  style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
                  <div
                    className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center bg-card-bg border-2 border-flywheel-node-border"
                    style={{ boxShadow: '0 2px 12px hsl(var(--flywheel-node-shadow))' }}
                  >
                    <NodeIcon className="w-6 h-6 md:w-7 md:h-7 text-accent-lime" />
                  </div>
                  <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-flywheel-label">
                    {node.label}
                  </span>
                  <span className="text-[10px] md:text-[11px] whitespace-nowrap text-flywheel-sublabel">
                    {node.sub}
                  </span>
                </div>
              );
            })}

            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xs md:text-sm uppercase tracking-[0.15em] font-extrabold text-flywheel-center">
                Live &amp; Earn
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce" style={{ animationDuration: '2s' }}>
        <ChevronDown className="w-5 h-5 text-text-body-muted/40" />
      </div>
    </section>
  );
}
