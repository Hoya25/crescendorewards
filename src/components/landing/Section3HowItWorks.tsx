import type { ReactNode } from 'react';
import { InlineNctrMark } from './InlineNctrMark';
import { barlow, dmSans, sectionClass, sectionHeading } from './landingStyles';

const STEPS: { n: string; title: string; body: ReactNode }[] = [
  { n: '01', title: 'Earn.', body: 'Shop, take part, and invite your people. NCTR Merch earns today. Earning at alliance stores is coming.' },
  {
    n: '02',
    title: 'Commit.',
    body: (
      <>
        Commit your <InlineNctrMark surface="light" /> with 360LOCK. Your commitment is your status, Bronze through Diamond. Your <InlineNctrMark surface="light" /> stays yours.
      </>
    ),
  },
  { n: '03', title: 'Status opens rewards.', body: 'Higher status earns more on everything you do and opens more of what the alliance sponsors.' },
];

export function Section3HowItWorks() {
  return (
    <section id="how-it-works" className={sectionClass}>
      <div className="max-w-7xl mx-auto">
        <h2 style={sectionHeading}>How it works.</h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-12">
          {STEPS.map((s) => (
            <div key={s.n}>
              <p style={{ fontFamily: barlow, fontWeight: 900, fontSize: '64px', color: 'var(--landing-ink)', lineHeight: 1 }}>{s.n}</p>
              <p className="mt-4" style={{ fontFamily: barlow, fontWeight: 700, fontSize: '24px', color: 'var(--landing-ink)', lineHeight: 1.1 }}>{s.title}</p>
              <p className="mt-3" style={{ fontFamily: dmSans, fontSize: '16px', color: 'var(--landing-ink)', lineHeight: 1.6 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
