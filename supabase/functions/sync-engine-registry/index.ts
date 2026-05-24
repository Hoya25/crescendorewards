// sync-engine-registry
// Periodically (every 6h via pg_cron) pulls the canonical Engine
// registry from Bounty Hunter and upserts it into the local
// engine_registry_mirror table. Gracefully degrades to a no-op
// when the BH proxy is unavailable.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-sync-secret',
};

const BH_REGISTRY_URL =
  Deno.env.get('BH_ENGINE_REGISTRY_URL') ??
  'https://auibudfactqhisvmiotw.supabase.co/functions/v1/godview-engine-admin-proxy';

const GODVIEW_INGEST_KEY = Deno.env.get('GODVIEW_INGEST_KEY') ?? '';

interface BHEngineRow {
  id: string;
  display_name?: string;
  name?: string;
  status?: string;
  primary_color?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // ---- Pull from BH (graceful degrade on any failure) ----
  let engines: BHEngineRow[] = [];
  let bh_proxy_unavailable = false;
  let bh_error: string | null = null;

  try {
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 10_000);

    const resp = await fetch(BH_REGISTRY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-godview-key': GODVIEW_INGEST_KEY,
      },
      body: JSON.stringify({ action: 'list_engines' }),
      signal: ctrl.signal,
    });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      bh_proxy_unavailable = true;
      bh_error = `bh_status_${resp.status}`;
    } else {
      const payload = await resp.json();
      engines = Array.isArray(payload?.engines)
        ? payload.engines
        : Array.isArray(payload)
          ? payload
          : [];
    }
  } catch (e) {
    bh_proxy_unavailable = true;
    bh_error = (e as Error).message ?? 'fetch_failed';
  }

  if (bh_proxy_unavailable) {
    return new Response(
      JSON.stringify({
        ok: true,
        bh_proxy_unavailable: true,
        bh_error,
        upserted: 0,
        note: 'BH registry unreachable — mirror left unchanged.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // ---- Upsert mirror rows ----
  const rows = engines
    .filter((e) => e && typeof e.id === 'string' && e.id.length > 0)
    .map((e) => ({
      id: e.id,
      display_name: e.display_name ?? e.name ?? e.id,
      status: e.status ?? 'design',
      primary_color: e.primary_color ?? null,
      last_synced_at: new Date().toISOString(),
    }));

  let upserted = 0;
  if (rows.length > 0) {
    const { error, count } = await supabase
      .from('engine_registry_mirror')
      .upsert(rows, { onConflict: 'id', count: 'exact' });

    if (error) {
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }
    upserted = count ?? rows.length;
  }

  return new Response(
    JSON.stringify({ ok: true, upserted, bh_proxy_unavailable: false }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
