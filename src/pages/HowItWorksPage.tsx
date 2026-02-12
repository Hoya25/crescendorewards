import { Coins, Lock, Gift, ShoppingCart, Users, Send, CheckCircle, ChevronDown, ExternalLink, Sparkles, TrendingUp, HelpCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useStatusTiers } from "@/hooks/useStatusTiers";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const earningMethods = [
  { emoji: "🛍️", title: "Shop at The Garden", description: "6,000+ brands — earn NCTR on every purchase", highlight: true },
  { emoji: "👕", title: "Buy & Rep NCTR Merch", description: "Unlock merch bounties + 3x 360LOCK bonus" },
  { emoji: "📸", title: "Complete Bounties", description: "Creative content, referrals, milestones" },
  { emoji: "🤝", title: "Invite Friends", description: "They join, you both earn NCTR" },
];

const exampleRewards = [
  { name: "Streaming Subs", emoji: "📺" },
  { name: "Gift Cards", emoji: "🎁" },
  { name: "Merch & Apparel", emoji: "👕" },
  { name: "Experiences", emoji: "🎉" },
];

const faqItems = [
  {
    question: "What is NCTR?",
    answer: "NCTR represents your ownership stake in the Crescendo community. You earn it through participation — shopping, inviting friends, completing bounties, contributing. It never expires and grows with your engagement.",
  },
  {
    question: "What does '360LOCK' mean?",
    answer: "360LOCK means committing your NCTR for 360 days. Your NCTR isn't spent — it stays yours and counts toward your status tier. Merch purchases earn 3x when you choose 360LOCK. The longer your commitment, the more you earn.",
  },
  {
    question: "How do earning multipliers work?",
    answer: "Your Crescendo status determines your earning multiplier on ALL NCTR earnings. Bronze is 1x, Silver is 1.25x, Gold is 1.5x, Platinum is 2x, and Diamond is 3x. For merch purchases with 360LOCK, the 3x merch bonus STACKS with your status multiplier. A Gold member earns 3x × 1.5x = 4.5x on merch bounties.",
  },
  {
    question: "How is this different from other rewards programs?",
    answer: "Traditional programs give you points to spend. Crescendo gives you ownership to keep. Your NCTR represents your stake in a community you help build. Unlike airline miles or credit card points, your NCTR never expires and your earning power grows as you level up.",
  },
  {
    question: "Do I have to buy anything?",
    answer: "No. You can earn NCTR through shopping, but also through inviting friends, completing bounties, and contributing to the marketplace. Many rewards require zero purchase.",
  },
  {
    question: "What rewards can I get?",
    answer: "Streaming subscriptions, gift cards, exclusive merch, VIP experiences, concert access, and more. New rewards are added by the community every week. Higher status tiers unlock premium rewards.",
  },
];

export default function HowItWorksPage() {
  const navigate = useNavigate();
  const { isAuthenticated, setShowAuthModal, setAuthMode } = useAuthContext();
  const { data: statusTiers = [] } = useStatusTiers();

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      setAuthMode('signup');
      setShowAuthModal(true);
    }
  };

  // Tier display with earning multipliers
  const tierDisplay = statusTiers.length > 0
    ? statusTiers.map((tier) => ({
        name: tier.display_name,
        emoji: tier.badge_emoji,
        nctr: tier.min_nctr_360_locked.toLocaleString(),
        multiplier: `${(tier as any).earning_multiplier ?? 1}x`,
        color: tier.badge_color,
      }))
    : [
        { name: 'Bronze', emoji: '🥉', nctr: '100', multiplier: '1x', color: '#cd7f32' },
        { name: 'Silver', emoji: '🥈', nctr: '1,000', multiplier: '1.25x', color: '#c0c0c0' },
        { name: 'Gold', emoji: '🥇', nctr: '5,000', multiplier: '1.5x', color: '#ffd700' },
        { name: 'Platinum', emoji: '💎', nctr: '15,000', multiplier: '2x', color: '#e5e4e2' },
        { name: 'Diamond', emoji: '👑', nctr: '50,000', multiplier: '3x', color: '#00bfff' },
      ];

  return (
    <div className="min-h-screen" style={{ background: '#1A1A1A' }}>
      <SEO
        title="How It Works"
        description="Learn how Crescendo turns your everyday actions into ownership and rewards. Earn NCTR, commit via 360LOCK, and unlock exclusive rewards."
      />

      {/* Hero Section */}
      <section className="relative py-20 md:py-28 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(170,255,0,0.04) 0%, transparent 60%)' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="mb-4" style={{ background: 'rgba(170,255,0,0.1)', color: '#AAFF00', borderColor: 'rgba(170,255,0,0.3)' }}>
              <Sparkles className="w-3 h-3 mr-1" />
              The Crescendo Way
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white">
              Three Steps to{' '}
              <span style={{ color: '#AAFF00', textShadow: '0 0 30px rgba(170,255,0,0.25)' }}>
                Real Rewards
              </span>
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: '#9CA3AF' }}>
              Earn NCTR, level up your membership, and unlock rewards you actually want.
              The higher you climb, the more you earn.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 3-Step Flow */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1: Earn */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <div className="h-full rounded-2xl p-6 md:p-8 border" style={{ background: '#222', borderColor: '#333' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                  <Coins className="w-8 h-8 text-white" />
                </div>
                <Badge variant="outline" className="mb-3 text-white/50 border-white/20">Step 1</Badge>
                <h2 className="text-2xl font-bold mb-3 text-white">Earn NCTR</h2>
                <p className="mb-6" style={{ color: '#999' }}>
                  Your everyday actions build your NCTR and unlock better rewards.
                </p>
                <div className="space-y-3">
                  {earningMethods.map((method, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${method.highlight ? 'border' : ''}`}
                         style={{ background: method.highlight ? 'rgba(170,255,0,0.04)' : '#2a2a2a', borderColor: method.highlight ? 'rgba(170,255,0,0.2)' : undefined }}>
                      <span className="text-xl">{method.emoji}</span>
                      <div>
                        <p className="font-medium text-sm text-white">{method.title}</p>
                        <p className="text-xs" style={{ color: '#888' }}>{method.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Step 2: Commit */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}>
              <div className="h-full rounded-2xl p-6 md:p-8 border" style={{ background: '#222', borderColor: '#333' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <Badge variant="outline" className="mb-3 text-white/50 border-white/20">Step 2</Badge>
                <h2 className="text-2xl font-bold mb-3 text-white">Level Up</h2>
                <p className="mb-6" style={{ color: '#999' }}>
                  Lock in your NCTR to unlock higher tiers with bigger earning multipliers.
                </p>
                <div className="space-y-2">
                  {tierDisplay.map((tier, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg hover:border-white/10 transition-colors"
                         style={{ background: '#2a2a2a' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{tier.emoji}</span>
                        <span className="font-medium text-sm text-white">{tier.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span style={{ color: '#888' }}>{tier.nctr} NCTR</span>
                        <span className="font-bold px-2 py-0.5 rounded-full text-[10px]"
                              style={{ background: 'rgba(170,255,0,0.12)', color: '#AAFF00' }}>
                          {tier.multiplier}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Step 3: Unlock */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}>
              <div className="h-full rounded-2xl p-6 md:p-8 border" style={{ background: '#222', borderColor: '#333' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <Badge variant="outline" className="mb-3 text-white/50 border-white/20">Step 3</Badge>
                <h2 className="text-2xl font-bold mb-3 text-white">Unlock Rewards</h2>
                <p className="mb-6" style={{ color: '#999' }}>
                  Use your status to unlock streaming subs, gift cards, experiences, and more — no purchase required.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {exampleRewards.map((reward, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 rounded-lg" style={{ background: '#2a2a2a' }}>
                      <span className="text-xl">{reward.emoji}</span>
                      <span className="text-sm font-medium text-white">{reward.name}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-6 text-white border-white/20 hover:bg-white/5 hover:text-[#AAFF00]"
                        onClick={() => navigate('/rewards')}>
                  Browse Rewards <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Multiplier Explainer */}
      <section className="py-12 md:py-16 px-4 md:px-6" style={{ background: '#222' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Badge className="mb-3" style={{ background: 'rgba(170,255,0,0.1)', color: '#AAFF00', borderColor: 'rgba(170,255,0,0.3)' }}>
              <Zap className="w-3 h-3 mr-1" />
              How Multipliers Stack
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Two Layers That Stack</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-8">
            <div className="rounded-xl p-5 border" style={{ background: '#1A1A1A', borderColor: '#333' }}>
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: '#AAFF00' }} />
                Status Multiplier
              </h3>
              <p className="text-sm mb-3" style={{ color: '#999' }}>Applies to ALL earning. Higher tier = bigger multiplier.</p>
              <p className="text-xs" style={{ color: '#666' }}>Bronze 1x → Silver 1.25x → Gold 1.5x → Platinum 2x → Diamond 3x</p>
            </div>
            <div className="rounded-xl p-5 border" style={{ background: '#1A1A1A', borderColor: 'rgba(170,255,0,0.2)' }}>
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" style={{ color: '#AAFF00' }} />
                Merch 360LOCK Bonus
              </h3>
              <p className="text-sm mb-3" style={{ color: '#999' }}>3x automatic on merch purchases + merch bounties. Stacks with status.</p>
              <p className="text-xs" style={{ color: '#666' }}>Gold member + merch bounty = 3x merch × 1.5x Gold = 4.5x</p>
            </div>
          </div>

          {/* Example */}
          <div className="rounded-xl p-5 border text-center" style={{ background: 'rgba(170,255,0,0.03)', borderColor: 'rgba(170,255,0,0.15)' }}>
            <p className="text-sm" style={{ color: '#ccc' }}>
              <span className="font-bold text-white">Example:</span> A 250-base merch bounty as a Gold member →{' '}
              <span style={{ color: '#999' }}>250</span>{' '}
              <span style={{ color: '#666' }}>× 3x merch</span>{' '}
              <span style={{ color: '#666' }}>× 1.5x Gold</span>{' '}
              = <span className="font-bold text-lg" style={{ color: '#AAFF00' }}>1,125 NCTR</span>
            </p>
          </div>
        </div>
      </section>

      {/* Visual Flywheel */}
      <section className="py-12 md:py-16 px-4 md:px-6" style={{ background: '#1A1A1A' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-white">The Crescendo Flywheel</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            <div className="flex items-center gap-3 px-6 py-4 rounded-xl border" style={{ background: '#2a2a2a', borderColor: '#444' }}>
              <Coins className="w-6 h-6" style={{ color: '#F59E0B' }} />
              <span className="font-semibold text-white">Earn</span>
            </div>
            <ChevronDown className="w-6 h-6 rotate-0 md:-rotate-90" style={{ color: '#555' }} />
            <div className="flex items-center gap-3 px-6 py-4 rounded-xl border" style={{ background: '#2a2a2a', borderColor: '#444' }}>
              <Lock className="w-6 h-6" style={{ color: '#8B5CF6' }} />
              <span className="font-semibold text-white">Commit</span>
            </div>
            <ChevronDown className="w-6 h-6 rotate-0 md:-rotate-90" style={{ color: '#555' }} />
            <div className="flex items-center gap-3 px-6 py-4 rounded-xl border" style={{ background: '#2a2a2a', borderColor: '#444' }}>
              <Gift className="w-6 h-6" style={{ color: '#10B981' }} />
              <span className="font-semibold text-white">Reward</span>
            </div>
          </div>
          <p className="text-sm mt-6 max-w-lg mx-auto" style={{ color: '#888' }}>
            Every cycle raises your status. Higher status means higher multiplier. Higher multiplier means more NCTR per cycle. The flywheel accelerates.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-20 px-4 md:px-6" style={{ background: '#222' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-4" style={{ background: '#2a2a2a', color: '#999', borderColor: '#444' }}>
              <HelpCircle className="w-3 h-3 mr-1" />
              Key Concepts
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Frequently Asked Questions</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((item, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="rounded-lg px-4 border" style={{ background: '#1A1A1A', borderColor: '#333' }}>
                <AccordionTrigger className="text-left font-semibold text-white hover:no-underline hover:text-[#AAFF00]">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="leading-relaxed" style={{ color: '#999' }}>
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-6 overflow-hidden" style={{ background: '#1A1A1A' }}>
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, #AAFF00 0%, transparent 70%)' }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-lg mb-8" style={{ color: '#999' }}>
            Join the community that rewards participation, not spending.
          </p>
          <Button size="lg" onClick={handleCTA}
                  className="font-bold text-lg px-10 py-6 rounded-full shadow-lg transition-all hover:scale-[1.02]"
                  style={{ background: '#AAFF00', color: '#111', boxShadow: '0 0 40px rgba(170,255,0,0.15)' }}>
            {isAuthenticated ? 'Go to Dashboard' : 'Join Crescendo — It\'s Free'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="mt-5 text-sm" style={{ color: '#555' }}>
            Free to join. Always.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
