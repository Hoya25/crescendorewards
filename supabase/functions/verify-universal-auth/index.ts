import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const BH_ADMIN_API = "https://auibudfactqhisvmiotw.supabase.co/functions/v1/admin-api";
const DEFAULT_PASSWORD = "nctr-beta-2026";

Deno.serve(async (req: Request) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
    }

    const body = await req.json();
    const { email, action, bh_user_id, display_name, avatar_url, referral_code, nctr_balance, redirect_to, token } = body;

    // Create service-role client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const bhServiceKey = Deno.env.get("BOUNTY_HUNTER_SERVICE_KEY") || Deno.env.get("SYNC_SECRET") || "";

    // --- Helper: call BH admin-api ---
    async function callBH(bhAction: string, payload: Record<string, unknown>) {
      const res = await fetch(BH_ADMIN_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sync-secret": bhServiceKey,
        },
        body: JSON.stringify({ action: bhAction, ...payload }),
      });
      if (!res.ok) return null;
      return await res.json();
    }

    // --- Helper: ensure auth user exists ---
    async function ensureAuthUser(emailAddr: string, displayName?: string, bhUserId?: string) {
      const { data: allAuthSearch } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existingAuthUser = allAuthSearch?.users?.find(
        (u: any) => u.email?.toLowerCase() === emailAddr
      );

      if (existingAuthUser) {
        const { error: updateErr } = await supabase.auth.admin.updateUserById(
          existingAuthUser.id,
          { password: DEFAULT_PASSWORD }
        );
        if (updateErr) console.error("Failed to update auth user password:", updateErr.message);
        return existingAuthUser;
      } else {
        const { data: newUser, error: createAuthErr } = await supabase.auth.admin.createUser({
          email: emailAddr,
          email_confirm: true,
          password: DEFAULT_PASSWORD,
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

    // --- Helper: ensure unified_profiles row ---
    async function ensureProfile(emailAddr: string, bhData: any) {
      const { data: existing } = await supabase
        .from("unified_profiles")
        .select("*, status_tiers(tier_name)")
        .eq("email", emailAddr)
        .maybeSingle();

      if (existing) {
        // Update bh_user_id if missing
        if (!existing.bh_user_id && bhData.bh_user_id) {
          await supabase
            .from("unified_profiles")
            .update({ bh_user_id: bhData.bh_user_id })
            .eq("id", existing.id);
        }
        return existing;
      }

      // Look up Bronze tier for new profiles
      const { data: bronzeTier } = await supabase
        .from("status_tiers")
        .select("id")
        .ilike("tier_name", "bronze")
        .single();

      const { data: newProfile } = await supabase
        .from("unified_profiles")
        .insert({
          email: emailAddr,
          display_name: bhData.display_name || "User",
          avatar_url: bhData.avatar_url || null,
          bh_user_id: bhData.bh_user_id || null,
          current_tier_id: bronzeTier?.id || null,
          nctr_balance_points: typeof bhData.nctr_balance === "number" ? bhData.nctr_balance : 0,
          nctr_locked_points: typeof bhData.nctr_locked_points === "number" ? bhData.nctr_locked_points : 0,
          created_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      return newProfile;
    }

    // ============================================================
    // ACTION: token_login (seamless BH → Crescendo via token)
    // ============================================================
    if (action === "token_login") {
      if (!token || !email) {
        return new Response(JSON.stringify({ success: false, error: "token and email required" }), { status: 400, headers });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Validate token with BH
      const bhResult = await callBH("verify_crescendo_token", { token, email: normalizedEmail });

      if (!bhResult || !bhResult.valid) {
        console.warn("BH token validation failed for:", normalizedEmail);
        return new Response(JSON.stringify({ success: false, error: "Invalid or expired token" }), { status: 200, headers });
      }

      // Token valid — provision user
      await ensureAuthUser(normalizedEmail, bhResult.display_name, bhResult.bh_user_id);
      await ensureProfile(normalizedEmail, {
        bh_user_id: bhResult.bh_user_id,
        display_name: bhResult.display_name,
        nctr_balance: bhResult.nctr_balance,
        nctr_locked_points: bhResult.nctr_locked_points,
      });

      return new Response(JSON.stringify({
        success: true,
        email: normalizedEmail,
        display_name: bhResult.display_name,
      }), { status: 200, headers });
    }

    // ============================================================
    // ACTION: check_bh_account (manual login — verify email with BH)
    // ============================================================
    if (action === "check_bh_account") {
      if (!email) {
        return new Response(JSON.stringify({ success: false, error: "email is required" }), { status: 400, headers });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Ask BH if this user exists
      const bhResult = await callBH("get_user_status", { email: normalizedEmail });

      if (!bhResult || bhResult.error) {
        console.log("BH lookup failed for:", normalizedEmail, bhResult?.error);
        return new Response(JSON.stringify({
          success: false,
          error: "No NCTR account found with this email. Join the Alliance on Bounty Hunter first!",
        }), { status: 200, headers });
      }

      // BH user found — provision auth + profile
      await ensureAuthUser(normalizedEmail, bhResult.display_name, bhResult.user_id || bhResult.bh_user_id);
      await ensureProfile(normalizedEmail, {
        bh_user_id: bhResult.user_id || bhResult.bh_user_id,
        display_name: bhResult.display_name,
        nctr_balance: bhResult.nctr_balance,
        nctr_locked_points: bhResult.nctr_locked_points,
        avatar_url: bhResult.avatar_url,
      });

      return new Response(JSON.stringify({
        success: true,
        email: normalizedEmail,
        display_name: bhResult.display_name,
      }), { status: 200, headers });
    }

    // ============================================================
    // ACTION: generate_magic_link (existing flow)
    // ============================================================
    if (action === "generate_magic_link") {
      // Verify sync secret for server-to-server calls
      const syncSecret = Deno.env.get("SYNC_SECRET");
      const providedSecret = req.headers.get("x-sync-secret");
      if (!syncSecret || providedSecret !== syncSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
      }

      const normalizedEmail = (email || "").toLowerCase().trim();
      if (!normalizedEmail) {
        return new Response(JSON.stringify({ error: "email is required" }), { status: 400, headers });
      }

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

    // ============================================================
    // DEFAULT: Profile provisioning (server-to-server, requires SYNC_SECRET)
    // ============================================================
    const syncSecret = Deno.env.get("SYNC_SECRET");
    const providedSecret = req.headers.get("x-sync-secret");
    if (!syncSecret || providedSecret !== syncSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "email is required" }), { status: 400, headers });
    }
    if (!bh_user_id || typeof bh_user_id !== "string") {
      return new Response(JSON.stringify({ error: "bh_user_id is required" }), { status: 400, headers });
    }
    if (!display_name || typeof display_name !== "string") {
      return new Response(JSON.stringify({ error: "display_name is required" }), { status: 400, headers });
    }

    const normalizedEmail = email.toLowerCase().trim();

    await ensureAuthUser(normalizedEmail, display_name, bh_user_id);

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
