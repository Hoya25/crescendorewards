import type { ReactNode } from 'react';
import { InlineNctrMark } from './InlineNctrMark';
import { barlow, dmSans, sectionClass, sectionHeading } from './landingStyles';

const STEPS: { n: string; title: string; body: ReactNode }[] = [
  { n: '01', title: 'Live.', body: 'Shop where you already shop. Bring your people. Take part.' },
  {
    n: '02',
    title: 'Earn.',
    body: (
      <>
        It comes back as <InlineNctrMark surface="light" />. Our merch store earns today. Alliance stores are coming.
      </>
    ),
  },
  {
    n: '03',
    title: 'Commit.',
    body: (
      <>
        Commit your <InlineNctrMark surface="light" /> with 360LOCK. Your commitment is your status. Your <InlineNctrMark surface="light" /> stays yours.
      </>
    ),
  },
];

export function Section3HowItWorks() {
  return (
    <section id="how-it-works" className={sectionClass}>
      <div className="max-w-7xl mx-auto">
        <h2 style={sectionHeading}>Live and Earn.</h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-12">
          {STEPS.map((s) => (
            <div key={s.n}>
              <p style={{ fontFamily: barlow, fontWeight: 900, fontSize: '64px', color: 'var(--landing-ink)', lineHeight: 1 }}>{s.n}</p>
              <p className="mt-4" style={{ fontFamily: barlow, fontWeight: 700, fontSize: '24px', color: 'var(--landing-ink)', lineHeight: 1.1 }}>{s.title}</p>
              <p className="mt-3" style={{ fontFamily: dmSans, fontSize: '16px', color: 'var(--landing-ink)', lineHeight: 1.6 }}>{s.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-12" style={{ fontFamily: barlow, fontWeight: 700, fontSize: '24px', color: 'var(--landing-ink)', lineHeight: 1.1 }}>
          The more you build, the more opens.
        </p>
      </div>
    </section>
  );
}
