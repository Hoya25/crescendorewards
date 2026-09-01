// Outbound: push a Crescendo "Want This" (member_ambitions) row to Bounty Hunter
// as a wish. Caller must be an authenticated member (own wish) or an admin
// running the one-time backfill. Outbound leg authenticates with SYNC_SECRET.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { adminClient, getAuthUserId, requireAdmin } from "../_shared/auth.ts";

const BH_SYNC_URL =
  "https://auibudfactqhisvmiotw.supabase.co/functions/v1/receive-crescendo-sync";

type PushResult = "created" | "exists" | "unmatched" | "error";

interface WishRow {
  user_id: string;
  reward_id: string;
  reward_name: string | null;
  reward_tier_required: string | null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function pushWish(
  admin: ReturnType<typeof adminClient>,
  syncSecret: string,
  row: WishRow,
): Promise<{ result: PushResult; detail?: string }> {
  // Identity key BH expects: the member's email (+ auth_user_id for context).
  const { data: profile } = await admin
    .from("unified_profiles")
    .select("email, display_name")
    .eq("auth_user_id", row.user_id)
    .limit(1)
    .maybeSingle();

  const email = profile?.email ?? null;
  if (!email) return { result: "unmatched", detail: "no profile email" };

  // Enrich from the reward when the id is a real reward uuid.
  let rewardName = row.reward_name ?? null;
  let rewardTier = row.reward_tier_required ?? null;
  let category = "product";

  if (UUID_RE.test(row.reward_id)) {
    const { data: reward } = await admin
      .from("rewards")
      .select("title, category, min_tier_required")
      .eq("id", row.reward_id)
      .maybeSingle();
    if (reward) {
      rewardName = reward.title ?? rewardName;
      rewardTier = reward.min_tier_required ?? rewardTier;
      if (reward.category) category = String(reward.category);
    }
  }

  const res = await fetch(BH_SYNC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sync-secret": syncSecret,
    },
    body: JSON.stringify({
      type: "wish_create",
      email,
      auth_user_id: row.user_id,
      reward_id: row.reward_id,
      reward_name: rewardName,
      reward_tier: rewardTier,
      category,
      source_ref: `crescendo:${row.reward_id}`,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    if (res.status === 404) return { result: "unmatched", detail: text.slice(0, 200) };
    return { result: "error", detail: `BH ${res.status}: ${text.slice(0, 200)}` };
  }

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(text);
  } catch { /* non-JSON success */ }

  const status = String(parsed.status ?? parsed.result ?? "").toLowerCase();
  if (status === "exists" || parsed.duplicate === true || parsed.created === false) {
    return { result: "exists" };
  }
  if (status === "unmatched" || parsed.matched === false) {
    return { result: "unmatched", detail: text.slice(0, 200) };
  }
  return { result: "created" };
}

serve(async (req) => {
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  const corsHeaders = getCorsHeaders(req);
  const json = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const syncSecret = Deno.env.get("SYNC_SECRET");
  if (!syncSecret) return json({ error: "SYNC_SECRET not configured" }, 500);

  const admin = adminClient();

  try {
    const body = await req.json().catch(() => ({}));

    // ---- One-time admin backfill ----
    if (body.mode === "backfill") {
      const adminId = await requireAdmin(req);
      if (!adminId) return json({ error: "Forbidden" }, 403);

      const { data: rows, error } = await admin
        .from("member_ambitions")
        .select("user_id, reward_id, reward_name, reward_tier_required")
        .is("removed_at", null);

      if (error) return json({ error: error.message }, 500);

      const counts = { created: 0, exists: 0, unmatched: 0, error: 0 };
      const details: Array<Record<string, unknown>> = [];

      for (const row of rows ?? []) {
        const { result, detail } = await pushWish(admin, syncSecret, row as WishRow);
        counts[result] += 1;
        if (detail) details.push({ reward_id: row.reward_id, result, detail });
      }

      return json({ mode: "backfill", total: rows?.length ?? 0, counts, details });
    }

    // ---- Single member push (own wish only) ----
    const authUserId = await getAuthUserId(req);
    if (!authUserId) return json({ error: "Unauthorized" }, 401);

    const rewardId = typeof body.reward_id === "string" ? body.reward_id.trim() : "";
    if (!rewardId) return json({ error: "reward_id is required" }, 400);

    const { result, detail } = await pushWish(admin, syncSecret, {
      user_id: authUserId,
      reward_id: rewardId,
      reward_name: typeof body.reward_name === "string" ? body.reward_name : null,
      reward_tier_required:
        typeof body.reward_tier === "string" ? body.reward_tier : null,
    });

    return json({ result, detail });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("push-wish-to-bh error:", msg);
    return json({ error: msg }, 500);
  }
});
