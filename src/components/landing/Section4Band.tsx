import { barlow, dmSans } from './landingStyles';

export function Section4Band() {
  return (
    <section className="w-full px-6 md:px-12 py-24 md:py-32" style={{ backgroundColor: 'var(--nctr-charcoal)' }}>
      <div className="max-w-3xl mx-auto text-left md:text-center">
        <h2 style={{ fontFamily: barlow, fontWeight: 900, fontSize: 'clamp(2.25rem, 5vw, 4rem)', color: 'var(--landing-band-text)', lineHeight: 1.0, margin: 0 }}>
          Stronger together. Rewarded individually.
        </h2>
        <p className="mt-6" style={{ fontFamily: dmSans, fontSize: '18px', color: 'var(--landing-band-body)', lineHeight: 1.6 }}>
          The everyday economy already pays out on everything we buy. Together we point it at each other. Brands fund what members earn, the alliance sponsors the rewards, and status opens them.
        </p>
        <p className="mt-10" style={{ fontFamily: barlow, fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--landing-band-text)', lineHeight: 1.15 }}>
          Every reward is a real person getting something real. That is what we mean by impact.
        </p>
        <p className="mt-8" style={{ fontFamily: barlow, fontWeight: 700, fontSize: '20px', color: 'var(--nctr-lime)' }}>
          We build it and own it together.
        </p>
      </div>
    </section>
  );
}
