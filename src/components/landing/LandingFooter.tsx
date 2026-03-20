import { Link } from 'react-router-dom';

export function LandingFooter() {
  return (
    <footer style={{ backgroundColor: '#EEEEEC' }}>
      <div className="container mx-auto px-6 md:px-12 py-10 flex flex-col gap-6">
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            fontSize: '22px',
            color: '#323232',
            letterSpacing: '-0.02em',
            textTransform: 'uppercase' as const,
          }}
        >
          CRESCENDO
        </span>

        <nav className="flex items-center gap-6 flex-wrap">
          {[
            { label: 'REWARDS', to: '/rewards' },
            { label: 'HOW IT WORKS', to: '/how-it-works' },
            { label: 'PRIVACY', to: '/privacy' },
            { label: 'TERMS', to: '/terms' },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px',
                color: '#5A5A58',
                letterSpacing: '0.06em',
                textDecoration: 'none',
                transition: 'color 300ms cubic-bezier(0.4,0,0.2,1)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#323232')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#5A5A58')}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#5A5A58' }}>
          © 2026 NCTR Alliance · Crescendo. NCTR is a utility token used within the NCTR Alliance commerce network. Not an investment product. Not a security.
        </p>
      </div>
    </footer>
  );
}
