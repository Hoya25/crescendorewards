import { useEffect, useRef } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';

declare global {
  interface Window {
    Userback: any;
  }
}

/**
 * Configures the Userback widget with NCTR branding and passes
 * authenticated user context so every feedback submission includes
 * who sent it, their tier, and founding status.
 */
export function UserbackProvider() {
  const { user, isAuthenticated } = useAuthContext();
  const { profile, tier } = useUnifiedUser();
  const identifiedRef = useRef(false);

  // Apply widget branding once Userback is loaded
  useEffect(() => {
    const apply = () => {
      if (!window.Userback) return;
      window.Userback.widget_settings = {
        main_button_text: 'Feedback',
        main_button_background_colour: '#323232',
        main_button_text_colour: '#E2FF6D',
        style: 'text',
        position: 'se',
      };
    };

    // Userback loads async – retry briefly if not ready yet
    if (window.Userback) {
      apply();
    } else {
      const timer = setInterval(() => {
        if (window.Userback) {
          apply();
          clearInterval(timer);
        }
      }, 500);
      return () => clearInterval(timer);
    }
  }, []);

  // Identify user + attach custom data after auth resolves
  useEffect(() => {
    if (!isAuthenticated || !user || !profile || !window.Userback) return;

    // Only identify once per session to avoid redundant calls
    if (identifiedRef.current) return;

    try {
      if (typeof window.Userback.identify === 'function') {
        window.Userback.identify(user.id, {
          name: profile.display_name || 'Anonymous',
          email: profile.email || user.email || '',
          account_id: user.id,
        });
      }

      if (typeof window.Userback.setData === 'function') {
        const crescendoData = profile.crescendo_data || {};
        window.Userback.setData({
          tier: tier?.tier_name || 'none',
          founding_111: (profile as any).founding_111 ? 'yes' : 'no',
          referral_count: (crescendoData as any).referral_count || 0,
        });
      }

      identifiedRef.current = true;
    } catch (err) {
      console.error('Userback identify error:', err);
    }
  }, [isAuthenticated, user, profile, tier]);

  // Reset on logout
  useEffect(() => {
    if (!isAuthenticated) {
      identifiedRef.current = false;
    }
  }, [isAuthenticated]);

  return null;
}
