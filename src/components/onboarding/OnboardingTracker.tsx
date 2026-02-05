import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useUserOnboarding } from "@/hooks/useUserOnboarding";
import { useAuthContext } from "@/contexts/AuthContext";

/**
 * Component that tracks route visits for onboarding purposes.
 * Place this in the app layout to automatically track visits.
 */
export function OnboardingTracker() {
  const { user } = useAuthContext();
  const location = useLocation();
  const { completeItem, progress, loading } = useUserOnboarding();

  useEffect(() => {
    if (!user?.id || loading || !progress) return;

    // Track How It Works page view
    if (location.pathname === '/how-it-works' && !progress.how_it_works_viewed) {
      completeItem('how_it_works_viewed');
    }
  }, [location.pathname, user?.id, loading, progress, completeItem]);

  // This component doesn't render anything
  return null;
}
