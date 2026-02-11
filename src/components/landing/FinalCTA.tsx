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
    <section className="py-16 md:py-24 px-4 md:px-6 bg-foreground">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl md:text-4xl font-bold text-background mb-4">
          Ready to Start Earning?
        </h2>
        <p className="text-base md:text-lg text-background/70 mb-8">
          Join Crescendo. It's free. Your first NCTR is waiting.
        </p>
        <Button
          size="lg"
          onClick={handleJoin}
          className="bg-cta hover:bg-cta/90 text-cta-foreground font-bold text-lg px-10 py-6 rounded-full shadow-lg shadow-cta/25"
        >
          {isAuthenticated ? 'Go to Dashboard' : 'Join Crescendo'} <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        <p className="mt-5 text-sm text-background/50">
          No credit card required. Earn your first 25 NCTR just for signing up.
        </p>
      </div>
    </section>
  );
}
