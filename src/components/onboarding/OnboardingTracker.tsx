import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useUserOnboarding } from "@/hooks/useUserOnboarding";
import { useUnifiedUser } from "@/contexts/UnifiedUserContext";

/**
 * Component that tracks route visits for onboarding purposes.
 * Place this in the app layout to automatically track visits.
 */
export function OnboardingTracker() {
  const { profile } = useUnifiedUser();
  const location = useLocation();
  const { completeItem, progress, loading } = useUserOnboarding();

  useEffect(() => {
    if (!profile?.id || loading || !progress) return;

    // Track How It Works page view
    if (location.pathname === '/how-it-works' && !progress.how_it_works_viewed) {
      completeItem('how_it_works_viewed');
    }
  }, [location.pathname, profile?.id, loading, progress, completeItem]);

  // This component doesn't render anything
  return null;
}
