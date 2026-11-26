import { barlow, dmSans, sectionClass, sectionHeading } from './landingStyles';

const ENGINES = [
  { name: 'INSPIRATION', line: 'Keep the ritual.' },
  { name: 'STARDUST', line: 'Keep going to shows.' },
  { name: 'SWEAT', line: 'Get into the trade.' },
  { name: 'THROTTLE', line: 'Keep riding.' },
  { name: 'OXYGEN', line: 'Get outside more.' },
  { name: 'GROUNDBALL', line: 'Stay in the game.' },
];

export function Section5Engines() {
  return (
    <section className={sectionClass}>
      <div className="max-w-7xl mx-auto">
        <h2 style={sectionHeading}>The Impact Engines are coming.</h2>
        <p className="mt-4" style={{ fontFamily: dmSans, fontSize: '16px', color: 'var(--landing-muted)', lineHeight: 1.6 }}>
          Early members have the most time to build and earn.
        </p>
        <p className="mt-6 max-w-2xl" style={{ fontFamily: dmSans, fontSize: '18px', color: 'var(--landing-ink)', lineHeight: 1.6 }}>
          Each Impact Engine takes budget that used to vanish into ads and uses it to make one part of life more affordable to more people.
        </p>
        <div className="mt-10" style={{ borderTop: '1px solid var(--landing-line)' }}>
          {ENGINES.map((e) => (
            <div key={e.name} className="py-5 flex flex-col md:flex-row md:items-baseline md:gap-8" style={{ borderBottom: '1px solid var(--landing-line)' }}>
              <p className="md:w-64 shrink-0" style={{ fontFamily: barlow, fontWeight: 900, fontSize: '28px', textTransform: 'uppercase', color: 'var(--landing-ink)', lineHeight: 1.1 }}>
                {e.name}
              </p>
              <p className="mt-1 md:mt-0" style={{ fontFamily: dmSans, fontSize: '16px', color: 'var(--landing-ink)' }}>{e.line}</p>
            </div>
          ))}
        </div>
        <p className="mt-8" style={{ fontFamily: dmSans, fontSize: '14px', color: 'var(--landing-muted)' }}>
          Kroma Wellness signed as the first founding brand.
        </p>
      </div>
    </section>
  );
}
