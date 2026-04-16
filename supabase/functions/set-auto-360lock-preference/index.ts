import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const BH_ADMIN_API = "https://auibudfactqhisvmiotw.supabase.co/functions/v1/admin-api";

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);
  const json = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // --- Authenticate caller ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ success: false, error: "unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error("Auth failed:", claimsError?.message);
      return json({ success: false, error: "unauthorized" }, 401);
    }

    const authenticatedUserId = claimsData.claims.sub;

    // --- Parse and validate body ---
    const { user_id, enabled } = await req.json();

    if (!user_id || typeof enabled !== "boolean") {
      return json({ success: false, error: "user_id (string) and enabled (boolean) are required" }, 400);
    }

    // Ensure caller can only modify their own preference
    if (user_id !== authenticatedUserId) {
      console.warn(`User ${authenticatedUserId} attempted to modify preference for ${user_id}`);
      return json({ success: false, error: "unauthorized" }, 401);
    }

    // --- Build updates payload ---
    const updates: Record<string, unknown> = enabled
      ? { auto_360lock: true, auto_360lock_enabled_at: new Date().toISOString() }
      : { auto_360lock: false, auto_360lock_enabled_at: null };

    // --- Call BH admin-api (same pattern as bh-status-proxy) ---
    const syncSecret = Deno.env.get("SYNC_SECRET");
    if (!syncSecret) {
      console.error("SYNC_SECRET not configured");
      return json({ success: false, error: "Server configuration error" }, 500);
    }

    console.log(`[Auto360Lock] Setting auto_360lock=${enabled} for user ${user_id} via admin-api`);

    const bhRes = await fetch(BH_ADMIN_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sync-secret": syncSecret,
      },
      body: JSON.stringify({
        action: "update_user_profile",
        user_id,
        updates,
      }),
    });

    const bhText = await bhRes.text();
    if (!bhRes.ok) {
      console.error(`[Auto360Lock] BH admin-api failed: ${bhRes.status} ${bhText}`);
      return json({ success: false, error: `BH admin-api ${bhRes.status}: ${bhText}` }, 500);
    }

    let bhData: unknown = null;
    try {
      bhData = JSON.parse(bhText);
    } catch {
      bhData = bhText;
    }

    console.log(`[Auto360Lock] Success: auto_360lock=${enabled} for user ${user_id}`);
    return json({ success: true, data: bhData });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Auto360Lock] Error:", msg);
    return json({ success: false, error: msg }, 500);
  }
});
