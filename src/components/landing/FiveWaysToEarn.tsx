import { ShoppingBag, Shirt, Camera, Users, Gift, Building2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ways = [
  { icon: ShoppingBag, title: 'Shop Through Bounty Hunter', description: 'Thousands of brands. Earn NCTR on every purchase.', href: 'https://bountyhunter.nctr.live/shop', accent: false },
  { icon: Shirt, title: 'Rep NCTR Merch', description: '3x 360LOCK bonus. Plus exclusive bounties.', href: 'https://merch.nctr.live', accent: false },
  { icon: Camera, title: 'Complete Bounties', description: 'Content challenges that pay NCTR.', href: 'https://bountyhunter.nctr.live', accent: false },
  { icon: Users, title: 'Invite Friends', description: 'They join, you both earn.', href: 'https://bountyhunter.nctr.live/network', accent: false },
  { icon: Gift, title: 'Contribute Rewards', description: 'List rewards on Crescendo. Earn when others claim.', href: '/rewards', accent: false },
  { icon: Building2, title: 'Brands Earn Too', description: 'Alliance Brands earn NCTR through Beacon. Every platform fee returns 50% as 360LOCK. Brands are stakeholders, not just sponsors.', href: 'https://beacon.nctr.live', accent: true },
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
    <section className="py-10 md:py-14 px-4 md:px-6 bg-page-bg">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-3 text-text-heading">
          Six Ways to Earn
        </h2>
        <p className="text-center max-w-2xl mx-auto mb-10 text-sm md:text-base text-text-body">
          People earn in Bounty Hunter. Brands earn through Beacon. Your NCTR flows here to build status and unlock rewards.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ways.map((way) => (
            <button
              key={way.title}
              onClick={() => handleClick(way.href)}
              className="text-left p-5 bg-card-bg border transition-all duration-200 hover:border-accent-lime/40 hover:-translate-y-0.5"
              style={{
                borderRadius: 0,
                borderColor: way.accent ? 'hsl(var(--accent-lime) / 0.3)' : undefined,
                cursor: 'pointer',
              }}
            >
              <div className="w-10 h-10 bg-elevated-bg flex items-center justify-center mb-4" style={{ borderRadius: 0 }}>
                <way.icon className="w-5 h-5 text-accent-lime" />
              </div>
              <h3 className="font-semibold text-sm text-text-heading mb-1">{way.title}</h3>
              <p className="text-xs text-text-body leading-relaxed">{way.description}</p>
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-text-body-muted mt-8 max-w-2xl mx-auto">
          Your Crescendo status multiplier applies to all six. The higher your status, the more you earn.
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
