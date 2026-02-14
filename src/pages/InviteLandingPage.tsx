import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSlugLookup } from '@/hooks/useReferralSlug';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  ArrowRight, Gift, Shield, Sparkles, Users, Trophy, 
  CheckCircle2, Zap, TrendingUp, Star, Link2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CrescendoLogo } from '@/components/CrescendoLogo';
import { NCTRLogo } from '@/components/NCTRLogo';
import { BetaBadge } from '@/components/BetaBadge';
import { useReferralSettings } from '@/hooks/useReferralSettings';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ReferrerInfo {
  display_name: string | null;
  avatar_url: string | null;
}

// Tier colors for visual progression
const TIER_VISUALS = [
  { name: 'Bronze', emoji: '🥉', color: 'from-amber-600 to-amber-700' },
  { name: 'Silver', emoji: '🥈', color: 'from-slate-400 to-slate-500' },
  { name: 'Gold', emoji: '🥇', color: 'from-yellow-500 to-amber-500' },
  { name: 'Platinum', emoji: '💎', color: 'from-cyan-400 to-blue-500' },
  { name: 'Diamond', emoji: '👑', color: 'from-violet-500 to-purple-600' },
];

/**
 * Dedicated landing page for invite links
 * Shows Crescendo value proposition with referrer context
 * Handles: /join/:slug and ?ref=CODE
 */
export default function InviteLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setShowAuthModal, setAuthMode, isAuthenticated, user } = useAuthContext();
  const { data: lookupResult, isLoading } = useSlugLookup(slug);
  const { data: referralSettings } = useReferralSettings();
  const [referrerInfo, setReferrerInfo] = useState<ReferrerInfo | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isLoadingReferrer, setIsLoadingReferrer] = useState(false);
  const [invalidSlug, setInvalidSlug] = useState(false);
  
  const allocation360Lock = referralSettings?.allocation360Lock ?? 500;

  // Store referral code with 30-day expiry in localStorage
  const storeReferralCode = (code: string, linkType: string) => {
    const expiry = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
    localStorage.setItem('referral_code', code);
    localStorage.setItem('referral_link_type', linkType);
    localStorage.setItem('referral_expiry', expiry.toString());
    // Also store in session for immediate use
    sessionStorage.setItem('referral_code', code);
    sessionStorage.setItem('referral_link_type', linkType);
  };

  // Check and restore referral code from localStorage
  useEffect(() => {
    const storedCode = localStorage.getItem('referral_code');
    const expiry = localStorage.getItem('referral_expiry');
    
    if (storedCode && expiry && Date.now() < parseInt(expiry)) {
      // Valid stored code exists
      if (!slug && !searchParams.get('ref')) {
        setReferralCode(storedCode);
        fetchReferrerInfo(storedCode);
      }
    } else if (storedCode) {
      // Expired - clear it
      localStorage.removeItem('referral_code');
      localStorage.removeItem('referral_link_type');
      localStorage.removeItem('referral_expiry');
    }
  }, []);

  // Handle slug lookup
  useEffect(() => {
    if (isLoading || !slug) return;

    if (lookupResult?.found && lookupResult.referral_code) {
      setReferralCode(lookupResult.referral_code);
      storeReferralCode(lookupResult.referral_code, 'personalized');
      fetchReferrerInfo(lookupResult.referral_code);
    } else if (lookupResult && !lookupResult.found) {
      setInvalidSlug(true);
      // Still allow signup, just don't show referrer
    }
  }, [lookupResult, isLoading, slug]);

  // Handle direct referral code from URL params
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode && !slug) {
      setReferralCode(refCode);
      storeReferralCode(refCode, 'standard');
      fetchReferrerInfo(refCode);
    }
  }, [searchParams, slug]);

  const fetchReferrerInfo = async (code: string) => {
    setIsLoadingReferrer(true);
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
    } finally {
      setIsLoadingReferrer(false);
    }
  };

  const handleJoinClick = () => {
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

  // Get first name for personalization
  const referrerFirstName = referrerInfo?.display_name?.split(' ')[0];
  const hasReferrer = !!referrerFirstName && !invalidSlug;

  // Already authenticated - show special message
  // Already authenticated - show special message
  if (isAuthenticated && user) {
    const userName = user.user_metadata?.full_name?.split(' ')[0] || 'friend';
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CrescendoLogo className="w-24 sm:w-28" />
              <BetaBadge />
            </div>
          </div>
        </header>

        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Users className="w-10 h-10 text-primary" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h1 className="text-3xl md:text-4xl font-bold">
                You're Already Part of the Community!
              </h1>
              <p className="text-xl text-muted-foreground">
                Great to see you, {userName}! 
                Share your own invite link to earn NCTR and help friends build status.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button size="lg" onClick={() => navigate('/invite')}>
                <Link2 className="w-5 h-5 mr-2" />
                Share Your Invite Link
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CrescendoLogo className="w-24 sm:w-28" />
            <BetaBadge />
          </div>
          <Button variant="ghost" onClick={handleSignInClick}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-10 md:py-16">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Referrer Context Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full"
          >
            <Gift className="w-4 h-4" />
            {isLoadingReferrer ? (
              <Skeleton className="h-4 w-48" />
            ) : (
              <span className="text-sm font-medium">
                {hasReferrer 
                  ? `🎉 ${referrerFirstName} invited you to the Crescendo Beta!`
                  : `🎉 You've been invited to the Crescendo Beta!`
                }
              </span>
            )}
          </motion.div>

          {/* Main Headline */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Build Status.{' '}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Unlock Rewards.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Join the community where your contributions unlock real rewards. 
              No spending required—just earn your place.
            </p>
          </motion.div>

          {/* Welcome Bonus Banner */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-primary/10 via-accent/50 to-primary/10 rounded-2xl p-6 border max-w-md mx-auto"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trophy className="w-6 h-6 text-primary" />
              <span className="text-lg font-bold text-foreground">
                Welcome Bonus
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 text-2xl sm:text-3xl font-bold text-foreground">
              <span>{allocation360Lock}</span>
              <NCTRLogo size="md" variant="dark" />
              <span>NCTR</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              in 360LOCK to start building your status
            </p>
          </motion.div>

          {/* Primary CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button 
              size="lg" 
              onClick={handleJoinClick}
              className="px-8 py-6 text-lg animate-pulse hover:animate-none"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Accept Invitation & Join Beta
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-muted-foreground mt-3">
              Free to join • No credit card required
            </p>
          </motion.div>
        </div>
      </section>

      {/* How Crescendo Works Section */}
      <section className="container mx-auto px-4 py-12 md:py-16 border-t">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              How Crescendo Works
            </h2>
            <p className="text-muted-foreground">
              Crescendo flips the script on traditional rewards programs.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                emoji: '🔒',
                title: 'BUILD STATUS',
                description: 'Lock NCTR tokens to level up from Bronze → Diamond. Higher status = better rewards, bigger discounts, and exclusive access.',
                gradient: 'from-amber-500/20 to-yellow-500/20',
              },
              {
                icon: Gift,
                emoji: '🎁',
                title: 'UNLOCK REWARDS',
                description: 'Your status unlocks rewards from thousands of brands—gift cards, experiences, and exclusive perks.',
                gradient: 'from-emerald-500/20 to-green-500/20',
              },
              {
                icon: TrendingUp,
                emoji: '💰',
                title: 'EARN BY CONTRIBUTING',
                description: 'Submit rewards, refer friends, shop through The Garden. Every contribution earns NCTR toward higher status.',
                gradient: 'from-blue-500/20 to-cyan-500/20',
              }
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "bg-gradient-to-br rounded-2xl p-6 border",
                  item.gradient
                )}
              >
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8 text-lg font-medium text-foreground"
          >
            It's not about spending. It's about <span className="text-primary">earning your place</span>.
          </motion.p>
        </div>
      </section>

      {/* Status Tiers Preview */}
      <section className="container mx-auto px-4 py-12 md:py-16 border-t">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Climb the Ranks
            </h2>
            <p className="text-muted-foreground">
              Commit more NCTR to unlock higher tiers and better rewards
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex justify-center items-center gap-2 sm:gap-4 flex-wrap"
          >
            {TIER_VISUALS.map((tier, idx) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-xl",
                  idx === 0 && "bg-primary/10 ring-2 ring-primary"
                )}
              >
                <span className="text-2xl sm:text-3xl">{tier.emoji}</span>
                <span className="text-xs sm:text-sm font-medium">{tier.name}</span>
                {idx === 0 && (
                  <span className="text-[10px] text-primary font-medium">You start here</span>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Beta Benefits Section */}
      <section className="container mx-auto px-4 py-12 md:py-16 border-t bg-gradient-to-b from-transparent to-primary/5">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              EXCLUSIVE BETA ACCESS
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Join During Beta = Extra Perks
            </h2>
            <p className="text-muted-foreground">
              Beta testers who actively participate will be rewarded.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[
              { icon: Star, text: 'Early access before public launch' },
              { icon: Trophy, text: 'Bonus NCTR earning opportunities' },
              { icon: Sparkles, text: 'Help shape the platform with feedback' },
              { icon: CheckCircle2, text: 'Founding member recognition at launch' },
            ].map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-3 p-4 bg-card rounded-xl border"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-sm">{benefit.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="container mx-auto px-4 py-10 border-t">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap text-muted-foreground text-sm">
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

      {/* Bottom CTA Section */}
      <section className="container mx-auto px-4 py-12 md:py-16 border-t hidden md:block">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <Button 
            size="lg" 
            onClick={handleJoinClick}
            className="px-10 py-7 text-xl"
          >
            <Sparkles className="w-6 h-6 mr-2" />
            Accept Invitation & Join Beta
            <ArrowRight className="w-6 h-6 ml-2" />
          </Button>
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <button 
              onClick={handleSignInClick}
              className="text-primary hover:underline font-medium"
            >
              Sign In
            </button>
          </p>
        </div>
      </section>

      {/* Sticky Bottom CTA (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t md:hidden pb-safe z-50">
        <Button 
          size="lg" 
          onClick={handleJoinClick}
          className="w-full"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Accept Invitation & Join Beta
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
