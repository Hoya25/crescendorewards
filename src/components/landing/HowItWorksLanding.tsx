import { ShoppingBag, Lock, Trophy } from 'lucide-react';

const steps = [
  {
    icon: ShoppingBag,
    emoji: '🛍️',
    title: 'Earn',
    description: 'Shop, create content, complete challenges, invite friends. Every action earns you NCTR.',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    icon: Lock,
    emoji: '🔒',
    title: 'Commit',
    description: 'Lock your NCTR for 360 days and earn 3x. The longer you commit, the more you earn.',
    gradient: 'from-cta to-cta/80',
  },
  {
    icon: Trophy,
    emoji: '🏆',
    title: 'Unlock',
    description: 'Higher commitment = higher status. Higher status = better rewards, exclusive access, and premium opportunities.',
    gradient: 'from-primary to-primary/80',
  },
];

export function HowItWorksLanding() {
  return (
    <section className="py-16 md:py-24 px-4 md:px-6 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-12 text-foreground">
          How It Works
        </h2>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-10">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="bg-background rounded-2xl p-6 md:p-8 text-center border hover:shadow-lg transition-shadow"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mx-auto mb-5 shadow-lg text-2xl`}>
                {step.emoji}
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Step {i + 1}
              </span>
              <h3 className="text-xl font-bold mt-1 mb-3 text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <p className="text-center text-muted-foreground text-base md:text-lg italic">
          The more you put in, the more you get out. That's Crescendo.
        </p>
      </div>
    </section>
  );
}
