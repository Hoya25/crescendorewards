import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Handles /ref/:code routes
 * Supports both referral codes and @handle format
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

    const processRef = async () => {
      let referralCode = code;

      // If code starts with @, look up the user's referral code by handle
      if (code.startsWith('@')) {
        const handle = code.slice(1);
        try {
          const { data } = await supabase.rpc('get_referral_code_by_handle', { p_handle: handle });
          const result = data as unknown as { success: boolean; referral_code?: string };
          if (result?.success && result.referral_code) {
            referralCode = result.referral_code;
          } else {
            // Handle not found — redirect to home
            navigate('/', { replace: true });
            return;
          }
        } catch {
          navigate('/', { replace: true });
          return;
        }
      }

      // Store referral code with 30-day expiry
      const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem('referral_code', referralCode);
      localStorage.setItem('referral_link_type', 'direct');
      localStorage.setItem('referral_expiry', expiry.toString());
      sessionStorage.setItem('referral_code', referralCode);
      sessionStorage.setItem('referral_link_type', 'direct');

      // Redirect to landing page with ref param so AuthModal picks it up
      window.location.href = `/?ref=${referralCode}&link_type=direct`;
    };

    processRef();
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
