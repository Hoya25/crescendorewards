import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";
import { ArrowRight } from "lucide-react";

const barlow = "'Barlow Condensed', sans-serif";
const dmSans = "'DM Sans', sans-serif";
const dmMono = "'DM Mono', monospace";

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

const sectionPad = { padding: '100px 0' };

// ── Data ──

const FLYWHEEL_STEPS = [
  { num: "01", title: "You Shop & Participate", desc: "Browse thousands of brands through The Garden or Crescendo's marketplace. Every purchase, every action counts." },
  { num: "02", title: "Revenue Flows In", desc: "Shopping commissions, brand partnerships, and ecosystem activity generate revenue. Multiple streams, one treasury." },
  { num: "03", title: "The Treasury Fuels Everything", desc: "The treasury exists for one purpose: to fund rewards, opportunities, and experiences for the community." },
  { num: "04", title: "Rewards Keep Flowing", desc: "Brands contribute directly. Community members list their own. The treasury purchases the rest. Three channels keep the marketplace full." },
  { num: "05", title: "You Commit & Level Up", desc: "Earn NCTR and commit through 360LOCK for 360 days. Your commitment builds status. Higher status unlocks better rewards." },
  { num: "06", title: "The Community Compounds", desc: "More members means more commerce, more revenue, better rewards, more members. The cycle strengthens itself." },
];

const TREASURY_SOURCES = [
  { title: "Brand Partnerships", desc: "Brands invest in the Alliance to reach engaged communities. Their participation budget funds your rewards." },
  { title: "Shopping Commissions", desc: "Every purchase you make through the ecosystem generates revenue that flows directly into the rewards pool." },
  { title: "Reward Claims", desc: "When members claim rewards, the ecosystem grows. More activity means more brands, more rewards, more value." },
  { title: "Circular Commerce", desc: "A portion of every trade circulates back into the rewards pool — designed to grow stronger over time, not weaker." },
  { title: "Ecosystem Growth", desc: "As the Alliance expands — more brands, more members, more activity — the rewards pool compounds naturally." },
];

const REWARD_CHANNELS = [
  { title: "Brand-Funded", subtitle: "BRANDS INVEST IN YOU", desc: "Brands supply rewards, experiences, and access directly to the marketplace as a way to build loyalty with the community." },
  { title: "Community-Sourced", subtitle: "MEMBERS HELPING MEMBERS", desc: "Community members list their own rewards and opportunities. When someone claims them, the contributor earns NCTR." },
  { title: "Treasury-Purchased", subtitle: "FUNDED BY COMMERCE", desc: "The treasury uses its revenue to purchase gift cards, experiences, and exclusive opportunities at scale." },
];

const BUILT_TO_LAST = [
  { title: "Always Fueled", desc: "The treasury is constantly replenished by multiple revenue streams. As the community grows, revenue grows with it — creating a self-reinforcing cycle." },
  { title: "Cash Firewall", desc: "A hard constraint ensures cash outflows never exceed cash contributions. Not a policy — a structural rule built into the design." },
  { title: "Pay on Claim", desc: "Nothing is purchased until someone claims it. The treasury only spends when there's real demand — zero wasted inventory, ever." },
];

// ── Helpers ──

const headlineStyle = (light: boolean): React.CSSProperties => ({
  fontFamily: barlow,
  fontWeight: 900,
  fontSize: 'clamp(36px, 6vw, 56px)',
  textTransform: 'uppercase',
  letterSpacing: '-0.02em',
  lineHeight: 1.1,
  color: light ? '#131313' : '#FFFFFF',
});

const descStyle = (light: boolean): React.CSSProperties => ({
  fontFamily: dmSans,
  fontSize: '16px',
  lineHeight: 1.7,
  maxWidth: '640px',
  margin: '0 auto',
  color: light ? '#6B6B68' : '#8A8A88',
});

const cardBg = (light: boolean): React.CSSProperties => ({
  background: light ? '#FFFFFF' : '#1E1E1C',
  border: light ? '1px solid #E0DFDB' : 'none',
  borderRadius: '0px',
  padding: '28px',
});

const cardTitle: React.CSSProperties = {
  fontFamily: barlow,
  fontWeight: 700,
  fontSize: '18px',
  textTransform: 'uppercase',
};

const cardBody = (light: boolean): React.CSSProperties => ({
  fontFamily: dmSans,
  fontSize: '14px',
  lineHeight: 1.7,
  color: light ? '#6B6B68' : '#8A8A88',
});

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
    <div className="min-h-screen">
      <SEO
        title="How It Works"
        description="Learn how Crescendo turns everyday actions into real rewards. Brands participate. You earn."
      />

      {/* ── HERO (dark) ── */}
      <section style={{ ...sectionPad, background: '#131313' }} className="px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeIn}>
            <p className="text-xs uppercase tracking-[0.25em] mb-5 font-semibold" style={{ color: '#E2FF6D', fontFamily: barlow }}>
              HOW CRESCENDO WORKS
            </p>
            <h1 style={headlineStyle(false)} className="mb-6">
              <span className="text-white">Brands participate.</span>
              <br />
              <span style={{ color: '#E2FF6D' }}>You earn.</span>
            </h1>
            <p style={descStyle(false)}>
              Crescendo is a rewards marketplace powered by real commerce. The more active the community, the more rewards, opportunities, and experiences flow to members.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── THE FLYWHEEL (light) — card grid ── */}
      <section style={{ ...sectionPad, background: '#F5F4F0' }} className="px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-12">
            <h2 style={headlineStyle(true)} className="mb-4">The Flywheel</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FLYWHEEL_STEPS.map((step, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                style={cardBg(true)}
                className="relative overflow-hidden"
              >
                {/* Lime left border */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: '#E2FF6D' }} />
                {/* Large background step number */}
                <span
                  className="absolute top-2 right-3 select-none pointer-events-none"
                  style={{ fontFamily: dmMono, fontSize: '48px', fontWeight: 400, color: 'rgba(0,0,0,0.04)', lineHeight: 1 }}
                >
                  {step.num}
                </span>
                <div className="relative z-10 pl-3">
                  <h3 style={{ ...cardTitle, color: '#131313' }} className="mb-2">{step.title}</h3>
                  <p style={cardBody(true)}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY REWARDS KEEP GROWING (dark) ── */}
      <section style={{ ...sectionPad, background: '#131313' }} className="px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-12">
            <h2 style={headlineStyle(false)} className="mb-4">Why Your Rewards Keep Growing</h2>
            <p style={descStyle(false)}>
              The Alliance is built on real revenue — not hype. Every source below funds the rewards you unlock.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TREASURY_SOURCES.map((src, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                style={cardBg(false)}
                className="relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: '#E2FF6D' }} />
                <div className="pl-3">
                  <h3 style={{ ...cardTitle, color: '#FFFFFF' }} className="mb-2">{src.title}</h3>
                  <p style={cardBody(false)}>{src.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW REWARDS REACH YOU (light) ── */}
      <section style={{ ...sectionPad, background: '#F5F4F0' }} className="px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-12">
            <h2 style={headlineStyle(true)} className="mb-4">How Rewards Reach You</h2>
            <p style={descStyle(true)}>
              Three channels keep the marketplace stocked with rewards, opportunities, and experiences.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {REWARD_CHANNELS.map((ch, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={cardBg(true)}
                className="relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: '#E2FF6D' }} />
                <div className="pl-3">
                  <h3 style={{ ...cardTitle, color: '#131313' }} className="mb-0.5">{ch.title}</h3>
                  <p className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: '#E2FF6D', fontFamily: barlow }}>{ch.subtitle}</p>
                  <p style={cardBody(true)}>{ch.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT IS 360LOCK (dark) ── */}
      <section id="360lock" style={{ ...sectionPad, background: '#131313' }} className="px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-10">
            <h2 style={headlineStyle(false)} className="mb-4">What is 360LOCK?</h2>
            <p style={descStyle(false)}>
              360LOCK is how you show you're in it for real. Commit your NCTR for 360 days — you still own every token, they just can't be sold during that period.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-5 mb-6">
            <motion.div {...fadeIn} style={cardBg(false)} className="relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: '#E2FF6D' }} />
              <div className="pl-3">
                <h3 style={{ ...cardTitle, color: '#FFFFFF' }} className="mb-3">You get:</h3>
                <ul className="space-y-2 text-sm" style={{ color: '#8A8A88', fontFamily: dmSans }}>
                  <li>✓ Higher status</li>
                  <li>✓ Better rewards</li>
                  <li>✓ More claims</li>
                </ul>
              </div>
            </motion.div>
            <motion.div {...fadeIn} transition={{ duration: 0.5, delay: 0.1 }} style={cardBg(false)} className="relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: '#E2FF6D' }} />
              <div className="pl-3">
                <h3 style={{ ...cardTitle, color: '#FFFFFF' }} className="mb-3">The ecosystem gets:</h3>
                <ul className="space-y-2 text-sm" style={{ color: '#8A8A88', fontFamily: dmSans }}>
                  <li>✓ Stability</li>
                  <li>✓ Less volatility</li>
                  <li>✓ Stronger community</li>
                </ul>
              </div>
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

      {/* ── BUILT TO LAST (light) ── */}
      <section style={{ ...sectionPad, background: '#F5F4F0' }} className="px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-12">
            <h2 style={headlineStyle(true)} className="mb-3">Built to Last</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {BUILT_TO_LAST.map((item, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={cardBg(true)}
                className="relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: '#E2FF6D' }} />
                <div className="pl-3">
                  <h3 style={{ ...cardTitle, color: '#131313' }} className="mb-2">{item.title}</h3>
                  <p style={cardBody(true)}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA (dark) ── */}
      <section style={{ ...sectionPad, background: '#131313' }} className="px-4 md:px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <motion.div {...fadeIn}>
            <p className="italic text-sm mb-8" style={{ color: '#8A8A88', fontFamily: dmSans }}>
              "This isn't built on hype. It's built on commerce, commitment, and community."
            </p>
            <h2 style={{ fontFamily: barlow, fontWeight: 900, fontSize: '48px', color: '#FFFFFF', lineHeight: 1.1, textTransform: 'uppercase' }} className="mb-3">
              Ready to participate?
            </h2>
            <p className="text-sm mb-8" style={{ color: '#8A8A88', fontFamily: dmSans }}>
              Join Crescendo. Shop. Participate. Build your status.
            </p>
            <button
              onClick={handleCTA}
              style={{
                fontFamily: dmMono,
                fontSize: '14px',
                textTransform: 'uppercase',
                background: '#E2FF6D',
                color: '#131313',
                border: 'none',
                borderRadius: '0px',
                padding: '16px 40px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 500,
              }}
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] mt-10" style={{ color: '#8A8A88', fontFamily: dmSans }}>
              NCTR Alliance · Live and Earn
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
