import { ShoppingBag, Shirt, Camera, Users, Gift, ArrowRight } from 'lucide-react';

const ways = [
  { icon: ShoppingBag, title: 'Shop Through Bounty Hunter', description: 'Thousands of brands. Earn NCTR on every purchase.' },
  { icon: Shirt, title: 'Rep NCTR Merch', description: '3x 360LOCK bonus. Plus exclusive bounties.' },
  { icon: Camera, title: 'Complete Bounties', description: 'Content challenges that pay NCTR.' },
  { icon: Users, title: 'Invite Friends', description: 'They join, you both earn.' },
  { icon: Gift, title: 'Contribute Rewards', description: 'List rewards on Crescendo. Earn when others claim.' },
];

export function FiveWaysToEarn() {
  return (
    <section className="py-12 md:py-16 px-4 md:px-6 bg-page-bg">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-3 text-text-heading">
          Five Ways to Earn
        </h2>
        <p className="text-center max-w-xl mx-auto mb-12 text-sm md:text-base text-text-body">
          All earning happens in Bounty Hunter. Your NCTR flows here to build status and unlock rewards.
        </p>

        <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:overflow-visible scrollbar-hide">
          {ways.map((way) => (
            <div
              key={way.title}
              className="shrink-0 min-w-[200px] md:min-w-0 p-5 bg-card-bg border border-border-card transition-all duration-200 hover:border-accent-lime/30"
              style={{ borderRadius: '0px' }}
            >
              <div className="w-10 h-10 bg-elevated-bg flex items-center justify-center mb-4" style={{ borderRadius: '0px' }}>
                <way.icon className="w-5 h-5 text-accent-lime" />
              </div>
              <h3 className="font-semibold text-sm text-text-heading mb-1">{way.title}</h3>
              <p className="text-xs text-text-body leading-relaxed">{way.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="https://bountyhunter.nctr.live"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold px-8 py-3 text-sm hover:opacity-90 transition-opacity"
            style={{ borderRadius: '0px', backgroundColor: '#323232', color: '#FFFFFF', textDecoration: 'none' }}
          >
            Open Bounty Hunter <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <p className="text-center text-sm text-text-body-muted mt-8 max-w-2xl mx-auto">
          Your Crescendo status multiplier applies to all five. The higher your status, the more you earn.
        </p>
      </div>
    </section>
  );
}