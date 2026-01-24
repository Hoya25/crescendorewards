import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useSlugLookup } from '@/hooks/useReferralSlug';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2, AlertCircle, ArrowRight, Gift, Shield, Sparkles, Users, Star, Trophy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CrescendoLogo } from '@/components/CrescendoLogo';
import { NCTRLogo } from '@/components/NCTRLogo';
import { useReferralSettings } from '@/hooks/useReferralSettings';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

interface ReferrerInfo {
  display_name: string | null;
  avatar_url: string | null;
}

/**
 * Dedicated landing page for invite links
 * Shows Crescendo value proposition with referrer context
 */
export default function InviteLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setShowAuthModal, setAuthMode, isAuthenticated } = useAuthContext();
  const { data: lookupResult, isLoading, isError } = useSlugLookup(slug);
  const { data: referralSettings } = useReferralSettings();
  const [error, setError] = useState<string | null>(null);
  const [referrerInfo, setReferrerInfo] = useState<ReferrerInfo | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  
  const allocation360Lock = referralSettings?.allocation360Lock ?? 500;

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle slug lookup
  useEffect(() => {
    if (isLoading) return;

    if (lookupResult?.found && lookupResult.referral_code) {
      setReferralCode(lookupResult.referral_code);
      // Store referral code in session storage for persistence
      sessionStorage.setItem('referral_code', lookupResult.referral_code);
      sessionStorage.setItem('referral_link_type', 'personalized');
      
      // Fetch referrer info
      fetchReferrerInfo(lookupResult.referral_code);
    } else if (lookupResult && !lookupResult.found) {
      setError(`The invite link "${slug}" was not found.`);
    } else if (isError) {
      setError('Something went wrong looking up this invite.');
    }
  }, [lookupResult, isLoading, isError, slug]);

  // Handle direct referral code from URL params (fallback for standard links)
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode && !slug) {
      setReferralCode(refCode);
      sessionStorage.setItem('referral_code', refCode);
      sessionStorage.setItem('referral_link_type', 'standard');
      fetchReferrerInfo(refCode);
    }
  }, [searchParams, slug]);

  const fetchReferrerInfo = async (code: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('referral_code', code)
        .maybeSingle();
      
      if (data && !error) {
        setReferrerInfo({
          display_name: data.full_name,
          avatar_url: data.avatar_url
        });
      }
    } catch (err) {
      console.error('Error fetching referrer info:', err);
    }
  };

  const handleJoinClick = () => {
    // Ensure referral code is stored before opening modal
    if (referralCode) {
      sessionStorage.setItem('referral_code', referralCode);
    }
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleSignInClick = () => {
    setAuthMode('signin');
    setShowAuthModal(true);
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Invite Link</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={handleJoinClick} className="w-full">
              Join Crescendo Anyway
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-sm text-muted-foreground">
              You can still sign up without a referral
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state - keep it minimal
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading your invitation...</p>
        </div>
      </div>
    );
  }

  // Get first name for personalization
  const referrerFirstName = referrerInfo?.display_name?.split(' ')[0] || 'A friend';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <CrescendoLogo className="w-24 sm:w-28" />
          <Button variant="ghost" onClick={handleSignInClick}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Referrer Context */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full"
          >
            <Gift className="w-4 h-4" />
            <span className="text-sm font-medium">
              {referrerFirstName} invited you to join Crescendo
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Earn Rewards for{' '}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                What You Already Do
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join the member-built rewards program where your everyday activities 
              unlock exclusive perks, experiences, and real value.
            </p>
          </motion.div>

          {/* Bonus Banner */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-accent/50 rounded-2xl p-6 border max-w-md mx-auto"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trophy className="w-6 h-6 text-primary" />
              <span className="text-lg font-bold text-foreground">
                Welcome Bonus
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-foreground">
              <span>{allocation360Lock}</span>
              <NCTRLogo size="md" />
              <span>NCTR</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              in 360LOCK when you join through this invite
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button 
              size="lg" 
              onClick={handleJoinClick}
              className="w-full sm:w-auto px-8 py-6 text-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Claim Your Bonus
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          <p className="text-sm text-muted-foreground">
            Free to join • No credit card required
          </p>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              icon: Gift,
              title: 'Exclusive Rewards',
              description: 'Access unique perks from gift cards to VIP experiences, all earned through participation.',
            },
            {
              icon: Shield,
              title: 'On-Chain Status',
              description: 'Lock NCTR to unlock higher tiers with better multipliers and exclusive benefits.',
            },
            {
              icon: Users,
              title: 'Community Built',
              description: 'Members contribute rewards and shape the program together.',
            }
          ].map((prop, idx) => (
            <motion.div
              key={prop.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
              className="bg-card rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <prop.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{prop.title}</h3>
              <p className="text-muted-foreground text-sm">{prop.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-12 md:py-16 border-t">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Get Started in Minutes
          </h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Create your account', desc: 'Sign up free and claim your welcome bonus' },
              { step: '2', title: 'Explore rewards', desc: 'Browse gift cards, experiences, and exclusive perks' },
              { step: '3', title: 'Earn & redeem', desc: 'Complete activities, earn NCTR, and unlock rewards' }
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="container mx-auto px-4 py-12 md:py-16 border-t">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="flex items-center justify-center gap-6 flex-wrap text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span>Free Forever</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span>No Hidden Fees</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span>Points Never Expire</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Bottom CTA (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t md:hidden pb-safe">
        <Button 
          size="lg" 
          onClick={handleJoinClick}
          className="w-full"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Claim Your {allocation360Lock} NCTR Bonus
        </Button>
      </div>

      {/* Footer spacer for mobile */}
      <div className="h-24 md:hidden" />

      {/* Simple Footer */}
      <footer className="border-t py-8 hidden md:block">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Crescendo. Part of the NCTR Alliance.</p>
        </div>
      </footer>
    </div>
  );
}
