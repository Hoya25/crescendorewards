import { Lock, Gift, TrendingUp, Trophy, ChevronDown, ExternalLink, HelpCircle, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const earningSubItems = [
  { emoji: "🛍️", text: "Shop at The Garden — Earn NCTR on every purchase" },
  { emoji: "📸", text: "Complete Bounties — Content challenges that pay NCTR" },
  { emoji: "👕", text: "Buy NCTR Merch — 3x earning bonus with 360LOCK" },
  { emoji: "🤝", text: "Invite Friends — You both earn when they join" },
  { emoji: "🎁", text: "Contribute Rewards — List rewards in the marketplace. Earn when others claim." },
];

const tierData = [
  { emoji: "🥉", name: "Bronze", range: "0 – 99", multiplier: "1x", label: "Base rate", unlocks: "Tier 1 merch bounties, Merch Monday, basic Crescendo rewards" },
  { emoji: "🥈", name: "Silver", range: "100 – 499", multiplier: "1.25x", label: "25% more on everything", unlocks: "Everything in Bronze + Tier 2 creative bounties (up to 1,200+ NCTR), NCTR Sighting bounty, Silver rewards" },
  { emoji: "🥇", name: "Gold", range: "500 – 1,999", multiplier: "1.5x", label: "50% more on everything", unlocks: "Everything in Silver + Tier 3 campaign bounties (up to 3,000+ NCTR), Multi-Purchase Bonus, Gold rewards" },
  { emoji: "💎", name: "Platinum", range: "2,000 – 9,999", multiplier: "1.75x", label: "75% more on everything", unlocks: "Everything in Gold + premium rewards, exclusive experiences, priority contributor listing" },
  { emoji: "👑", name: "Diamond", range: "10,000+", multiplier: "2x", label: "Double earnings on everything", unlocks: "Maximum rewards. Community leader. Every opportunity unlocked. Featured contributor." },
];

const rewardCategories = [
  { name: "Streaming Subs", emoji: "📺" },
  { name: "Gift Cards", emoji: "🎁" },
  { name: "Merch & Apparel", emoji: "👕" },
  { name: "Experiences", emoji: "🎉" },
];

const faqItems = [
  {
    question: "What is NCTR?",
    answer: "NCTR is the reward you earn through Crescendo. You earn it by shopping, creating content, referring friends, and participating. Unlike points that expire, your NCTR is yours to keep.",
  },
  {
    question: "What is 360LOCK?",
    answer: "360LOCK is a commitment option for NCTR merch store purchases and merch bounties. When you commit your NCTR for 360 days, your merch rewards are multiplied 3x. Your NCTR is still yours — just committed for that period. Locking also builds your Crescendo status.",
  },
  {
    question: "How do status multipliers work?",
    answer: "Your Crescendo status gives you an earning multiplier on EVERYTHING — shopping, bounties, referrals, all of it. Silver earns 1.25x, Gold earns 1.5x, Platinum earns 1.75x, and Diamond earns 2x. For merch purchases and bounties, the 3x 360LOCK bonus stacks with your status multiplier. A Gold member earns 4.5x on merch (3x × 1.5x).",
  },
  {
    question: "How is Crescendo different from other rewards programs?",
    answer: "Most programs reward spending. Crescendo rewards participation. You don't need to spend money — earn through bounties, referrals, and content creation. Your earning multiplier grows with your status, so rewards compound over time.",
  },
  {
    question: "Do I have to buy anything?",
    answer: "No. Earn NCTR without spending a dollar through bounties, referrals, and community participation. Shopping and merch are additional earning paths, never required.",
  },
];

const FLYWHEEL_NODES = [
  { label: 'Earn', sub: 'Shop, create, refer', Icon: TrendingUp, angle: -90 },
  { label: 'Commit', sub: 'Lock for 360 days', Icon: Lock, angle: 30 },
  { label: 'Unlock', sub: 'Level up your status', Icon: Trophy, angle: 150 },
];

export default function HowItWorksPage() {
  const navigate = useNavigate();
  const { isAuthenticated, setShowAuthModal, setAuthMode } = useAuthContext();

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      setAuthMode('signup');
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-page-bg">
      <SEO
        title="How It Works"
        description="Learn how Crescendo turns everyday actions into real rewards. Earn NCTR, commit via 360LOCK, and unlock exclusive rewards."
      />

      {/* ── Nav bar with theme toggle ── */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-12 py-4 w-full max-w-7xl mx-auto">
        <button onClick={() => navigate('/')} className="text-xl font-black tracking-tight text-text-heading hover:opacity-80 transition-opacity">
          Crescendo
        </button>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button size="sm" onClick={handleCTA} className="rounded-full bg-cta text-cta-foreground hover:bg-cta/90 font-semibold">
            {isAuthenticated ? 'Dashboard' : 'Join Free'}
          </Button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative py-20 md:py-28 px-4 md:px-6 overflow-hidden pt-24">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, hsl(var(--accent-lime-subtle)) 0%, transparent 60%)' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-sm uppercase tracking-widest mb-4 text-text-body-muted">How It Works</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-text-heading">
              How{' '}
              <span className="text-accent-lime" style={{ textShadow: '0 0 30px hsl(var(--accent-lime) / 0.25)' }}>
                Crescendo
              </span>{' '}
              Works
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto text-text-body">
              Earn NCTR through participation. Commit it to build your status. Watch your earning power grow with every tier.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── THREE STEPS ── */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <div className="h-full rounded-2xl p-6 md:p-8 border border-border-card bg-card-bg">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-elevated-bg">
                  <TrendingUp className="w-8 h-8 text-accent-lime" />
                </div>
                <Badge variant="outline" className="mb-3 text-text-body-muted border-border-card">Step 1</Badge>
                <h2 className="text-2xl font-bold mb-3 text-text-heading">Earn NCTR</h2>
                <p className="mb-6 text-sm leading-relaxed text-text-body">
                  Every action earns NCTR. Shop at 6,000+ brands through The Garden, complete content bounties, buy and rep NCTR merch, or invite friends. No purchase required to start.
                </p>
                <div className="space-y-2.5">
                  {earningSubItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-elevated-bg">
                      <span className="text-lg">{item.emoji}</span>
                      <p className="text-sm text-text-body">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}>
              <div className="h-full rounded-2xl p-6 md:p-8 border border-border-card bg-card-bg">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-elevated-bg">
                  <Lock className="w-8 h-8 text-accent-lime" />
                </div>
                <Badge variant="outline" className="mb-3 text-text-body-muted border-border-card">Step 2</Badge>
                <h2 className="text-2xl font-bold mb-3 text-text-heading">Commit &amp; Multiply</h2>
                <p className="mb-4 text-sm leading-relaxed text-text-body">
                  When you earn NCTR, lock it to build your Crescendo status. The higher your status, the more you earn on EVERYTHING. Plus, NCTR merch purchases and merch bounties get an automatic 3x bonus when you commit to 360LOCK (360 days).
                </p>
                <div className="rounded-lg p-3 border" style={{ background: 'hsl(var(--accent-lime-subtle))', borderColor: 'hsl(var(--accent-lime) / 0.15)' }}>
                  <p className="text-xs font-medium text-text-body">
                    Your NCTR stays yours. Locking is commitment, not spending.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}>
              <div className="h-full rounded-2xl p-6 md:p-8 border border-border-card bg-card-bg">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-elevated-bg">
                  <Trophy className="w-8 h-8 text-accent-lime" />
                </div>
                <Badge variant="outline" className="mb-3 text-text-body-muted border-border-card">Step 3</Badge>
                <h2 className="text-2xl font-bold mb-3 text-text-heading">Level Up, Earn More</h2>
                <p className="mb-6 text-sm leading-relaxed text-text-body">
                  Your locked NCTR determines your Crescendo status. Higher status means a higher earning multiplier on everything — shopping, bounties, referrals, all of it. Plus you unlock exclusive bounties, better rewards, and premium experiences.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {rewardCategories.map((cat, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 rounded-lg bg-elevated-bg">
                      <span className="text-xl">{cat.emoji}</span>
                      <span className="text-sm font-medium text-text-heading">{cat.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-4 text-text-body-muted">
                  All rewards are earned through participation. Higher status unlocks better options.
                </p>
                <Button variant="outline" className="w-full mt-4 text-text-heading border-border-card hover:bg-elevated-bg hover:text-text-accent"
                        onClick={() => navigate('/rewards')}>
                  Browse Rewards <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TIER TABLE ── */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-page-bg-alt">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-text-heading mb-2">Crescendo Status Tiers</h2>
            <p className="text-sm text-text-body">Higher status = higher earning multiplier on everything.</p>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-border-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-elevated-bg">
                  <th className="text-left py-3 px-5 text-xs font-semibold uppercase tracking-wider text-text-body-muted">Tier</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold uppercase tracking-wider text-text-body-muted">NCTR Locked</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold uppercase tracking-wider text-text-body-muted">Earning Multiplier</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold uppercase tracking-wider text-text-body-muted">What You Unlock</th>
                </tr>
              </thead>
              <tbody>
                {tierData.map((tier, idx) => (
                  <tr key={idx} className="border-t border-border-card bg-page-bg">
                    <td className="py-3.5 px-5">
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{tier.emoji}</span>
                        <span className="font-semibold text-text-heading text-sm">{tier.name}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-sm text-text-body">{tier.range}</td>
                    <td className="py-3.5 px-5">
                      <span className="font-bold text-sm px-2.5 py-1 rounded-full" style={{ background: 'hsl(var(--accent-lime) / 0.12)', color: 'hsl(var(--text-accent))' }}>
                        {tier.multiplier}
                      </span>
                      <span className="text-xs ml-2 text-text-body-muted">{tier.label}</span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-text-body">{tier.unlocks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {tierData.map((tier, idx) => (
              <div key={idx} className="rounded-xl p-4 border border-border-card bg-page-bg">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{tier.emoji}</span>
                    <span className="font-semibold text-text-heading">{tier.name}</span>
                  </span>
                  <span className="font-bold text-sm px-2.5 py-1 rounded-full" style={{ background: 'hsl(var(--accent-lime) / 0.12)', color: 'hsl(var(--text-accent))' }}>
                    {tier.multiplier}
                  </span>
                </div>
                <p className="text-xs mb-1 text-text-body-muted">{tier.range} NCTR locked</p>
                <p className="text-xs text-text-body">{tier.unlocks}</p>
              </div>
            ))}
          </div>

          {/* Tier callout */}
          <div className="mt-8 rounded-xl p-5 border" style={{ background: 'hsl(var(--accent-lime-subtle))', borderColor: 'hsl(var(--accent-lime) / 0.15)' }}>
            <p className="text-sm text-center text-text-body">
              <span className="font-bold text-text-heading">EXAMPLE:</span> A Gold member (1.25x) who buys a $55 NCTR hoodie with 360LOCK earns{' '}
              <span className="font-bold text-text-accent">110 × 1.25 × 3 = 413 NCTR</span>{' '}
              from the purchase alone. A Bronze member earns 330 NCTR for the same hoodie.{' '}
              <span className="font-semibold text-text-heading">Status pays.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── MULTIPLIER EXPLAINER ── */}
      <section className="py-12 md:py-16 px-4 md:px-6 bg-page-bg">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Badge className="mb-3" style={{ background: 'hsl(var(--accent-lime) / 0.1)', color: 'hsl(var(--text-accent))', borderColor: 'hsl(var(--accent-lime) / 0.3)' }}>
              <Zap className="w-3 h-3 mr-1" />
              Multiplier System
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-text-heading mb-2">How Multipliers Stack</h2>
            <p className="text-sm text-text-body">Two ways to multiply your earnings — and they work together.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-8">
            {/* Card A */}
            <div className="rounded-xl p-6 border border-border-card bg-card-bg">
              <h3 className="font-bold text-text-heading mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent-lime" />
                Status Multiplier
              </h3>
              <ul className="space-y-2.5 text-sm text-text-body">
                <li>• Applies to <span className="text-text-heading font-medium">ALL</span> earning — shopping, bounties, referrals, everything</li>
                <li>• Your Crescendo tier determines your multiplier</li>
                <li>• Bronze 1x → Silver 1.25x → Gold 1.5x → Platinum 1.75x → Diamond 2x</li>
                <li className="font-medium text-text-heading">• This is the #1 reason to level up</li>
              </ul>
            </div>

            {/* Card B */}
            <div className="rounded-xl p-6 border bg-card-bg" style={{ borderColor: 'hsl(var(--accent-lime) / 0.2)' }}>
              <h3 className="font-bold text-text-heading mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-accent-lime" />
                Merch 360LOCK Bonus
              </h3>
              <ul className="space-y-2.5 text-sm text-text-body">
                <li>• Applies to NCTR merch store purchases and merch bounties <span className="text-text-heading font-medium">ONLY</span></li>
                <li>• Automatic 3x when you commit to 360LOCK (360 days)</li>
                <li>• Stacks on top of your status multiplier</li>
                <li className="font-medium text-text-accent">• Gold + merch 360LOCK = 1.25x × 3x = 3.75x</li>
              </ul>
            </div>
          </div>

          {/* Math flow example */}
          <div className="rounded-xl p-6 border border-border-card bg-card-bg">
            <p className="text-sm font-semibold text-text-heading text-center mb-4">Gold Member + Merch Bounty (base 250 NCTR)</p>
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-sm mb-4">
              <span className="font-bold text-text-heading px-3 py-1.5 rounded-lg bg-elevated-bg">250 NCTR</span>
              <span className="text-text-body-muted">→</span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'hsl(var(--accent-lime) / 0.08)', color: 'hsl(var(--text-accent))' }}>×1.25 Gold Status</span>
              <span className="text-text-body-muted">→</span>
              <span className="text-text-heading font-medium">313</span>
              <span className="text-text-body-muted">→</span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'hsl(var(--accent-lime) / 0.08)', color: 'hsl(var(--text-accent))' }}>×3 Merch 360LOCK</span>
              <span className="text-text-body-muted">→</span>
              <span className="font-black text-lg text-text-accent">939 NCTR</span>
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs text-text-body">Same bounty as Bronze: 250 × 1 × 3 = 750 NCTR</p>
              <p className="text-xs font-semibold text-text-heading">The Gold advantage: +189 NCTR — same effort, higher status.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FLYWHEEL ── */}
      <section className="py-12 md:py-16 px-4 md:px-6 bg-page-bg-alt">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-text-heading">The Crescendo Flywheel</h2>
          <p className="text-sm mb-10 text-text-body">Every action feeds the next. The more you participate, the faster it grows.</p>

          <div className="flex items-center justify-center mb-8">
            <div className="relative w-64 h-64 md:w-80 md:h-80">
              <svg viewBox="0 0 300 300" fill="none" className="absolute inset-0 w-full h-full">
                <circle cx="150" cy="150" r="130" stroke="hsl(var(--accent-lime) / 0.15)" strokeWidth="1" strokeDasharray="8 6"
                  className="animate-[spin_25s_linear_infinite]" style={{ transformOrigin: '150px 150px' }} />
                <circle cx="150" cy="150" r="95" stroke="hsl(var(--accent-lime) / 0.06)" strokeWidth="1" />
                {[0, 120, 240].map((deg) => {
                  const midAngle = deg + 60;
                  const rad = (midAngle * Math.PI) / 180;
                  const cx = 150 + 130 * Math.cos(rad);
                  const cy = 150 + 130 * Math.sin(rad);
                  const rot = midAngle + 90;
                  return (
                    <polygon key={deg} points="-3,-4 3,-4 0,4" fill="hsl(var(--accent-lime) / 0.25)"
                      transform={`translate(${cx},${cy}) rotate(${rot})`} />
                  );
                })}
              </svg>
              {FLYWHEEL_NODES.map((node) => {
                const rad = (node.angle * Math.PI) / 180;
                const r = 130;
                const x = 50 + (r / 150) * 50 * Math.cos(rad);
                const y = 50 + (r / 150) * 50 * Math.sin(rad);
                const NodeIcon = node.Icon;
                return (
                  <div key={node.label} className="absolute flex flex-col items-center gap-1.5"
                    style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border bg-card-bg border-accent-lime/25">
                      <NodeIcon className="w-5 h-5 md:w-6 md:h-6 text-accent-lime" />
                    </div>
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-accent-lime">
                      {node.label}
                    </span>
                    <span className="text-[9px] md:text-[10px] whitespace-nowrap text-text-body-muted">
                      {node.sub}
                    </span>
                  </div>
                );
              })}
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-[10px] md:text-xs uppercase tracking-[0.15em] font-bold text-accent-lime/50">
                  Live &amp; Earn
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm max-w-2xl mx-auto leading-relaxed text-text-body">
            Earn NCTR → Lock it → Status rises → Earning multiplier increases → Earn more on everything → Lock more → Status rises more → Better rewards unlock → Keep going
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-page-bg">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-text-heading mb-2">Frequently Asked Questions</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((item, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="rounded-lg px-4 border border-border-card bg-card-bg">
                <AccordionTrigger className="text-left font-semibold text-text-heading hover:no-underline hover:text-text-accent [&>svg]:text-text-accent">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="leading-relaxed text-text-body">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-16 md:py-24 px-4 md:px-6 overflow-hidden bg-page-bg">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, hsl(var(--accent-lime) / 0.06) 0%, transparent 60%)' }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-text-heading mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-lg mb-8 text-text-body">
            Join Crescendo. It's free, and your earning multiplier starts growing from day one.
          </p>
          <Button size="lg" onClick={handleCTA}
                  className="font-bold text-lg px-10 py-6 rounded-full shadow-lg transition-all hover:scale-[1.02] bg-cta text-cta-foreground"
                  style={{ boxShadow: '0 0 40px hsl(var(--accent-lime) / 0.15)' }}>
            {isAuthenticated ? 'Go to Dashboard' : 'Join Crescendo'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="mt-5 text-sm text-text-body-muted">
            Free to join. Always.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
