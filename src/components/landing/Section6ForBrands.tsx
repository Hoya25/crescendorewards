import { Link } from 'react-router-dom';
import { dmSans, outlineButton, sectionClass, sectionHeading } from './landingStyles';

export function Section6ForBrands() {
  return (
    <section className={sectionClass}>
      <div className="max-w-7xl mx-auto">
        <h2 style={sectionHeading}>Brands sponsor life.</h2>
        <p className="mt-6 max-w-2xl" style={{ fontFamily: dmSans, fontSize: '18px', color: 'var(--landing-ink)', lineHeight: 1.6 }}>
          Contribute a reward and reach people who chose to be here. You build the alliance with us.
        </p>
        <Link to="/become-sponsor" className="mt-8" style={outlineButton}>
          Apply to sponsor
        </Link>
      </div>
    </section>
  );
}
