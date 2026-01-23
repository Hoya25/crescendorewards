import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSlugLookup } from '@/hooks/useReferralSlug';
import { Loader2 } from 'lucide-react';

/**
 * Handles /join/:slug routes
 * Looks up the referral code by slug and redirects to signup with the ref parameter
 */
export default function JoinRedirectPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: lookupResult, isLoading, isError } = useSlugLookup(slug);

  useEffect(() => {
    if (isLoading) return;

    if (lookupResult?.found && lookupResult.referral_code) {
      // Found the user - redirect to signup with their referral code
      // Using replace to avoid back-button issues
      window.location.href = `/signup?ref=${lookupResult.referral_code}&link_type=personalized`;
    } else if (lookupResult && !lookupResult.found) {
      // Slug not found - redirect to signup with error indicator
      navigate('/signup?invalid_ref=true', { replace: true });
    } else if (isError) {
      // Error occurred - redirect to regular signup
      navigate('/signup', { replace: true });
    }
  }, [lookupResult, isLoading, isError, navigate]);

  // Show loading state while looking up
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Redirecting to signup...</p>
        {slug && (
          <p className="text-sm text-muted-foreground">
            Invite from: <span className="font-medium text-foreground">{slug}</span>
          </p>
        )}
      </div>
    </div>
  );
}
