import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

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

    // --- Build BH PATCH payload ---
    const patchBody: Record<string, unknown> = enabled
      ? { auto_360lock: true, auto_360lock_enabled_at: new Date().toISOString() }
      : { auto_360lock: false, auto_360lock_enabled_at: null };

    // --- Send PATCH to Bounty Hunter ---
    const bhServiceKey = Deno.env.get("BOUNTY_HUNTER_SERVICE_KEY");
    if (!bhServiceKey) {
      console.error("BOUNTY_HUNTER_SERVICE_KEY not configured");
      return json({ success: false, error: "Server configuration error" }, 500);
    }

    const bhUrl = `https://auibudfactqhisvmiotw.supabase.co/rest/v1/user_profiles?id=eq.${encodeURIComponent(user_id)}`;

    console.log(`[Auto360Lock] Setting auto_360lock=${enabled} for user ${user_id}`);

    const patchRes = await fetch(bhUrl, {
      method: "PATCH",
      headers: {
        apikey: bhServiceKey,
        Authorization: `Bearer ${bhServiceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(patchBody),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      console.error(`[Auto360Lock] BH PATCH failed: ${patchRes.status} ${errText}`);
      return json({ success: false, error: `BH PATCH ${patchRes.status}: ${errText}` }, 500);
    }

    const bhData = await patchRes.json();
    console.log(`[Auto360Lock] Success: auto_360lock=${enabled} for user ${user_id}`);

    return json({ success: true, data: bhData });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Auto360Lock] Error:", msg);
    return json({ success: false, error: msg }, 500);
  }
});
