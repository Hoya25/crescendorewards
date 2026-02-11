import { Button } from "./ui/button";
import { CrescendoLogo } from "./CrescendoLogo";
import { BetaBadge } from "./BetaBadge";
import { SEO } from "./SEO";
import { MobileNav } from "./MobileNav";
import { Footer } from "./Footer";
import { HeroSection } from "./landing/HeroSection";
import { HowItWorksLanding } from "./landing/HowItWorksLanding";
import { RewardsPreview } from "./landing/RewardsPreview";
import { BrandLogosSection } from "./landing/BrandLogosSection";
import { StatsSection } from "./landing/StatsSection";
import { FinalCTA } from "./landing/FinalCTA";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";

export function LandingPage() {
  const navigate = useNavigate();
  const { setShowAuthModal, setAuthMode } = useAuthContext();

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
        title="Get Rewarded for the Things You Already Do"
        description="Shop at 6,000+ brands, create content, and earn real rewards that grow the more you commit. Join Crescendo — it's free."
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
          <Button onClick={handleJoin} className="bg-cta hover:bg-cta/90 text-cta-foreground font-semibold rounded-full">
            Join Free
          </Button>
        </div>
        <MobileNav
          onViewRewards={() => navigate('/rewards')}
          onSignIn={handleSignIn}
          onJoin={handleJoin}
        />
      </nav>

      {/* Section 1: Hero */}
      <HeroSection onJoin={handleJoin} />

      {/* Section 2: How It Works */}
      <HowItWorksLanding />

      {/* Section 3: Rewards Preview */}
      <RewardsPreview onJoin={handleJoin} />

      {/* Section 4: Brand Logos / The Garden */}
      <BrandLogosSection />

      {/* Section 5: Social Proof Stats */}
      <StatsSection />

      {/* Section 6: Final CTA */}
      <FinalCTA />

      {/* Footer */}
      <Footer />
    </div>
  );
}
