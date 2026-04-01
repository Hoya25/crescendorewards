import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { ArrowRight } from "lucide-react";

const barlow = "'Barlow Condensed', sans-serif";
const dmSans = "'DM Sans', sans-serif";

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
  { emoji: "🏢", title: "Brand Partnerships", desc: "Brands invest in the Alliance to reach engaged communities. Their participation budget funds your rewards." },
  { emoji: "🛍️", title: "Shopping Commissions", desc: "Every purchase you make through the ecosystem generates revenue that flows directly into the rewards pool." },
  { emoji: "🎟️", title: "Reward Claims", desc: "When members claim rewards, the ecosystem grows. More activity means more brands, more rewards, more value." },
  { emoji: "🔁", title: "Circular Commerce", desc: "A portion of every trade circulates back into the rewards pool — designed to grow stronger over time, not weaker." },
  { emoji: "🌱", title: "Ecosystem Growth", desc: "As the Alliance expands — more brands, more members, more activity — the rewards pool compounds naturally." },
];

const REWARD_CHANNELS = [
  { emoji: "🏷️", title: "Brand-Funded", subtitle: "BRANDS INVEST IN YOU", desc: "Brands supply rewards, experiences, and access directly to the marketplace as a way to build loyalty with the community." },
  { emoji: "👥", title: "Community-Sourced", subtitle: "MEMBERS HELPING MEMBERS", desc: "Community members list their own rewards and opportunities. When someone claims them, the contributor earns NCTR." },
  { emoji: "🎁", title: "Treasury-Purchased", subtitle: "FUNDED BY COMMERCE", desc: "The treasury uses its revenue to purchase gift cards, experiences, and exclusive opportunities at scale." },
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
      setAuthMode('signin');
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#131313' }}>
      <SEO
        title="How It Works"
        description="Learn how Crescendo turns everyday actions into real rewards. Brands fund it. You earn it."
      />

      {/* ── HERO ── */}
      <section className="relative py-24 md:py-32 px-4 md:px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div {...fadeIn}>
            <p className="text-xs uppercase tracking-[0.25em] mb-5 font-semibold" style={{ color: '#E2FF6D', fontFamily: barlow }}>
              HOW CRESCENDO WORKS
            </p>
            <h1 style={{ fontFamily: barlow, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1 }} className="text-4xl md:text-5xl lg:text-6xl mb-6">
              <span className="text-white">Brands fund it.</span>
              <br />
              <span style={{ color: '#E2FF6D' }}>You earn it.</span>
            </h1>
            <p className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: '#5A5A58', fontFamily: dmSans }}>
              Crescendo is a rewards marketplace fueled by real commerce. Multiple revenue streams keep the treasury funded so rewards, opportunities, benefits, and experiences keep flowing to you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── THE FLYWHEEL ── */}
      <section className="py-16 md:py-24 px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <motion.h2 {...fadeIn} className="text-2xl md:text-3xl text-white mb-12 text-center" style={{ fontFamily: barlow, fontWeight: 700, letterSpacing: '-0.02em' }}>
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
                  className="w-12 h-12 flex items-center justify-center shrink-0 text-xl"
                  style={{ backgroundColor: 'rgba(226,255,109,0.1)', borderRadius: '0px' }}
                >
                  {step.emoji}
                </div>
                <div>
                  <h3 className="text-white text-base mb-1" style={{ fontFamily: barlow, fontWeight: 700 }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#5A5A58', fontFamily: dmSans }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT FUELS THE TREASURY ── */}
      <section className="py-16 md:py-24 px-4 md:px-6" style={{ background: '#1F2020' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl text-white mb-3" style={{ fontFamily: barlow, fontWeight: 700, letterSpacing: '-0.02em' }}>What Fuels the Treasury</h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: '#5A5A58', fontFamily: dmSans }}>
              The treasury doesn't rely on a single source. Multiple revenue streams keep it funded — so the rewards never stop.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TREASURY_SOURCES.map((src, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="p-5"
                style={{ background: '#393939', borderRadius: '0px' }}
              >
                <div className="text-2xl mb-3">{src.emoji}</div>
                <h3 className="text-white text-sm mb-1.5" style={{ fontFamily: barlow, fontWeight: 700 }}>{src.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#5A5A58', fontFamily: dmSans }}>{src.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW REWARDS REACH YOU ── */}
      <section className="py-16 md:py-24 px-4 md:px-6" style={{ background: '#131313' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl text-white mb-3" style={{ fontFamily: barlow, fontWeight: 700, letterSpacing: '-0.02em' }}>How Rewards Reach You</h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: '#5A5A58', fontFamily: dmSans }}>
              Three channels keep the marketplace stocked with rewards, opportunities, and experiences.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {REWARD_CHANNELS.map((ch, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6"
                style={{ background: '#1F2020', borderRadius: '0px' }}
              >
                <div className="text-3xl mb-3">{ch.emoji}</div>
                <h3 className="text-white text-base mb-0.5" style={{ fontFamily: barlow, fontWeight: 700 }}>{ch.title}</h3>
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: '#E2FF6D', fontFamily: barlow }}>{ch.subtitle}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#5A5A58', fontFamily: dmSans }}>{ch.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT IS 360LOCK ── */}
      <section id="360lock" className="py-16 md:py-24 px-4 md:px-6" style={{ background: '#1F2020' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl text-white mb-4" style={{ fontFamily: barlow, fontWeight: 700, letterSpacing: '-0.02em' }}>What is 360LOCK?</h2>
            <p className="text-sm max-w-2xl mx-auto leading-relaxed" style={{ color: '#5A5A58', fontFamily: dmSans }}>
              360LOCK is how you show you're in it for real. Commit your NCTR for 360 days — you still own every token, they just can't be sold during that period.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <motion.div
              {...fadeIn}
              className="p-6"
              style={{ background: '#393939', borderRadius: '0px' }}
            >
              <h3 className="text-white mb-3" style={{ fontFamily: barlow, fontWeight: 700 }}>You get:</h3>
              <ul className="space-y-2 text-sm" style={{ color: '#5A5A58', fontFamily: dmSans }}>
                <li>✓ Higher status</li>
                <li>✓ Better rewards</li>
                <li>✓ More claims</li>
              </ul>
            </motion.div>
            <motion.div
              {...fadeIn}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-6"
              style={{ background: '#393939', borderRadius: '0px' }}
            >
              <h3 className="text-white mb-3" style={{ fontFamily: barlow, fontWeight: 700 }}>The ecosystem gets:</h3>
              <ul className="space-y-2 text-sm" style={{ color: '#5A5A58', fontFamily: dmSans }}>
                <li>✓ Stability</li>
                <li>✓ Less volatility</li>
                <li>✓ Stronger community</li>
              </ul>
            </motion.div>
          </div>
          <motion.div
            {...fadeIn}
            className="p-4 text-center text-sm font-semibold"
            style={{ background: 'rgba(226,255,109,0.1)', color: '#E2FF6D', borderRadius: '0px', fontFamily: barlow }}
          >
            Commit. Level up. The longer you're in, the more you unlock.
          </motion.div>
        </div>
      </section>

      {/* COMMUNITY CATEGORIES SECTION REMOVED — Impact Engine names not displayed publicly */}

      {/* ── BUILT TO LAST ── */}
      <section className="py-16 md:py-24 px-4 md:px-6" style={{ background: '#1F2020' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl text-white mb-3" style={{ fontFamily: barlow, fontWeight: 700, letterSpacing: '-0.02em' }}>Built to Last</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-4">
            {BUILT_TO_LAST.map((item, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6"
                style={{ background: '#393939', borderRadius: '0px' }}
              >
                <div className="text-2xl mb-3">{item.emoji}</div>
                <h3 className="text-white text-sm mb-2" style={{ fontFamily: barlow, fontWeight: 700 }}>{item.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#5A5A58', fontFamily: dmSans }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSING ── */}
      <section className="py-20 md:py-28 px-4 md:px-6 text-center" style={{ background: '#131313' }}>
        <div className="max-w-2xl mx-auto">
          <motion.div {...fadeIn}>
            <p className="italic text-sm mb-8" style={{ color: '#5A5A58', fontFamily: dmSans }}>
              "This isn't built on hype. It's built on commerce, commitment, and community."
            </p>
            <h2 className="text-3xl md:text-4xl text-white mb-3" style={{ fontFamily: barlow, fontWeight: 900, letterSpacing: '-0.02em' }}>Ready to earn?</h2>
            <p className="text-sm mb-8" style={{ color: '#5A5A58', fontFamily: dmSans }}>
              Join Crescendo. Shop. Participate. Build your stake.
            </p>
            <Button
              size="lg"
              onClick={handleCTA}
              className="font-bold text-base px-8 border-0"
              style={{ backgroundColor: '#E2FF6D', color: '#323232', borderRadius: '0px', fontFamily: barlow, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}
            >
              Get Started <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <p className="text-[11px] mt-10" style={{ color: '#5A5A58', fontFamily: dmSans }}>
              NCTR Alliance · Built on Base · Live and Earn
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
