import { Button } from "./ui/button";
import { Sparkles, ShoppingBag, Trophy, Gift, ArrowRight } from "lucide-react";
import { CrescendoLogo } from "./CrescendoLogo";
import { BetaBadge } from "./BetaBadge";
import { SEO } from "./SEO";
import { MobileNav } from "./MobileNav";
import { Footer } from "./Footer";
import { RewardsShowcase } from "./landing/RewardsShowcase";
import { SocialProofSection } from "./landing/SocialProofSection";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";

export function LandingPage() {
  const navigate = useNavigate();
  const { setShowAuthModal, setAuthMode, isAuthenticated } = useAuthContext();

  const handleJoin = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleSignIn = () => {
    setAuthMode('signin');
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background">
      <SEO 
        title="Unlock Rewards You Actually Want"
        description="Shop, invite friends, contribute — earn your way to streaming subs, gift cards, and experiences. No purchase required."
      />

      {/* Navigation */}
      <nav className="flex items-center justify-between p-4 md:p-6 w-full max-w-7xl mx-auto">
        <div className="flex items-center">
          <CrescendoLogo />
          <BetaBadge />
        </div>
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/rewards')}>
            Rewards
          </Button>
          <Button variant="ghost" onClick={() => navigate('/how-it-works')}>
            How It Works
          </Button>
          <Button variant="ghost" onClick={handleSignIn}>
            Sign in
          </Button>
          <Button onClick={handleJoin} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Join Free
          </Button>
        </div>
        <MobileNav
          onViewRewards={() => navigate('/rewards')}
          onSignIn={handleSignIn}
          onJoin={handleJoin}
        />
      </nav>

      {/* HERO — above the fold, no jargon */}
      <section className="relative pt-16 md:pt-28 pb-12 md:pb-20 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/3 to-background -z-10" />
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 md:mb-6 text-foreground">
            Unlock Rewards You Actually Want
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 md:mb-10">
            Shop, invite friends, contribute — earn your way to streaming subs, gift cards, and experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg text-base md:text-lg px-6 md:px-8 w-full sm:w-auto"
              onClick={() => navigate('/rewards')}
            >
              See Rewards <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-base md:text-lg w-full sm:w-auto"
              onClick={() => navigate('/how-it-works')}
            >
              How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* REWARDS SHOWCASE */}
      <RewardsShowcase />

      {/* HOW IT WORKS — simplified 3 steps */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">Three Steps to Free Rewards</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1: Earn */}
            <div className="bg-background rounded-2xl p-6 md:p-8 text-center border hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <ShoppingBag className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step 1</span>
              <h3 className="text-xl font-bold mt-1 mb-2">Earn Points</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Shop at 6,000+ brands. Invite friends. Add value to the community.
              </p>
            </div>

            {/* Step 2: Level Up */}
            <div className="bg-background rounded-2xl p-6 md:p-8 text-center border hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step 2</span>
              <h3 className="text-xl font-bold mt-1 mb-2">Level Up</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Your points unlock membership tiers. Higher tier = better rewards.
              </p>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                {['Member', '🥉', '🥈', '🥇', '💎', '👑'].map((icon, i) => (
                  <span key={i} className="flex items-center">
                    {i > 0 && <span className="mx-0.5">→</span>}
                    <span>{icon}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Step 3: Claim */}
            <div className="bg-background rounded-2xl p-6 md:p-8 text-center border hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Gift className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step 3</span>
              <h3 className="text-xl font-bold mt-1 mb-2">Claim Rewards</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Streaming subs, gift cards, experiences — yours to claim, no purchase required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <SocialProofSection />

      {/* FINAL CTA */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-gradient-to-r from-primary to-primary/80">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground mb-4 md:mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-base md:text-xl text-primary-foreground/80 mb-6 md:mb-8">
            Join free. No credit card. Start unlocking rewards today.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-base md:text-lg px-6 md:px-8"
            onClick={isAuthenticated ? () => navigate('/dashboard') : handleJoin}
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Join Free'} <Sparkles className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
