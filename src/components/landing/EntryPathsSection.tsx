import { ShieldCheck, Building2, Rocket, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const barlow = "'Barlow Condensed', sans-serif";
const dmSans = "'DM Sans', sans-serif";

const cards = [
  {
    icon: ShieldCheck,
    eyebrow: 'COMING FROM BOUNTY HUNTER?',
    headline: 'Your NCTR is already working',
    body: 'Every NCTR you earn in Bounty Hunter builds your Crescendo status. Check your tier and see what you've unlocked.',
    cta: 'Check My Status →',
    to: '/membership',
  },
  {
    icon: Building2,
    eyebrow: 'BRAND PARTNER?',
    headline: 'See what your customers unlock',
    body: 'When your customers earn NCTR through Beacon, this is where they build status, claim rewards, and deepen their relationship with your brand.',
    cta: 'Browse Rewards →',
    to: '/rewards',
  },
  {
    icon: Rocket,
    eyebrow: 'NEW HERE?',
    headline: 'Start earning in 2 minutes',
    body: 'Join Bounty Hunter, earn your first NCTR, and watch your Crescendo status grow. Free to join. Always.',
    cta: 'Join Bounty Hunter →',
    to: 'https://bountyhunter.nctr.live',
  },
];

export function EntryPathsSection() {
  const navigate = useNavigate();

  const handleClick = (to: string) => {
    if (to.startsWith('http')) {
      window.open(to, '_blank', 'noopener,noreferrer');
    } else {
      navigate(to);
    }
  };

  return (
    <section className="px-4 md:px-6 py-10 md:py-14" style={{ backgroundColor: '#F9F9F7' }}>
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5">
        {cards.map((card) => (
          <div
            key={card.eyebrow}
            className="p-5 md:p-6 flex flex-col"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D9D9D9',
              borderRadius: 0,
            }}
          >
            <card.icon className="w-5 h-5 mb-4" style={{ color: '#323232' }} />

            <p
              style={{
                fontFamily: barlow,
                fontWeight: 700,
                fontSize: '10px',
                letterSpacing: '0.14em',
                color: '#323232',
                marginBottom: '6px',
              }}
            >
              {card.eyebrow}
            </p>

            <h3
              style={{
                fontFamily: barlow,
                fontWeight: 700,
                fontSize: '18px',
                color: '#323232',
                marginBottom: '8px',
              }}
            >
              {card.headline}
            </h3>

            <p
              className="flex-1"
              style={{
                fontFamily: dmSans,
                fontSize: '13px',
                lineHeight: 1.6,
                color: '#5A5A58',
                marginBottom: '16px',
              }}
            >
              {card.body}
            </p>

            <button
              onClick={() => handleClick(card.to)}
              className="inline-flex items-center gap-1.5 self-start px-4 py-2 text-xs font-bold uppercase"
              style={{
                fontFamily: barlow,
                letterSpacing: '0.06em',
                backgroundColor: '#323232',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 0,
                cursor: 'pointer',
              }}
            >
              {card.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
