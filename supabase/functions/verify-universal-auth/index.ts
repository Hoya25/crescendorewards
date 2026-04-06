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
    const { email, action, bh_user_id, display_name, avatar_url, referral_code, nctr_balance, redirect_to } = body;

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "email is required" }), { status: 400, headers });
    }

    // Create service-role client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const normalizedEmail = email.toLowerCase().trim();

    // --- Helper: ensure auth user exists ---
    async function ensureAuthUser(emailAddr: string, displayName?: string, bhUserId?: string) {
      const { data: allAuthSearch } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existingAuthUser = allAuthSearch?.users?.find(
        (u: any) => u.email?.toLowerCase() === emailAddr
      );

      if (existingAuthUser) {
        const { error: updateErr } = await supabase.auth.admin.updateUserById(
          existingAuthUser.id,
          { password: "nctr-beta-2026" }
        );
        if (updateErr) console.error("Failed to update auth user password:", updateErr.message);
        else console.log("Updated password for existing auth user:", emailAddr);
        return existingAuthUser;
      } else {
        const { data: newUser, error: createAuthErr } = await supabase.auth.admin.createUser({
          email: emailAddr,
          email_confirm: true,
          password: "nctr-beta-2026",
          user_metadata: {
            display_name: displayName || "User",
            source: "bounty_hunter",
            bh_user_id: bhUserId || undefined,
          },
        });
        if (createAuthErr) {
          console.error("Auto-provision auth user failed:", createAuthErr.message);
          return null;
        }
        console.log("Auto-provisioned auth user for:", emailAddr);
        return newUser?.user || null;
      }
    }

    // --- Magic link action ---
    if (action === "generate_magic_link") {
      await ensureAuthUser(normalizedEmail, display_name, bh_user_id);

      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
        options: {
          redirectTo: redirect_to || "https://crescendo.nctr.live/dashboard",
        },
      });

      if (linkError) {
        return new Response(JSON.stringify({ error: linkError.message }), { status: 500, headers });
      }

      return new Response(
        JSON.stringify({ magic_link: linkData?.properties?.action_link }),
        { status: 200, headers }
      );
    }

    // --- Default action: profile provisioning ---
    if (!bh_user_id || typeof bh_user_id !== "string") {
      return new Response(JSON.stringify({ error: "bh_user_id is required" }), { status: 400, headers });
    }
    if (!display_name || typeof display_name !== "string") {
      return new Response(JSON.stringify({ error: "display_name is required" }), { status: 400, headers });
    }

    await ensureAuthUser(normalizedEmail, display_name, bh_user_id);

    // --- Profile logic (unchanged) ---
    // Check if profile already exists by email
    const { data: existing, error: selectError } = await supabase
      .from("unified_profiles")
      .select("*, status_tiers(tier_name)")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (selectError) {
      return new Response(JSON.stringify({ error: selectError.message }), { status: 500, headers });
    }

    if (existing) {
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

    // Also check by bh_user_id
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
        email: normalizedEmail,
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
