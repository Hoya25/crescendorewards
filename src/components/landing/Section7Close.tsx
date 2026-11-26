import { InlineNctrMark } from './InlineNctrMark';
import { BH_SIGNUP_URL, darkButton, dmSans, sectionClass, sectionHeading } from './landingStyles';

export function Section7Close() {
  return (
    <section className={sectionClass}>
      <div className="max-w-7xl mx-auto">
        <h2 style={sectionHeading}>Get ready for launch.</h2>
        <p className="mt-6 max-w-2xl" style={{ fontFamily: dmSans, fontSize: '18px', color: 'var(--landing-ink)', lineHeight: 1.6 }}>
          Join and confirm. Choose your engines. Invite someone. Shop an earning store. Commit your first 1,000 with 360LOCK.
        </p>
        <a href={BH_SIGNUP_URL} className="mt-8" style={darkButton}>
          Get ready for launch
        </a>
        <p className="mt-4" style={{ fontFamily: dmSans, fontSize: '14px', color: 'var(--landing-muted)' }}>
          Free to join. Your <InlineNctrMark surface="light" /> stays yours.
        </p>
      </div>
    </section>
  );
}
