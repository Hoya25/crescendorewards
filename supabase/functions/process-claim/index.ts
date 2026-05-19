import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SYNC_SECRET = Deno.env.get("SYNC_SECRET")!;
const BH_ADMIN_API_URL = "https://auibudfactqhisvmiotw.supabase.co/functions/v1/admin-api";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TIER_ORDER: Record<string, number> = {
  bronze: 1, silver: 2, gold: 3, platinum: 4, diamond: 5,
};

serve(async (req) => {
  const cors = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  const jhdr = { ...cors, "Content-Type": "application/json" };
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: jhdr });

  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  // ── STEP 1: Authenticate ──
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json(401, { error: "unauthenticated" });

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claims?.claims?.sub) return json(401, { error: "unauthenticated" });
  const userId = claims.claims.sub as string;

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ── STEP 2: Parse body ──
  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: "invalid_request", detail: "body must be JSON" }); }
  const reward_id = body?.reward_id;
  const shipping_info = body?.shipping_info ?? null;
  if (!reward_id || typeof reward_id !== "string" || !UUID_RE.test(reward_id)) {
    return json(400, { error: "invalid_request", detail: "reward_id required" });
  }

  console.log("[process-claim] starting", { reward_id, user_id: userId });

  // ── STEP 3: Read reward ──
  const { data: reward, error: rErr } = await admin.from("rewards").select("*").eq("id", reward_id).maybeSingle();
  if (rErr) return json(500, { error: "reward_read_failed", detail: rErr.message });
  if (!reward) return json(404, { error: "reward_not_found" });
  if (reward.is_active !== true) return json(409, { error: "reward_not_available" });
  if (reward.stock_quantity !== null && !(reward.stock_quantity > 0)) {
    return json(409, { error: "reward_sold_out" });
  }

  const claims_required: number = reward.claims_required ?? reward.cost ?? 0;
  console.log("[process-claim] reward read", { reward_origin: reward.reward_origin, claims_required });

  // ── STEP 4: Affordability ──
  const { data: profile, error: pErr } = await admin
    .from("profiles").select("claim_balance").eq("id", userId).maybeSingle();
  if (pErr) return json(500, { error: "profile_read_failed", detail: pErr.message });
  const claim_balance = profile?.claim_balance ?? 0;
  if (claim_balance < claims_required) {
    return json(402, { error: "insufficient_claims", required: claims_required, available: claim_balance });
  }

  // ── STEP 5: Tier gate ──
  if (reward.required_status_tier) {
    const requiredTierName = String(reward.required_status_tier).toLowerCase();
    const requiredRank = TIER_ORDER[requiredTierName] ?? 0;

    const { data: up } = await admin
      .from("unified_profiles")
      .select("current_tier_id, status_tiers!unified_profiles_current_tier_id_fkey(tier_name)")
      .eq("auth_user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const memberTierName: string | null =
      (up as any)?.status_tiers?.tier_name?.toLowerCase() ?? null;
    const memberRank = memberTierName ? (TIER_ORDER[memberTierName] ?? 0) : 0;

    if (!memberTierName || memberRank < requiredRank) {
      return json(403, {
        error: "tier_requirement_not_met",
        required_tier: reward.required_status_tier,
        member_tier: memberTierName,
      });
    }
  }

  // ── STEP 6: Branch ──
  const claim_id = crypto.randomUUID();
  const origin = reward.reward_origin;
  let nctr_owed: number | null = null;
  let nctr_rate_at_claim: number | null = null;
  let contributor_user_id: string | null = null;
  let bh_credit_response: any = null;

  if (origin === "contributor") {
    contributor_user_id = reward.contributor_user_id;
    if (!contributor_user_id) {
      return json(503, { error: "contributor_unresolved", detail: "reward missing contributor_user_id" });
    }

    // (i) Resolve identity
    const { data: cu } = await admin
      .from("unified_profiles")
      .select("email, bh_user_id")
      .eq("auth_user_id", contributor_user_id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!cu || (!cu.email && !cu.bh_user_id)) {
      return json(503, { error: "contributor_unresolved", detail: "Contributor identity could not be resolved" });
    }

    // (ii) Oracle
    const priceRes = await fetch(`${SUPABASE_URL}/functions/v1/get-nctr-price`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
      body: "{}",
    });
    if (!priceRes.ok) {
      const t = await priceRes.text();
      return json(503, { error: "oracle_unavailable", detail: `status ${priceRes.status}: ${t}` });
    }
    const priceBody = await priceRes.json();
    const nctr_usd = Number(priceBody?.nctr_usd);
    if (!(nctr_usd > 0 && nctr_usd < 10000)) {
      return json(503, { error: "oracle_unavailable", detail: "Price out of bounds" });
    }
    console.log("[process-claim] price fetched", { nctr_usd });

    // (iii) Compute
    const usd = Number(reward.floor_usd_amount);
    const mult = Number(reward.multiplier_at_submission);
    const owed = Math.floor((usd * mult) / nctr_usd);
    if (!(owed > 0)) return json(500, { error: "computed_payout_invalid" });
    nctr_owed = owed;
    nctr_rate_at_claim = nctr_usd;

    // (v) Lock mapping
    let lock_type: string;
    if (reward.lock_option === "90lock") lock_type = "90LOCK";
    else if (reward.lock_option === "360lock") lock_type = "360LOCK";
    else return json(500, { error: "invalid_lock_option" });

    // (vi) BH credit
    console.log("[process-claim] BH credit called", { bh_user_id: cu.bh_user_id, nctr_owed });
    let bhRes: Response;
    try {
      bhRes = await fetch(BH_ADMIN_API_URL, {
        method: "POST",
        headers: { "x-sync-secret": SYNC_SECRET, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "credit_member",
          user_id: cu.bh_user_id,
          email: cu.email,
          nctr_amount: nctr_owed,
          lock_type,
          source: "crescendo_contributor_settlement",
          merchant_id: `contributor_settlement_${claim_id}`,
          rate_used: nctr_usd,
          note: reward.title,
        }),
      });
    } catch (e: any) {
      console.error("[process-claim] BH credit fetch failed", e);
      return json(503, { error: "contributor_credit_failed", detail: e?.message ?? "fetch failed" });
    }
    const bhText = await bhRes.text();
    let bhBody: any = null;
    try { bhBody = JSON.parse(bhText); } catch { bhBody = { raw: bhText }; }
    console.log("[process-claim] BH credit response", { status: bhRes.status, body: bhBody });
    if (!bhRes.ok || bhBody?.success === false || bhBody?.error) {
      return json(503, { error: "contributor_credit_failed", detail: bhBody?.error ?? bhBody?.detail ?? bhText });
    }
    bh_credit_response = bhBody;
  } else if (origin === "sponsor" || origin === "admin_manual") {
    // no BH, no oracle
  } else {
    return json(500, { error: "unknown_reward_origin", detail: String(origin) });
  }

  // ── STEP 7: Local writes ──
  const errCode = origin === "contributor" ? "claim_settlement_recovery_required" : "claim_recording_failed";
  const logCritical = (where: string, error: unknown) => {
    if (origin === "contributor") {
      console.error("[process-claim] CRITICAL: BH credit succeeded but local DB write failed", {
        where, claim_id, contributor_user_id, nctr_owed, member_id: userId, error,
      });
    } else {
      console.error("[process-claim] local write failed", { where, claim_id, error });
    }
  };

  // (a) insert claim
  const { error: insErr } = await admin.from("rewards_claims").insert({
    id: claim_id,
    user_id: userId,
    reward_id: reward.id,
    claimed_at: new Date().toISOString(),
    status: "claimed",
    shipping_info,
    delivery_method: reward.delivery_method,
    contributor_user_id,
    nctr_credited_to_contributor: nctr_owed,
    nctr_rate_at_claim,
    contributor_settlement_at: origin === "contributor" ? new Date().toISOString() : null,
    bh_credit_response,
  });
  if (insErr) { logCritical("insert_claim", insErr); return json(503, { error: errCode, detail: insErr.message }); }

  // (b) debit balance
  const { error: debErr } = await admin
    .from("profiles")
    .update({ claim_balance: claim_balance - claims_required })
    .eq("id", userId);
  if (debErr) { logCritical("debit_balance", debErr); return json(503, { error: errCode, detail: debErr.message }); }

  // (c) decrement stock
  if (reward.stock_quantity !== null) {
    const { error: stockErr } = await admin
      .from("rewards")
      .update({ stock_quantity: reward.stock_quantity - 1 })
      .eq("id", reward.id)
      .gt("stock_quantity", 0);
    if (stockErr) { logCritical("decrement_stock", stockErr); return json(503, { error: errCode, detail: stockErr.message }); }
  }

  console.log("[process-claim] local writes complete", { claim_id });

  // ── STEP 8: Success ──
  return json(200, {
    success: true,
    claim_id,
    reward_origin: origin,
    claims_debited: claims_required,
    nctr_credited_to_contributor: nctr_owed,
    nctr_rate_at_claim,
  });
});
