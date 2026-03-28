import { useEffect, useRef } from "react";
import { SEO } from "./SEO";
import { MobileNav } from "./MobileNav";
import { HeroSection } from "./landing/HeroSection";
import { HowItWorksLanding } from "./landing/HowItWorksLanding";
import { RewardsPreview } from "./landing/RewardsPreview";
import { FiveWaysToEarn } from "./landing/FiveWaysToEarn";
import { TheMathSection } from "./landing/TheMathSection";
import { FinalCTA } from "./landing/FinalCTA";
import { LandingFooter } from "./landing/LandingFooter";

import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";

const barlow = "'Barlow Condensed', sans-serif";
const hoverCurve = 'cubic-bezier(0.4,0,0.2,1)';

function ScrollReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("editorial-visible");
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
      className={`editorial-hidden ${className}`}
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </div>
  );
}

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
    <div className="min-h-screen w-full overflow-x-hidden" style={{ backgroundColor: '#F9F9F7' }}>
      <SEO 
        title="Get Rewarded for the Things You Already Do"
        description="Shop at 6,000+ brands, create content, and earn real rewards that grow the more you commit. Join Crescendo — it's free."
      />

      {/* Beta Banner removed — single banner lives in AppLayout/BetaBanner */}

      {/* Navigation */}
      <nav
        className="sticky top-0 z-20 flex items-center justify-between px-6 md:px-12 py-4 md:py-5 w-full max-w-7xl mx-auto"
        style={{ backgroundColor: '#F9F9F7' }}
      >
        <span
          style={{
            fontFamily: barlow,
            fontWeight: 900,
            fontSize: '26px',
            color: '#323232',
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          CRESCENDO
        </span>

        <div className="hidden md:flex items-center gap-5">
          <button
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              color: '#5A5A58',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: `color 300ms ${hoverCurve}`,
            }}
            onClick={() => navigate('/rewards')}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#323232')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#5A5A58')}
          >
            Rewards
          </button>
          <button
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              color: '#5A5A58',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: `color 300ms ${hoverCurve}`,
            }}
            onClick={() => navigate('/how-it-works')}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#323232')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#5A5A58')}
          >
            How It Works
          </button>
          <button
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              color: '#323232',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: `color 300ms ${hoverCurve}`,
            }}
            onClick={handleSignIn}
          >
            Sign In
          </button>
          <button
            onClick={handleJoin}
            style={{
              fontFamily: barlow,
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              backgroundColor: '#323232',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '0px',
              padding: '10px 24px',
              cursor: 'pointer',
              marginLeft: '8px',
              transition: `background-color 300ms ${hoverCurve}`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a1a1a')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#323232')}
          >
            JOIN FREE
          </button>
        </div>

        <MobileNav
          onViewRewards={() => navigate('/rewards')}
          onSignIn={handleSignIn}
          onJoin={handleJoin}
        />
      </nav>

      {/* Hero */}
      <HeroSection onJoin={handleJoin} />

      {/* Spacer for stat cards overlap */}
      <div style={{ height: '80px' }} />

      {/* Core Principle Callout */}
      <div className="container mx-auto px-6 md:px-12 mt-8 mb-8">
        <div
          className="max-w-3xl mx-auto"
          style={{
            backgroundColor: '#323232',
            padding: '24px 28px',
            borderRadius: '0px',
          }}
        >
          <p
            style={{
              fontFamily: barlow,
              fontWeight: 700,
              fontSize: '10px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '6px',
            }}
          >
            The Core Principle
          </p>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              lineHeight: 1.6,
              color: '#FFFFFF',
            }}
          >
            Commitment is rewarded. 360LOCK is how members participate — one commitment, 360 days, amplified rewards. The longer you commit, the stronger your position.
          </p>
        </div>
      </div>

      {/* Sections */}
      <ScrollReveal>
        <HowItWorksLanding />
      </ScrollReveal>

      <ScrollReveal>
        <FiveWaysToEarn />
      </ScrollReveal>

      <ScrollReveal>
        <RewardsPreview onJoin={handleJoin} />
      </ScrollReveal>

      <ScrollReveal>
        <TheMathSection />
      </ScrollReveal>

      <ScrollReveal>
        <FinalCTA />
      </ScrollReveal>

      <LandingFooter />
    </div>
  );
}
