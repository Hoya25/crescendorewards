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

    const { email, nctr_amount, target_tier, status } = await req.json();

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

    const { error: updateError } = await supabaseAdmin
      .from("unified_profiles")
      .update({
        crescendo_data: updatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("Failed to update crescendo_data:", updateError);
      return json({ received: false, error: updateError.message });
    }

    console.log(
      `Lock request received: ${nctr_amount} NCTR for ${email}, tier=${target_tier ?? "none"}`
    );

    return json({ received: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("receive-lock-request error:", msg);
    return json({ received: false, error: msg });
  }
});
