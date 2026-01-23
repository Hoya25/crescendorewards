import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSlugLookup } from '@/hooks/useReferralSlug';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Handles /join/:slug routes
 * Looks up the referral code by slug and redirects to signup with the ref parameter
 */
export default function JoinRedirectPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: lookupResult, isLoading, isError } = useSlugLookup(slug);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (lookupResult?.found && lookupResult.referral_code) {
      // Found the user - redirect to landing page with referral code
      // The AuthModal/LandingPage will pick up the ref param
      window.location.href = `/?ref=${lookupResult.referral_code}&link_type=personalized`;
    } else if (lookupResult && !lookupResult.found) {
      // Slug not found - show error with option to continue
      setError(`The invite link "${slug}" was not found.`);
    } else if (isError) {
      // Error occurred - show error
      setError('Something went wrong looking up this invite.');
    }
  }, [lookupResult, isLoading, isError, navigate, slug]);

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
            <Button asChild>
              <Link to="/">
                Continue to Crescendo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              You can still sign up without a referral link
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
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
