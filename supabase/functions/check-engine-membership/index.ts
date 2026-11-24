import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// check-engine-membership
// Proxies an Engine membership lookup to Bounty Hunter.
// Caller passes { user_id, engines: string[] } and receives
// { memberships: Record<engineSlug, boolean>, has_any_required: boolean }.
// On BH failure → LOCKED_FALLBACK (all false, has_any_required=false,
// bh_proxy_unavailable=true). The catalog treats this as "locked".

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-sync-secret',
};

const BH_MEMBERSHIP_URL =
  Deno.env.get('BH_ENGINE_MEMBERSHIP_URL') ??
  'https://auibudfactqhisvmiotw.supabase.co/functions/v1/bh-engine-membership-check';

const SYNC_SECRET = Deno.env.get('SYNC_SECRET') ?? '';

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

interface ReqBody {
  user_id?: string;
  engines?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Sign-in check: a member can look up only themselves.
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
  const authClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(
    authHeader.replace('Bearer ', ''),
  );
  const sub = claimsData?.claims?.sub as string | undefined;
  if (claimsError || !sub) return json({ error: 'Unauthorized' }, 401);

  let body: ReqBody = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const requested = typeof body.user_id === 'string' ? body.user_id : '';
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );
  const { data: me } = await serviceClient
    .from('unified_profiles')
    .select('bh_user_id')
    .eq('auth_user_id', sub)
    .maybeSingle();
  const ownBh = (me?.bh_user_id as string | null) ?? null;
  if (requested && requested !== sub && requested !== ownBh) {
    return json({ error: 'forbidden' }, 403);
  }
  // BH always receives the caller's own bh_user_id, never a client value.
  const user_id = ownBh ?? '';
  const engines = Array.isArray(body.engines)
    ? body.engines.filter((s) => typeof s === 'string')
    : [];

  if (engines.length === 0) {
    // Nothing to check → empty membership map (not a lock).
    return new Response(
      JSON.stringify({
        memberships: {},
        has_any_required: engines.length === 0,
        bh_proxy_unavailable: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const lockedFallback = () => {
    const memberships: Record<string, boolean> = {};
    for (const e of engines) memberships[e] = false;
    return new Response(
      JSON.stringify({
        memberships,
        has_any_required: false,
        bh_proxy_unavailable: true,
        fallback: 'LOCKED_FALLBACK',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  };

  if (!user_id) return lockedFallback();

  try {
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 10_000);

    const resp = await fetch(BH_MEMBERSHIP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sync-secret': SYNC_SECRET,
      },
      body: JSON.stringify({ action: 'check_membership', user_id, engines }),
      signal: ctrl.signal,
    });
    clearTimeout(timeoutId);

    if (!resp.ok) return lockedFallback();

    const payload = await resp.json();
    const memberships: Record<string, boolean> = {};
    for (const e of engines) {
      memberships[e] = Boolean(payload?.memberships?.[e]);
    }
    const has_any_required = engines.some((e) => memberships[e]);

    return new Response(
      JSON.stringify({
        memberships,
        has_any_required,
        bh_proxy_unavailable: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch {
    return lockedFallback();
  }
});
