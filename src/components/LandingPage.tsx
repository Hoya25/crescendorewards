import { useEffect, useRef } from "react";
import { SEO } from "./SEO";
import { MobileNav } from "./MobileNav";
import { Section1Hero } from "./landing/Section1Hero";
import { Section2StatusOpens } from "./landing/Section2StatusOpens";
import { Section3HowItWorks } from "./landing/Section3HowItWorks";
import { Section4Band } from "./landing/Section4Band";
import { Section5Engines } from "./landing/Section5Engines";
import { Section6ForBrands } from "./landing/Section6ForBrands";
import { Section7Close } from "./landing/Section7Close";
import { LandingFooter } from "./landing/LandingFooter";
import { BH_SIGNUP_URL } from "./landing/landingStyles";
import { EcosystemSwitcher } from "./navigation/EcosystemSwitcher";

import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";

const barlow = "'Barlow Condensed', sans-serif";
const hoverCurve = 'cubic-bezier(0.4,0,0.2,1)';

function ScrollReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add("editorial-visible");
      el.style.transition = "none";
      return;
    }

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
    window.location.href = BH_SIGNUP_URL;
  };

  const handleSignIn = () => {
    setAuthMode('signin');
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ backgroundColor: 'var(--landing-paper)', fontFamily: "'DM Sans', sans-serif" }}>
      <SEO 
        title="Status in the NCTR Alliance"
        description="Crescendo is where NCTR Alliance members hold status. Commit NCTR through 360LOCK and rise from Bronze to Diamond. Earn today at NCTR Merch; earning on alliance brands is coming soon."
      />

      {/* Beta Banner removed — single banner lives in AppLayout/BetaBanner */}

      {/* Navigation */}
      <nav
        className="sticky top-0 z-20 px-6 md:px-12 py-4 md:py-5 w-full max-w-7xl mx-auto"
        style={{ backgroundColor: 'var(--landing-paper)' }}
      >
        <div className="w-full flex flex-col gap-3">
          <div className="flex justify-center">
            <EcosystemSwitcher surface="light" />
          </div>

          <div className="flex items-center justify-between">
            <div
              className="flex items-center cursor-pointer"
              onClick={() => navigate('/')}
            >
              <span
                style={{
                  fontFamily: barlow,
                  fontWeight: 900,
                  fontSize: '26px',
                  color: 'var(--landing-ink)',
                  letterSpacing: '-0.02em',
                  textTransform: 'uppercase',
                }}
              >
                CRESCENDO
              </span>
              <span
                style={{
                  fontSize: '9px',
                  letterSpacing: '1px',
                  color: 'var(--landing-muted)',
                  border: '1px solid var(--landing-badge-border)',
                  backgroundColor: 'transparent',
                  padding: '2px 8px',
                  borderRadius: '0px',
                  fontFamily: barlow,
                  fontWeight: 600,
                  marginLeft: '8px',
                }}
              >
                BETA
              </span>
            </div>

            <div className="hidden md:flex items-center gap-5">
              <button
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px',
                  color: 'var(--landing-muted)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: `color 300ms ${hoverCurve}`,
                }}
                onClick={() => navigate('/rewards')}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--landing-ink)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--landing-muted)')}
              >
                Rewards
              </button>
              <button
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px',
                  color: 'var(--landing-muted)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: `color 300ms ${hoverCurve}`,
                }}
                onClick={() => navigate('/how-it-works')}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--landing-ink)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--landing-muted)')}
              >
                How It Works
              </button>
              <button
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px',
                  color: 'var(--landing-ink)',
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
                  backgroundColor: 'var(--landing-ink)',
                  color: 'var(--landing-card)',
                  border: 'none',
                  borderRadius: '0px',
                  padding: '10px 24px',
                  cursor: 'pointer',
                  marginLeft: '8px',
                  transition: `background-color 300ms ${hoverCurve}`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--landing-button-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--landing-ink)')}
              >
                Get ready for launch
              </button>
            </div>

            <MobileNav
              onViewRewards={() => navigate('/rewards')}
              onSignIn={handleSignIn}
              onJoin={handleJoin}
            />
          </div>
        </div>
      </nav>

      <Section1Hero />

      <ScrollReveal>
        <Section2StatusOpens />
      </ScrollReveal>

      <ScrollReveal>
        <Section3HowItWorks />
      </ScrollReveal>

      <ScrollReveal>
        <Section4Band />
      </ScrollReveal>

      <ScrollReveal>
        <Section5Engines />
      </ScrollReveal>

      <ScrollReveal>
        <Section6ForBrands />
      </ScrollReveal>

      <ScrollReveal>
        <Section7Close />
      </ScrollReveal>

      <LandingFooter />
    </div>
  );
}
