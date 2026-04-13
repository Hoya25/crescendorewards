import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

const DEFAULT_PASSWORD = 'nctr-beta-2026';

/**
 * Auto-login via Bounty Hunter token.
 * When ?token=xxx&email=abc is present, validates with BH via our edge function proxy,
 * provisions/signs in the user, and redirects to /dashboard.
 */
export function useBHTokenAutoLogin(isAuthenticated: boolean, authLoading: boolean) {
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || isAuthenticated) return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    if (!token) return;

    // Clean the URL immediately so we don't re-trigger
    window.history.replaceState({}, '', window.location.pathname);

    let cancelled = false;
    setProcessing(true);

    (async () => {
      try {
        // 1. Validate token with BH via verify-universal-auth edge function
        const { data, error: fnError } = await supabase.functions.invoke('verify-universal-auth', {
          body: {
            email: email?.trim().toLowerCase() || '',
            token,
            action: 'token_login',
          },
        });

        if (fnError || !data?.success) {
          console.warn('[BH Token] Verification failed:', fnError?.message || data?.error);
          if (!cancelled) setProcessing(false);
          return;
        }

        const userEmail = (data.email || email || '').toLowerCase().trim();
        if (!userEmail) {
          console.warn('[BH Token] No email returned');
          if (!cancelled) setProcessing(false);
          return;
        }

        // 2. Try signing in (account may already exist)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: DEFAULT_PASSWORD,
        });

        if (!signInError) {
          if (!cancelled) navigate('/dashboard', { replace: true });
          return;
        }

        // 3. Account doesn't exist — sign up with standard password
        console.log('[BH Token] Sign-in failed, attempting signup for', userEmail);

        const { error: signUpError } = await supabase.auth.signUp({
          email: userEmail,
          password: DEFAULT_PASSWORD,
          options: { emailRedirectTo: window.location.origin },
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            // May have been created by edge fn — retry sign-in
            const { error: retryError } = await supabase.auth.signInWithPassword({
              email: userEmail,
              password: DEFAULT_PASSWORD,
            });
            if (!retryError && !cancelled) {
              navigate('/dashboard', { replace: true });
              return;
            }
          }
          console.error('[BH Token] Sign-up error:', signUpError.message);
          if (!cancelled) setProcessing(false);
          return;
        }

        // 4. Retry sign-in after signup
        const { error: finalError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: DEFAULT_PASSWORD,
        });

        if (!finalError && !cancelled) {
          navigate('/dashboard', { replace: true });
        } else {
          console.warn('[BH Token] Final sign-in failed:', finalError?.message);
          if (!cancelled) setProcessing(false);
        }
      } catch (err) {
        console.error('[BH Token] Auto-login error:', err);
        if (!cancelled) setProcessing(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authLoading, isAuthenticated]);

  return { processing };
}
