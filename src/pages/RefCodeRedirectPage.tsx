import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * Handles /ref/:code routes
 * Stores referral code in localStorage and redirects to signup
 */
export default function RefCodeRedirectPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!code) {
      navigate('/', { replace: true });
      return;
    }

    // Store referral code with 30-day expiry
    const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem('referral_code', code);
    localStorage.setItem('referral_link_type', 'direct');
    localStorage.setItem('referral_expiry', expiry.toString());
    sessionStorage.setItem('referral_code', code);
    sessionStorage.setItem('referral_link_type', 'direct');

    // Redirect to landing page with ref param so AuthModal picks it up
    window.location.href = `/?ref=${code}&link_type=direct`;
  }, [code, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Redirecting to signup...</p>
      </div>
    </div>
  );
}
