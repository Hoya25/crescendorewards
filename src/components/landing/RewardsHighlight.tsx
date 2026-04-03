import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const barlow = "'Barlow Condensed', sans-serif";
const dmSans = "'DM Sans', sans-serif";

const cards = [
  {
    title: 'Thousands of brands',
    subtitle: 'Shop and earn across wellness, outdoor, fashion, tech, food, and more — all through the Alliance ecosystem.',
    tier: 'All members',
  },
  {
    title: 'Subscriptions you love',
    subtitle: 'Your favorite streaming, wellness, and content subscriptions — sponsored by the ecosystem as you grow your status.',
    tier: 'Bronze+',
  },
  {
    title: "The life you're building",
    subtitle: 'Products, experiences, and opportunities that match what matters to you. The higher your status, the more the ecosystem invests in your life.',
    tier: 'Gold+',
  },
];

interface RewardsHighlightProps {
  onJoin: () => void;
}

export function RewardsHighlight({ onJoin }: RewardsHighlightProps) {
  return (
    <section className="py-20 md:py-28 px-4 md:px-6 bg-page-bg">
      <div className="max-w-5xl mx-auto">
        <h2
          className="text-2xl md:text-4xl font-bold text-center mb-4 text-text-heading"
          style={{ fontFamily: barlow, letterSpacing: '-0.02em' }}
        >
          Unlock Real Rewards
        </h2>

        <p
          className="text-center mb-12 max-w-2xl mx-auto text-text-body"
          style={{ fontFamily: dmSans, fontSize: '14px', lineHeight: 1.7 }}
        >
          The Alliance exists to sponsor the things that matter to you. As you participate and grow your status, the ecosystem invests more in your life — from everyday subscriptions to once-in-a-lifetime experiences.
        </p>

        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {cards.map((card) => (
            <div
              key={card.title}
              className="relative overflow-hidden bg-card-bg"
              style={{
                borderRadius: '0px',
                border: '1px solid hsl(var(--border))',
                padding: '28px 24px 28px 28px',
              }}
            >
              {/* Lime left border */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[2px]"
                style={{ background: '#E2FF6D' }}
              />

              <p
                className="mb-2"
                style={{
                  fontFamily: barlow,
                  fontWeight: 700,
                  fontSize: '10px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#E2FF6D',
                }}
              >
                {card.tier}
              </p>

              <h3
                className="mb-2 text-text-heading"
                style={{
                  fontFamily: barlow,
                  fontWeight: 700,
                  fontSize: '18px',
                  textTransform: 'uppercase',
                }}
              >
                {card.title}
              </h3>

              <p
                className="text-text-body"
                style={{
                  fontFamily: dmSans,
                  fontSize: '14px',
                  lineHeight: 1.7,
                }}
              >
                {card.subtitle}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={onJoin}
            className="font-semibold px-8 gap-2 hover:opacity-90"
            style={{ borderRadius: '0px', backgroundColor: '#323232', color: '#FFFFFF' }}
          >
            Join and Start Unlocking <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
