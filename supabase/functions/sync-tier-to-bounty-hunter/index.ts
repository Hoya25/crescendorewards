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
    const { auth_user_id, email, new_tier } = await req.json();

    if (!auth_user_id || !email) {
      return json({ synced: false, error: "auth_user_id and email are required" }, 400);
    }

    // --- Look up referral_code and point balances from unified_profiles ---
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    let referralCode: string | null = null;
    let nctrLockedPoints: number | null = null;
    let nctrBalancePoints: number | null = null;

    try {
      const { data: profile } = await supabaseAdmin
        .from("unified_profiles")
        .select("crescendo_data, nctr_locked_points, nctr_balance_points")
        .eq("auth_user_id", auth_user_id)
        .single();

      if (profile) {
        // Read point balances
        nctrLockedPoints = profile.nctr_locked_points ?? null;
        nctrBalancePoints = profile.nctr_balance_points ?? null;

        // Read referral code from crescendo_data
        if (profile.crescendo_data) {
          const cd = typeof profile.crescendo_data === "string"
            ? JSON.parse(profile.crescendo_data)
            : profile.crescendo_data;
          referralCode = cd?.referral_code ?? null;
        }
      }
    } catch (e) {
      console.warn("Could not read from unified_profiles:", e);
    }

    // Also check legacy profiles table for referral_code
    if (!referralCode) {
      try {
        const { data: legacyProfile } = await supabaseAdmin
          .from("profiles")
          .select("referral_code")
          .eq("id", auth_user_id)
          .single();
        referralCode = legacyProfile?.referral_code ?? null;
      } catch (_e) {
        // ignore
      }
    }

    // --- PATCH Bounty Hunter's user_profiles table ---
    const bhServiceKey = Deno.env.get("BOUNTY_HUNTER_SERVICE_KEY");
    if (!bhServiceKey) {
      return json({ synced: false, error: "BOUNTY_HUNTER_SERVICE_KEY not configured" }, 500);
    }

    const patchBody: Record<string, unknown> = {
      crescendo_tier: new_tier ?? null,
    };
    if (referralCode) {
      patchBody.referral_code = referralCode;
    }
    if (nctrLockedPoints !== null) {
      patchBody.nctr_locked_points = nctrLockedPoints;
    }
    if (nctrBalancePoints !== null) {
      patchBody.nctr_balance_points = nctrBalancePoints;
    }

    const bhUrl = `https://auibudfactqhisvmiotw.supabase.co/rest/v1/user_profiles?email=eq.${encodeURIComponent(email)}`;

    const patchRes = await fetch(bhUrl, {
      method: "PATCH",
      headers: {
        apikey: bhServiceKey,
        Authorization: `Bearer ${bhServiceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(patchBody),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      console.error("Bounty Hunter PATCH failed:", patchRes.status, errText);
      return json({ synced: false, error: `BH PATCH ${patchRes.status}: ${errText}` });
    }

    // Consume body
    await patchRes.text();

    console.log(`Synced tier=${new_tier} referral=${referralCode ?? "none"} locked_pts=${nctrLockedPoints ?? 0} balance_pts=${nctrBalancePoints ?? 0} for ${email}`);
    return json({ synced: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("sync-tier-to-bounty-hunter error:", msg);
    return json({ synced: false, error: msg });
  }
});
