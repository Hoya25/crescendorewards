import { CrescendoLogo } from "./CrescendoLogo";
import { BetaBadge } from "./BetaBadge";
import { SEO } from "./SEO";
import { MobileNav } from "./MobileNav";
import { Footer } from "./Footer";
import { HeroSection } from "./landing/HeroSection";
import { HowItWorksLanding } from "./landing/HowItWorksLanding";
import { RewardsPreview } from "./landing/RewardsPreview";
import { TheMathSection } from "./landing/TheMathSection";
import { FinalCTA } from "./landing/FinalCTA";
import { Button } from "./ui/button";
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
    <div className="min-h-screen w-full overflow-x-hidden" style={{ background: '#1A1A1A' }}>
      <SEO 
        title="Get Rewarded for the Things You Already Do"
        description="Shop at 6,000+ brands, create content, and earn real rewards that grow the more you commit. Join Crescendo — it's free."
      />

      {/* Navigation */}
      <nav
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 md:p-6 w-full max-w-7xl mx-auto"
      >
        <div className="flex items-center">
          <CrescendoLogo />
          <BetaBadge />
        </div>
        <div className="hidden md:flex items-center gap-4">
          <Button
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/5"
            onClick={() => navigate('/rewards')}
          >
            Rewards
          </Button>
          <Button
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/5"
            onClick={() => navigate('/how-it-works')}
          >
            How It Works
          </Button>
          <Button
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/5"
            onClick={handleSignIn}
          >
            Sign in
          </Button>
          <Button
            onClick={handleJoin}
            className="font-semibold rounded-full"
            style={{ background: '#AAFF00', color: '#111' }}
          >
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

      {/* Section 4: The Math */}
      <TheMathSection />

      {/* Section 5: Final CTA */}
      <FinalCTA />

      {/* Footer */}
      <Footer />
    </div>
  );
}
