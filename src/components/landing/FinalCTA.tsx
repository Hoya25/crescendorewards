import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function FinalCTA() {
  const navigate = useNavigate();
  const { isAuthenticated, setShowAuthModal, setAuthMode } = useAuthContext();

  const handleJoin = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      setAuthMode('signup');
      setShowAuthModal(true);
    }
  };

  return (
    <section className="relative py-20 md:py-28 px-4 md:px-6 overflow-hidden bg-page-bg">
      {/* Subtle lime gradient */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, hsl(var(--accent-lime)) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-black text-text-heading mb-4">
          The People's Rewards Program
        </h2>
        <p className="text-base md:text-lg mb-10 text-text-body">
          Not corporate-owned. Not pay-to-play. Earned by you. Owned by you.
        </p>
        <Button
          size="lg"
          onClick={handleJoin}
          className="font-bold text-lg px-10 py-6 rounded-full shadow-lg transition-all hover:scale-[1.02] bg-cta text-cta-foreground"
          style={{ boxShadow: '0 0 40px hsl(var(--accent-lime) / 0.15)' }}
        >
          {isAuthenticated ? 'Go to Dashboard' : 'Join Crescendo'}
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        <p className="mt-5 text-sm text-text-body-muted">
          Free to join. Always.
        </p>
      </div>
    </section>
  );
}
