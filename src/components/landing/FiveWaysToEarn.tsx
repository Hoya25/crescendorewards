import { ShoppingBag, Shirt, Camera, Users, Gift } from 'lucide-react';

const ways = [
  { icon: ShoppingBag, title: 'Shop The Garden', description: '6,000+ brands. Earn NCTR on every purchase.' },
  { icon: Shirt, title: 'Rep NCTR Merch', description: '3x 360LOCK bonus. Plus exclusive bounties.' },
  { icon: Camera, title: 'Complete Bounties', description: 'Content challenges that pay NCTR.' },
  { icon: Users, title: 'Invite Friends', description: 'They join, you both earn.' },
  { icon: Gift, title: 'Contribute Rewards', description: 'List rewards. Earn when others claim.' },
];

export function FiveWaysToEarn() {
  return (
    <section className="py-20 md:py-28 px-4 md:px-6 bg-page-bg">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-3 text-text-heading">
          Five Ways to Earn
        </h2>
        <p className="text-center max-w-xl mx-auto mb-12 text-sm md:text-base text-text-body">
          No purchase required. Pick what fits your life.
        </p>

        <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:overflow-visible scrollbar-hide">
          {ways.map((way) => (
            <div
              key={way.title}
              className="shrink-0 min-w-[200px] md:min-w-0 rounded-xl p-5 bg-card-bg border border-border-card transition-all duration-200 hover:border-accent-lime/30"
            >
              <div className="w-10 h-10 rounded-full bg-elevated-bg flex items-center justify-center mb-4">
                <way.icon className="w-5 h-5 text-accent-lime" />
              </div>
              <h3 className="font-semibold text-sm text-text-heading mb-1">{way.title}</h3>
              <p className="text-xs text-text-body leading-relaxed">{way.description}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-text-body-muted mt-8 max-w-2xl mx-auto">
          Your Crescendo status multiplier applies to all five. The higher your status, the more you earn.
        </p>
      </div>
    </section>
  );
}
