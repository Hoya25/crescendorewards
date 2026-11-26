import { Link } from 'react-router-dom';
import { InlineNctrMark } from './InlineNctrMark';
import { barlow, dmSans, darkButton, BH_SIGNUP_URL } from './landingStyles';

export function Section1Hero() {
  return (
    <section className="px-6 md:px-12 pt-10 md:pt-16 pb-12 md:pb-28">
      <div className="max-w-3xl text-left">
        <h1 style={{ fontFamily: barlow, fontWeight: 900, fontSize: 'clamp(3rem, 6vw, 5rem)', color: 'var(--landing-ink)', lineHeight: 1.0, margin: 0 }}>
          Your everyday life sponsors your better one.
        </h1>
        <p className="mt-4" style={{ fontFamily: barlow, fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', color: 'var(--landing-ink)', lineHeight: 1.1 }}>
          Owned by everyone who participates.
        </p>
        <p className="mt-6 max-w-[560px]" style={{ fontFamily: dmSans, fontSize: '18px', color: 'var(--landing-ink)', lineHeight: 1.6 }}>
          Your shopping earns <InlineNctrMark surface="light" />. Today at NCTR Merch, and at alliance stores as they open. Commit it, and your status opens rewards sponsored by the alliance and its partner brands.
        </p>
        <a href={BH_SIGNUP_URL} className="mt-8" style={darkButton}>
          Get ready for launch
        </a>
        <p className="mt-4" style={{ fontFamily: dmSans, fontSize: '14px', color: 'var(--landing-muted)' }}>
          Already a member?{' '}
          <Link to="/membership" style={{ color: 'var(--landing-ink)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
            Check my status
          </Link>
        </p>
      </div>
    </section>
  );
}
