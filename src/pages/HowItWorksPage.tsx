import { Coins, Lock, Gift, ShoppingCart, Users, Send, CheckCircle, ChevronDown, ExternalLink, Sparkles, TrendingUp, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { NCTRLogo } from "@/components/NCTRLogo";
import { CrescendoLogo } from "@/components/CrescendoLogo";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useStatusTiers } from "@/hooks/useStatusTiers";
import { motion } from "framer-motion";

const earningMethods = [
  {
    icon: ShoppingCart,
    emoji: "🛒",
    title: "Shop at The Garden",
    description: "6,000+ brands — Earn NCTR on every purchase",
    highlight: true,
  },
  {
    icon: Users,
    emoji: "👥",
    title: "Invite Friends",
    description: "Earn when they join and participate",
  },
  {
    icon: Gift,
    emoji: "🎁",
    title: "Contribute to Marketplace",
    description: "List items, create offers, add value",
  },
  {
    icon: CheckCircle,
    emoji: "✅",
    title: "Complete Actions",
    description: "Profile, wishlists, engagement",
  },
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
    answer: "NCTR is your digital ownership stake in the NCTR Alliance ecosystem. It's not a cryptocurrency you buy — it's earned through participation and contribution. The more you contribute to the community, the more ownership you accumulate.",
  },
  {
    question: "What is 360LOCK?",
    answer: "360LOCK is a 360-day commitment of your NCTR. By locking your NCTR, you unlock higher status tiers with better rewards and multipliers. Your NCTR isn't spent — it stays yours and continues growing. Think of it as staking your position in the community.",
  },
  {
    question: "How is this different from other rewards programs?",
    answer: "Traditional programs give you points to spend. Crescendo gives you ownership to keep. Your NCTR represents your stake in a community you help build. The more you contribute, the more you own. Unlike airline miles or credit card points, your NCTR never expires and grows with your participation.",
  },
  {
    question: "Do I have to buy anything?",
    answer: "No. You can earn NCTR through shopping (if you choose), but also through inviting friends, contributing to the marketplace, and completing actions. Many rewards require zero purchase. We believe in earning through participation, not just spending.",
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

  // Default tier display data with multipliers
  const defaultTierData = [
    { name: 'Member', emoji: '💧', nctr: '0', multiplier: '1x', color: '#6b7280' },
    { name: 'Bronze', emoji: '🥉', nctr: '100', multiplier: '1.1x', color: '#cd7f32' },
    { name: 'Silver', emoji: '🥈', nctr: '1,000', multiplier: '1.25x', color: '#c0c0c0' },
    { name: 'Gold', emoji: '🥇', nctr: '5,000', multiplier: '1.5x', color: '#ffd700' },
    { name: 'Platinum', emoji: '💎', nctr: '15,000', multiplier: '2x', color: '#e5e4e2' },
    { name: 'Diamond', emoji: '👑', nctr: '50,000', multiplier: '3x', color: '#00bfff' },
  ];

  // Build tier display from database or use defaults
  const tierDisplay = statusTiers.length > 0 
    ? statusTiers.map((tier, idx) => ({
        name: tier.display_name,
        emoji: tier.badge_emoji,
        nctr: tier.min_nctr_360_locked.toLocaleString(),
        multiplier: defaultTierData[idx]?.multiplier || '1x',
        color: tier.badge_color,
      }))
    : defaultTierData;

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="How It Works"
        description="Learn how Crescendo turns your everyday actions into ownership and rewards. Earn NCTR, commit via 360LOCK, and unlock exclusive rewards."
      />

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-background -z-10" />
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-3 h-3 mr-1" />
              The Crescendo Way
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Earn Rewards by Being You
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Crescendo turns your everyday actions into ownership and rewards. Here's how it works.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 3-Step Flow */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1: Earn */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0 }}
            >
              <Card className="h-full border-2 hover:border-primary/30 transition-all">
                <CardContent className="p-6 md:p-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6 shadow-lg">
                    <Coins className="w-8 h-8 text-white" />
                  </div>
                  <Badge variant="outline" className="mb-3">Step 1</Badge>
                  <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                    Earn NCTR <NCTRLogo />
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Your everyday actions build your stake in the community.
                  </p>
                  
                  <div className="space-y-3">
                    {earningMethods.map((method, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                          method.highlight ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'
                        }`}
                      >
                        <span className="text-xl">{method.emoji}</span>
                        <div>
                          <p className="font-medium text-sm">{method.title}</p>
                          <p className="text-xs text-muted-foreground">{method.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Step 2: Commit */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <Card className="h-full border-2 hover:border-primary/30 transition-all">
                <CardContent className="p-6 md:p-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <Badge variant="outline" className="mb-3">Step 2</Badge>
                  <h2 className="text-2xl font-bold mb-3">Commit & Grow</h2>
                  <p className="text-muted-foreground mb-6">
                    Lock your NCTR for 360 days (360LOCK) to unlock your status tier.
                  </p>
                  
                  <div className="space-y-2">
                    {tierDisplay.slice(0, 6).map((tier, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{tier.emoji}</span>
                          <span className="font-medium text-sm">{tier.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-muted-foreground">{tier.nctr} NCTR</span>
                          <Badge variant="secondary" className="text-[10px]">{tier.multiplier}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Step 3: Unlock */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="h-full border-2 hover:border-primary/30 transition-all">
                <CardContent className="p-6 md:p-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mb-6 shadow-lg">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                  <Badge variant="outline" className="mb-3">Step 3</Badge>
                  <h2 className="text-2xl font-bold mb-3">Unlock Rewards</h2>
                  <p className="text-muted-foreground mb-6">
                    Use your status to unlock streaming subs, gift cards, experiences, and more — no purchase required.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {exampleRewards.map((reward, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <span className="text-xl">{reward.emoji}</span>
                        <span className="text-sm font-medium">{reward.name}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-6"
                    onClick={() => navigate('/rewards')}
                  >
                    Browse Rewards
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Visual Flywheel */}
      <section className="py-12 md:py-16 px-4 md:px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">The Crescendo Flywheel</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30">
              <Coins className="w-6 h-6 text-amber-600" />
              <span className="font-semibold">Earn</span>
            </div>
            <ChevronDown className="w-6 h-6 text-muted-foreground rotate-0 md:-rotate-90" />
            <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-violet-100 to-violet-200 dark:from-violet-900/30 dark:to-violet-800/30">
              <Lock className="w-6 h-6 text-violet-600" />
              <span className="font-semibold">Commit</span>
            </div>
            <ChevronDown className="w-6 h-6 text-muted-foreground rotate-0 md:-rotate-90" />
            <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30">
              <Gift className="w-6 h-6 text-emerald-600" />
              <span className="font-semibold">Reward</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-muted text-muted-foreground">
              <HelpCircle className="w-3 h-3 mr-1" />
              Key Concepts
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold">Frequently Asked Questions</h2>
          </div>
          
          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((item, idx) => (
              <AccordionItem 
                key={idx} 
                value={`item-${idx}`}
                className="border rounded-lg px-4 bg-card"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-gradient-to-r from-primary to-primary/80">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to start earning?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8">
            Join thousands of members already building ownership through Crescendo.
          </p>
          <Button 
            size="lg"
            variant="secondary"
            onClick={handleCTA}
            className="text-lg px-8"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Join Crescendo'}
            <TrendingUp className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
