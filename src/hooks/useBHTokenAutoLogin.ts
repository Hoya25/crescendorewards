import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Auto-login via Bounty Hunter token.
 * When ?token=xxx&email=abc is present, validates with BH via our edge function proxy,
 * which mints a one-time magic link token_hash. We exchange it via verifyOtp for a real session,
 * then redirect to the originally requested route (preserving /rewards/:id etc.).
 */
export function useBHTokenAutoLogin(isAuthenticated: boolean, authLoading: boolean) {
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading || isAuthenticated) return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    if (!token) return;

    // Compute the redirect target BEFORE we strip query params
    const currentPath = window.location.pathname;
    const cleanedParams = new URLSearchParams(window.location.search);
    cleanedParams.delete('token');
    cleanedParams.delete('email');
    const cleanedSearch = cleanedParams.toString();
    const stateFrom = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    const target = currentPath && currentPath !== '/'
      ? `${currentPath}${cleanedSearch ? `?${cleanedSearch}` : ''}`
      : (stateFrom || '/dashboard');

    // Clean the URL immediately so we don't re-trigger
    window.history.replaceState({}, '', currentPath + (cleanedSearch ? `?${cleanedSearch}` : ''));

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

        const { token_hash, type } = data as { token_hash?: string; type?: string };
        if (!token_hash) {
          console.warn('[BH Token] No token_hash returned');
          if (!cancelled) setProcessing(false);
          return;
        }

        // 2. Exchange the one-time token_hash for a real Supabase session
        const { error: otpError } = await supabase.auth.verifyOtp({
          type: (type as any) || 'magiclink',
          token_hash,
        });

        if (otpError) {
          console.error('[BH Token] verifyOtp failed:', otpError.message);
          if (!cancelled) setProcessing(false);
          return;
        }

        if (!cancelled) navigate(target, { replace: true });
      } catch (err) {
        console.error('[BH Token] Auto-login error:', err);
        if (!cancelled) setProcessing(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authLoading, isAuthenticated]);

  return { processing };
}
