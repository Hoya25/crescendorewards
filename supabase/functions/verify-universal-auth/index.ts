import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    // Only POST allowed
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
    }

    // Verify sync secret
    const syncSecret = Deno.env.get("SYNC_SECRET");
    const providedSecret = req.headers.get("x-sync-secret");
    if (!syncSecret || providedSecret !== syncSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }

    // Parse & validate body
    const body = await req.json();
    const { email, bh_user_id, display_name, avatar_url, referral_code, nctr_balance } = body;

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "email is required" }), { status: 400, headers });
    }
    if (!bh_user_id || typeof bh_user_id !== "string") {
      return new Response(JSON.stringify({ error: "bh_user_id is required" }), { status: 400, headers });
    }
    if (!display_name || typeof display_name !== "string") {
      return new Response(JSON.stringify({ error: "display_name is required" }), { status: 400, headers });
    }

    // Create service-role client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if profile already exists by email
    const { data: existing, error: selectError } = await supabase
      .from("unified_profiles")
      .select("*, status_tiers(tier_name)")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (selectError) {
      return new Response(JSON.stringify({ error: selectError.message }), { status: 500, headers });
    }

    if (existing) {
      // If bh_user_id not yet linked, update it
      if (!existing.bh_user_id && bh_user_id) {
        await supabase
          .from("unified_profiles")
          .update({ bh_user_id })
          .eq("id", existing.id);
        existing.bh_user_id = bh_user_id;
      }
      const tierName = existing.status_tiers?.tier_name || "bronze";
      return new Response(JSON.stringify({ exists: true, profile: { ...existing, crescendo_tier: tierName } }), { status: 200, headers });
    }

    // Also check by bh_user_id in case email differs
    const { data: existingByBh } = await supabase
      .from("unified_profiles")
      .select("*, status_tiers(tier_name)")
      .eq("bh_user_id", bh_user_id)
      .maybeSingle();

    if (existingByBh) {
      const tierName = existingByBh.status_tiers?.tier_name || "bronze";
      return new Response(JSON.stringify({ exists: true, profile: { ...existingByBh, crescendo_tier: tierName } }), { status: 200, headers });
    }

    // Look up Bronze tier
    const { data: bronzeTier } = await supabase
      .from("status_tiers")
      .select("id")
      .ilike("tier_name", "bronze")
      .single();

    // Create new profile
    const { data: newProfile, error: insertError } = await supabase
      .from("unified_profiles")
      .insert({
        email: email.toLowerCase().trim(),
        display_name,
        avatar_url: avatar_url || null,
        bh_user_id,
        current_tier_id: bronzeTier?.id || null,
        nctr_balance_points: typeof nctr_balance === "number" ? nctr_balance : 0,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ exists: false, profile: { ...newProfile, crescendo_tier: "bronze" } }), { status: 201, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers });
  }
});
