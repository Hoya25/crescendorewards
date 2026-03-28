import { ShoppingBag, Shirt, GraduationCap, Users, Gift, Building2, ArrowRight, Instagram } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ways = [
  { icon: ShoppingBag, title: 'Shop & Earn', description: "Buy what you already buy. Brands fund your rewards instead of funding ads. Every purchase earns NCTR — not points that expire, not discounts that disappear. Real value that's yours to keep.", href: 'https://bountyhunter.nctr.live/shop', accent: false, showArrow: true },
  { icon: Shirt, title: 'Rep the Brand', description: "Wear it. Own it. NCTR merch earns 3x with 360LOCK because repping the Alliance isn't just shopping — it's ownership. Plus exclusive bounties only merch holders unlock.", href: 'https://merch.nctr.live', accent: false, showArrow: true },
  { icon: GraduationCap, title: 'Learn & Earn', description: "NCTR University launches Spring 2026. Complete courses on participation, ownership, and the Alliance economy — and earn NCTR for every milestone. In the meantime, get a head start on your knowledge advantage by following on X and Instagram.", href: 'https://x.com/NCTRAlliance', accent: false, showArrow: false, isLearnCard: true },
  { icon: Users, title: 'Build Your Crew', description: "Bring your people. You all earn NCTR — when they sign up, when they buy, and when they hit milestones. Your crew compounds your status. The Alliance grows one real relationship at a time.", href: 'https://bountyhunter.nctr.live/network', accent: false, showArrow: true },
  { icon: Gift, title: 'Contribute Rewards', description: "Have something to offer? A product, a skill, an experience — list it as a Crescendo reward. When members claim it, you earn NCTR. The rewards marketplace is built by the people in it.", href: '/rewards', accent: false, showArrow: true },
  { icon: Building2, title: 'Brands Sponsor Life', description: "Brands redirect advertising budgets into participation. Instead of buying attention that disappears, they fund the rewards you earn just by living your life. And 50% comes back to them as 360LOCK — because in this Alliance, brands don't pay tolls. They build alongside you.", href: 'https://beacon.nctr.live', accent: true, showArrow: true },
];

export function FiveWaysToEarn() {
  const navigate = useNavigate();

  const handleClick = (href: string) => {
    if (href.startsWith('http')) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      navigate(href);
    }
  };

  return (
    <section className="pt-10 md:pt-14 pb-5 md:pb-7 px-4 md:px-6 bg-page-bg">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-3 text-text-heading">
          Six Ways to Earn
        </h2>
        <p className="text-center max-w-2xl mx-auto mb-10 text-sm md:text-base text-text-body">
          People earn by participating. Brands earn by sponsoring life. The Alliance grows because everyone has a stake in it.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ways.map((way) => (
            <button
              key={way.title}
              onClick={() => handleClick(way.href)}
              className="text-left relative group bg-card-bg border pt-8 px-6 pb-6 transition-all duration-200 hover:border-accent-lime/40 hover:-translate-y-0.5"
              style={{
                borderRadius: 0,
                borderColor: way.accent ? 'hsl(var(--accent-lime) / 0.3)' : undefined,
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              {way.isLearnCard && (
                <span
                  className="absolute top-4 right-4 text-xs uppercase font-semibold px-2 py-0.5"
                  style={{
                    border: '1px solid #5A5A58',
                    color: '#5A5A58',
                    background: 'transparent',
                    borderRadius: 0,
                    letterSpacing: '0.08em',
                  }}
                >
                  Spring 2026
                </span>
              )}
              <div className="h-12 flex items-center mb-4">
                <div className="w-12 h-12 bg-elevated-bg flex items-center justify-center" style={{ borderRadius: 0 }}>
                  <way.icon className="w-6 h-6 text-accent-lime" />
                </div>
              </div>
              <h3 className="font-semibold text-sm text-text-heading mb-2 flex items-center gap-2">
                {way.title}
                {way.showArrow && (
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-accent-lime" />
                )}
              </h3>
              <p className="text-xs text-text-body leading-relaxed">{way.description}</p>
              {way.isLearnCard && (
                <div className="flex items-center gap-3 mt-3">
                  <a
                    href="https://x.com/NCTRAlliance"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="transition-colors"
                    style={{ color: '#5A5A58' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#5A5A58')}
                  >
                    <span className="text-base font-bold" style={{ fontSize: '16px' }}>𝕏</span>
                  </a>
                  <a
                    href="https://instagram.com/nctralliance"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="transition-colors"
                    style={{ color: '#5A5A58' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#5A5A58')}
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                </div>
              )}
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-text-body-muted mt-8 max-w-2xl mx-auto">
          Your Crescendo status multiplies everything. Bronze to Diamond — the more you commit, the more every action is worth.
        </p>

        <div className="flex items-center justify-center gap-6 mt-6">
          <a
            href="https://bountyhunter.nctr.live"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold px-8 py-3 text-sm hover:opacity-90 transition-opacity"
            style={{ borderRadius: 0, backgroundColor: '#323232', color: '#FFFFFF', textDecoration: 'none' }}
          >
            Open Bounty Hunter <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="https://beacon.nctr.live"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-body hover:text-text-heading transition-colors"
            style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}
          >
            Learn about Beacon →
          </a>
        </div>
      </div>
    </section>
  );
}
