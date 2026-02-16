import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { ArrowRight } from "lucide-react";

// ── Animation helper ──
const fadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

// ── Data ──

const FLYWHEEL_STEPS = [
  { emoji: "🛒", title: "You Shop & Participate", desc: "Browse The Garden's 6,000+ brand partners or Crescendo's marketplace. Every purchase, every action counts." },
  { emoji: "💰", title: "Revenue Flows In", desc: "Shopping commissions, brand wholesale purchases through Butterfly Studios, transaction fees. Multiple streams, one treasury." },
  { emoji: "🏦", title: "The Treasury Fuels Everything", desc: "The treasury exists for one purpose: to fund rewards, opportunities, benefits, and experiences for the community. It's constantly being replenished by commerce." },
  { emoji: "🎁", title: "Rewards Keep Flowing", desc: "Brands contribute directly. Community members list their own. The treasury purchases gift cards and experiences. Three channels keep the marketplace full." },
  { emoji: "🔒", title: "You Commit & Level Up", desc: "Earn NCTR and commit through 360LOCK for 360 days. Your commitment builds status. Higher status unlocks better rewards." },
  { emoji: "🔄", title: "The Community Compounds", desc: "More members means more commerce, more revenue, better rewards, more members. The cycle strengthens itself." },
];

const TREASURY_SOURCES = [
  { emoji: "🏢", title: "Brand Partnerships", desc: "Brands purchase NCTR at wholesale through Butterfly Studios to fund campaigns and reach engaged communities." },
  { emoji: "🛍️", title: "Shopping Commissions", desc: "Every purchase through The Garden and Crescendo generates affiliate commissions that flow straight to the treasury." },
  { emoji: "🎟️", title: "Claim Purchases", desc: "Members purchase claims to unlock rewards — direct cash fueling the treasury." },
  { emoji: "🔁", title: "Transaction Fees", desc: "A small fee on every NCTR trade flows automatically to the treasury. Always on, always growing." },
  { emoji: "📈", title: "DeFi & Liquidity", desc: "Returns from staking and liquidity pools add another revenue layer." },
];

const REWARD_CHANNELS = [
  { emoji: "🏷️", title: "Brand-Funded", subtitle: "BRANDS INVEST IN YOU", desc: "Brands supply rewards, experiences, and access directly to the marketplace as a way to build loyalty with the community." },
  { emoji: "👥", title: "Community-Sourced", subtitle: "MEMBERS HELPING MEMBERS", desc: "Community members list their own rewards and opportunities. When someone claims them, the contributor earns NCTR." },
  { emoji: "🎁", title: "Treasury-Purchased", subtitle: "FUNDED BY COMMERCE", desc: "The treasury uses its revenue to purchase gift cards, experiences, and exclusive opportunities at scale." },
];

const IMPACT_ENGINES = [
  { name: "THROTTLE", sport: "Powersports", emoji: "🏍️" },
  { name: "GROUNDBALL", sport: "Lacrosse", emoji: "🥍" },
  { name: "STARDUST", sport: "Entertainment", emoji: "✨" },
  { name: "SWEAT", sport: "Skilled Trades", emoji: "🔧" },
  { name: "SISU", sport: "Recovery", emoji: "💪" },
  { name: "SHIFT", sport: "Hospitality", emoji: "🍽️" },
];

const BUILT_TO_LAST = [
  { emoji: "🔄", title: "Always Fueled", desc: "The treasury is constantly replenished by multiple revenue streams. As the community grows, revenue grows with it — creating a self-reinforcing cycle." },
  { emoji: "🛡️", title: "Cash Firewall", desc: "A hard constraint ensures cash outflows never exceed cash contributions. Not a policy — a structural rule built into the design." },
  { emoji: "📦", title: "Pay on Claim", desc: "Nothing is purchased until someone claims it. The treasury only spends when there's real demand — zero wasted inventory, ever." },
];

// ── Component ──

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
    <div className="min-h-screen" style={{ background: '#111' }}>
      <SEO
        title="How It Works"
        description="Learn how Crescendo turns everyday actions into real rewards. Brands fund it. You earn it."
      />

      {/* ── HERO ── */}
      <section className="relative py-24 md:py-32 px-4 md:px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div {...fadeIn}>
            <p className="text-xs uppercase tracking-[0.25em] mb-5 font-semibold" style={{ color: '#E2FF6D' }}>
              HOW CRESCENDO WORKS
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-[1.1]">
              <span className="text-white">Brands fund it.</span>
              <br />
              <span style={{ color: '#E2FF6D' }}>You earn it.</span>
            </h1>
            <p className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Crescendo is a rewards marketplace fueled by real commerce. Multiple revenue streams keep the treasury funded so rewards, opportunities, benefits, and experiences keep flowing to you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── THE FLYWHEEL ── */}
      <section className="py-16 md:py-24 px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <motion.h2 {...fadeIn} className="text-2xl md:text-3xl font-bold text-white mb-12 text-center">
            The Flywheel
          </motion.h2>
          <div className="space-y-6">
            {FLYWHEEL_STEPS.map((step, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex gap-4 items-start"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl"
                  style={{ backgroundColor: 'rgba(226,255,109,0.1)' }}
                >
                  {step.emoji}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base mb-1">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT FUELS THE TREASURY ── */}
      <section className="py-16 md:py-24 px-4 md:px-6" style={{ background: '#1a1a1a' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">What Fuels the Treasury</h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
              The treasury doesn't rely on a single source. Multiple revenue streams keep it funded — so the rewards never stop.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TREASURY_SOURCES.map((src, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-xl p-5 border"
                style={{ background: '#222', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className="text-2xl mb-3">{src.emoji}</div>
                <h3 className="font-bold text-white text-sm mb-1.5">{src.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{src.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW REWARDS REACH YOU ── */}
      <section className="py-16 md:py-24 px-4 md:px-6" style={{ background: '#111' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">How Rewards Reach You</h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Three channels keep the marketplace stocked with rewards, opportunities, and experiences.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {REWARD_CHANNELS.map((ch, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-xl p-6 border"
                style={{ background: '#1a1a1a', borderColor: 'rgba(226,255,109,0.1)' }}
              >
                <div className="text-3xl mb-3">{ch.emoji}</div>
                <h3 className="font-bold text-white text-base mb-0.5">{ch.title}</h3>
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: '#E2FF6D' }}>{ch.subtitle}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{ch.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT IS 360LOCK ── */}
      <section id="360lock" className="py-16 md:py-24 px-4 md:px-6" style={{ background: '#1a1a1a' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">What is 360LOCK?</h2>
            <p className="text-sm max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              360LOCK is how you show you're in it for real. Commit your NCTR for 360 days — you still own every token, they just can't be sold during that period.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <motion.div
              {...fadeIn}
              className="rounded-xl p-6 border"
              style={{ background: '#222', borderColor: 'rgba(226,255,109,0.15)' }}
            >
              <h3 className="font-bold text-white mb-3">You get:</h3>
              <ul className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <li>✓ Higher status</li>
                <li>✓ Better rewards</li>
                <li>✓ More claims</li>
              </ul>
            </motion.div>
            <motion.div
              {...fadeIn}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-xl p-6 border"
              style={{ background: '#222', borderColor: 'rgba(226,255,109,0.15)' }}
            >
              <h3 className="font-bold text-white mb-3">The ecosystem gets:</h3>
              <ul className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <li>✓ Stability</li>
                <li>✓ Less volatility</li>
                <li>✓ Stronger community</li>
              </ul>
            </motion.div>
          </div>
          <motion.div
            {...fadeIn}
            className="rounded-xl p-4 text-center text-sm font-semibold"
            style={{ background: 'rgba(226,255,109,0.1)', color: '#E2FF6D' }}
          >
            Commit. Level up. The longer you're in, the more you unlock.
          </motion.div>
        </div>
      </section>

      {/* ── IMPACT ENGINES ── */}
      <section className="py-16 md:py-24 px-4 md:px-6" style={{ background: '#111' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Impact Engines</h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
              NCTR isn't one community — it's infrastructure for many. Each Impact Engine is a token economy built for a specific passion. Same treasury model. Different world.
            </p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {IMPACT_ENGINES.map((eng, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-xl p-5 border text-center"
                style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className="text-3xl mb-2">{eng.emoji}</div>
                <h3 className="font-black text-sm tracking-wider" style={{ color: '#E2FF6D', fontFamily: 'monospace' }}>{eng.name}</h3>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{eng.sport}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BUILT TO LAST ── */}
      <section className="py-16 md:py-24 px-4 md:px-6" style={{ background: '#1a1a1a' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Built to Last</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-4">
            {BUILT_TO_LAST.map((item, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-xl p-6 border"
                style={{ background: '#222', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className="text-2xl mb-3">{item.emoji}</div>
                <h3 className="font-bold text-white text-sm mb-2">{item.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSING ── */}
      <section className="py-20 md:py-28 px-4 md:px-6 text-center" style={{ background: '#111' }}>
        <div className="max-w-2xl mx-auto">
          <motion.div {...fadeIn}>
            <p className="italic text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
              "This isn't built on hype. It's built on commerce, commitment, and community."
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Ready to earn?</h2>
            <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Join Crescendo. Shop. Participate. Build your stake.
            </p>
            <Button
              size="lg"
              onClick={handleCTA}
              className="rounded-full font-bold text-base px-8 border-0"
              style={{ backgroundColor: '#E2FF6D', color: '#111' }}
            >
              Get Started <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <p className="text-[11px] mt-10" style={{ color: 'rgba(255,255,255,0.25)' }}>
              NCTR Alliance · Built on Base · Live and Earn
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
