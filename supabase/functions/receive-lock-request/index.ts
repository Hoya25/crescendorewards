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
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    // Verify SYNC_SECRET header
    const syncSecret = req.headers.get("x-sync-secret");
    const expectedSecret = Deno.env.get("SYNC_SECRET");

    if (!expectedSecret || syncSecret !== expectedSecret) {
      console.error("Invalid or missing x-sync-secret header");
      return json({ error: "Unauthorized" }, 401);
    }

    const {
      email,
      nctr_amount,
      target_tier,
      status,
      nctr_locked_points,
      nctr_balance_points,
    } = await req.json();

    if (!email || nctr_amount == null) {
      return json({ error: "email and nctr_amount are required" }, 400);
    }

    // Admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find unified profile by email
    const { data: profile, error: findError } = await supabaseAdmin
      .from("unified_profiles")
      .select("id, crescendo_data")
      .eq("email", email)
      .single();

    if (findError || !profile) {
      console.error("Profile not found for email:", email, findError);
      return json({ received: false, error: "Profile not found for email" });
    }

    // Merge pending_lock into existing crescendo_data
    const existingData =
      typeof profile.crescendo_data === "string"
        ? JSON.parse(profile.crescendo_data)
        : profile.crescendo_data ?? {};

    const updatedData = {
      ...existingData,
      pending_lock: {
        nctr_amount,
        target_tier: target_tier ?? null,
        requested_at: new Date().toISOString(),
        status: status ?? "pending",
      },
    };

    // Build targeted update payload
    const updatePayload: Record<string, unknown> = {
      crescendo_data: updatedData,
      updated_at: new Date().toISOString(),
    };

    if (nctr_locked_points !== undefined) {
      updatePayload.nctr_locked_points = nctr_locked_points;
    }
    if (nctr_balance_points !== undefined) {
      updatePayload.nctr_balance_points = nctr_balance_points;
    }

    const { error: updateError } = await supabaseAdmin
      .from("unified_profiles")
      .update(updatePayload)
      .eq("id", profile.id);

    if (updateError) {
      console.error("Failed to update unified_profiles:", updateError);
      // Log failed sync attempt
      await supabaseAdmin.from("cross_platform_activity_log").insert({
        user_id: profile.id,
        platform: "bounty_hunter",
        action_type: "bh_lock_sync_failed",
        action_data: { nctr_locked_points, nctr_balance_points, nctr_amount, error: updateError.message },
      });
      return json({ received: false, error: updateError.message });
    }

    // --- CHANGE 1: Recalculate tier from locked points ---
    const effectiveLockedPoints = nctr_locked_points ?? 0;
    let assignedTierName = "none";

    if (effectiveLockedPoints >= 1000) {
      const { data: matchedTier } = await supabaseAdmin
        .from("status_tiers")
        .select("id, tier_name")
        .lte("min_nctr_360_locked", effectiveLockedPoints)
        .order("min_nctr_360_locked", { ascending: false })
        .limit(1)
        .single();

      if (matchedTier) {
        await supabaseAdmin
          .from("unified_profiles")
          .update({ current_tier_id: matchedTier.id })
          .eq("id", profile.id);
        assignedTierName = matchedTier.tier_name;
      }
    } else {
      // Below Bronze threshold — clear tier
      await supabaseAdmin
        .from("unified_profiles")
        .update({ current_tier_id: null })
        .eq("id", profile.id);
    }

    // --- CHANGE 2: Log successful sync ---
    await supabaseAdmin.from("cross_platform_activity_log").insert({
      user_id: profile.id,
      platform: "bounty_hunter",
      action_type: "bh_lock_sync",
      action_data: {
        nctr_locked_points,
        nctr_balance_points,
        nctr_amount,
        target_tier,
        tier_assigned: assignedTierName,
        synced_at: new Date().toISOString(),
      },
    });

    console.log(
      `Lock request received: ${nctr_amount} NCTR for ${email}, tier_assigned=${assignedTierName}, locked_pts=${nctr_locked_points ?? "n/a"}, balance_pts=${nctr_balance_points ?? "n/a"}`
    );

    return json({ received: true, tier_assigned: assignedTierName });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("receive-lock-request error:", msg);
    return json({ received: false, error: msg });
  }
});
