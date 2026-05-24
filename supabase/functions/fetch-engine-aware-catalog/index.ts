// fetch-engine-aware-catalog
// Returns active rewards joined with Engine-membership info for the
// requested user. member_can_claim = (no required engines) OR
// (user has membership in at least one required engine).
// If BH proxy is unavailable, engine-gated rewards are returned with
// member_can_claim=false and bh_proxy_unavailable=true at the top level.
// Tier gating is enforced separately on the client (AND semantics).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const FUNCTIONS_BASE = `${Deno.env.get('SUPABASE_URL')}/functions/v1`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let body: { user_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const user_id = typeof body.user_id === 'string' ? body.user_id : '';

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: rewards, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('is_active', true);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Collect unique required engines across the catalog.
  const requiredSet = new Set<string>();
  for (const r of rewards ?? []) {
    const arr: string[] = Array.isArray(r.required_engines)
      ? r.required_engines
      : [];
    for (const e of arr) requiredSet.add(e);
  }
  const requiredAll = [...requiredSet];

  // Membership lookup (single call, all engines).
  let memberships: Record<string, boolean> = {};
  let bh_proxy_unavailable = false;
  if (user_id && requiredAll.length > 0) {
    try {
      const resp = await fetch(`${FUNCTIONS_BASE}/check-engine-membership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: req.headers.get('Authorization') ?? '',
          apikey: Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        },
        body: JSON.stringify({ user_id, engines: requiredAll }),
      });
      const payload = await resp.json();
      memberships = payload?.memberships ?? {};
      bh_proxy_unavailable = Boolean(payload?.bh_proxy_unavailable);
    } catch {
      bh_proxy_unavailable = true;
      for (const e of requiredAll) memberships[e] = false;
    }
  }

  const decorated = (rewards ?? []).map((r) => {
    const req: string[] = Array.isArray(r.required_engines)
      ? r.required_engines
      : [];
    const member_can_claim =
      req.length === 0 ? true : req.some((e) => memberships[e]);
    return { ...r, member_can_claim };
  });

  return new Response(
    JSON.stringify({
      rewards: decorated,
      memberships,
      bh_proxy_unavailable,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
