import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

const BH_VERIFY_URL = 'https://auibudfactqhisvmiotw.supabase.co/functions/v1/verify-crescendo-token';
const DEFAULT_PASSWORD = 'nctr-beta-2026';

/**
 * Auto-login via Bounty Hunter token.
 * When ?token=xxx is present, verifies it with BH, then signs the user in.
 * Returns { processing: true } while the flow is in progress so the app
 * can hold off rendering the login page.
 */
export function useBHTokenAutoLogin(isAuthenticated: boolean, authLoading: boolean) {
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || isAuthenticated) return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return;

    // Clean the URL immediately so we don't re-trigger
    window.history.replaceState({}, '', window.location.pathname);

    let cancelled = false;
    setProcessing(true);

    (async () => {
      try {
        // 1. Verify token with BH
        const res = await fetch(BH_VERIFY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          console.warn('[BH Token] Verification endpoint returned', res.status);
          if (!cancelled) setProcessing(false);
          return;
        }

        const result = await res.json();
        if (!result.valid || !result.email) {
          console.warn('[BH Token] Token invalid or no email returned');
          if (!cancelled) setProcessing(false);
          return;
        }

        const email = result.email as string;

        // 2. Try signing in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: DEFAULT_PASSWORD,
        });

        if (!signInError) {
          // Success — redirect to dashboard
          if (!cancelled) navigate('/dashboard', { replace: true });
          return;
        }

        // 3. Account doesn't exist yet — create via verify-universal-auth then retry
        console.log('[BH Token] Sign-in failed, attempting account creation for', email);

        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/verify-universal-auth`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-sync-secret': 'pending-client-check',
            },
            body: JSON.stringify({
              email,
              bh_user_id: 'pending',
              display_name: result.display_name || 'pending',
            }),
          }
        );

        // Now sign up with the standard password
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: DEFAULT_PASSWORD,
          options: { emailRedirectTo: window.location.origin },
        });

        if (signUpError) {
          console.error('[BH Token] Sign-up error:', signUpError.message);
          // If already registered, try sign-in again (may have been created by edge fn)
          if (signUpError.message.includes('already registered')) {
            const { error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password: DEFAULT_PASSWORD,
            });
            if (!retryError && !cancelled) {
              navigate('/dashboard', { replace: true });
              return;
            }
          }
          if (!cancelled) setProcessing(false);
          return;
        }

        // Retry sign-in after signup
        const { error: finalError } = await supabase.auth.signInWithPassword({
          email,
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
