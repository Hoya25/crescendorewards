import { useEffect, useRef } from "react";
import { SEO } from "./SEO";
import { MobileNav } from "./MobileNav";
import { Footer } from "./Footer";
import { ThemeToggle } from "./ThemeToggle";
import { HeroSection } from "./landing/HeroSection";
import { HowItWorksLanding } from "./landing/HowItWorksLanding";
import { RewardsPreview } from "./landing/RewardsPreview";
import { FiveWaysToEarn } from "./landing/FiveWaysToEarn";
import { TheMathSection } from "./landing/TheMathSection";
import { FinalCTA } from "./landing/FinalCTA";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "./ThemeProvider";

function ScrollReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("landed-visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`landed-hidden ${className}`}
    >
      {children}
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const { setShowAuthModal, setAuthMode } = useAuthContext();
  const { theme } = useTheme();

  const handleJoin = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleSignIn = () => {
    setAuthMode('signin');
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-page-bg">
      <SEO 
        title="Get Rewarded for the Things You Already Do"
        description="Shop at 6,000+ brands, create content, and earn real rewards that grow the more you commit. Join Crescendo — it's free."
      />

      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-12 py-4 md:py-5 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-lime flex items-center justify-center">
            <span className="text-black font-black text-sm tracking-tight">360</span>
          </div>
          <span className="text-xl font-bold text-foreground">Crescendo</span>
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-accent-lime text-black">BETA</span>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <Button
            variant="ghost"
            className="text-sm font-medium text-text-body hover:text-text-accent hover:bg-transparent transition-colors"
            onClick={() => navigate('/rewards')}
          >
            Rewards
          </Button>
          <Button
            variant="ghost"
            className="text-sm font-medium text-text-body hover:text-text-accent hover:bg-transparent transition-colors"
            onClick={() => navigate('/how-it-works')}
          >
            How It Works
          </Button>
          <Button
            variant="ghost"
            className="text-sm font-medium text-text-body hover:text-text-accent hover:bg-transparent transition-colors"
            onClick={handleSignIn}
          >
            Sign in
          </Button>
          <ThemeToggle />
          <Button
            onClick={handleJoin}
            className="ml-3 font-semibold rounded-full px-5 text-sm bg-cta text-cta-foreground hover:bg-cta/90"
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
      <ScrollReveal>
        <HowItWorksLanding />
      </ScrollReveal>

      {/* Section 2.5: Five Ways to Earn */}
      <ScrollReveal>
        <FiveWaysToEarn />
      </ScrollReveal>

      {/* Section 3: Rewards Preview */}
      <ScrollReveal>
        <RewardsPreview onJoin={handleJoin} />
      </ScrollReveal>

      {/* Section 4: The Math */}
      <ScrollReveal>
        <TheMathSection />
      </ScrollReveal>

      {/* Section 5: Final CTA */}
      <ScrollReveal>
        <FinalCTA />
      </ScrollReveal>

      {/* Footer */}
      <Footer />
    </div>
  );
}
