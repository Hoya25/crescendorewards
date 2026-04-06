import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const TIER_THRESHOLDS = [
  { name: "Diamond", min: 100000, multiplier: 2.5 },
  { name: "Platinum", min: 40000, multiplier: 1.8 },
  { name: "Gold", min: 15000, multiplier: 1.5 },
  { name: "Silver", min: 5000, multiplier: 1.25 },
  { name: "Bronze", min: 1000, multiplier: 1.0 },
] as const;

function getTier(locked: number): { name: string | null; multiplier: number } {
  for (const t of TIER_THRESHOLDS) {
    if (locked >= t.min) return { name: t.name, multiplier: t.multiplier };
  }
  return { name: null, multiplier: 1.0 };
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };
  const json = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), { status, headers });

  try {
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const syncSecret = req.headers.get("x-sync-secret");
    const expectedSecret = Deno.env.get("SYNC_SECRET");
    if (!expectedSecret || syncSecret !== expectedSecret) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    if (!email) {
      return json({ error: "email is required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch profile
    const { data: profile, error: profileErr } = await supabase
      .from("unified_profiles")
      .select("id, email, handle, display_name, avatar_url, nctr_locked_points, nctr_balance_points, created_at, updated_at")
      .eq("email", email)
      .maybeSingle();

    if (profileErr) {
      console.error("Profile query error:", profileErr);
      return json({ error: "Database error" }, 500);
    }

    if (!profile) {
      return json({ error: "User not found" }, 404);
    }

    const lockedPoints = Number(profile.nctr_locked_points) || 0;
    const balancePoints = Number(profile.nctr_balance_points) || 0;
    const { name: currentTier, multiplier: tierMultiplier } = getTier(lockedPoints);

    // Fetch bounty count and total earned in parallel
    const [bountyResult, earningsResult] = await Promise.all([
      supabase
        .from("bounty_claims")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("status", "completed"),
      supabase
        .from("nctr_transactions")
        .select("final_amount")
        .eq("user_id", profile.id),
    ]);

    const bountyCount = bountyResult.count ?? 0;
    const nctrEarnedTotal = (earningsResult.data || [])
      .reduce((sum: number, row: { final_amount: number }) => sum + (Number(row.final_amount) || 0), 0);

    return json({
      email: profile.email,
      handle: profile.handle ?? null,
      display_name: profile.display_name ?? null,
      avatar_url: profile.avatar_url ?? null,
      nctr_locked_points: lockedPoints,
      nctr_balance_points: balancePoints,
      nctr_earned_total: nctrEarnedTotal,
      current_tier: currentTier,
      tier_multiplier: tierMultiplier,
      ambassador: false,
      bounty_count: bountyCount,
      member_since: profile.created_at,
      last_active: profile.updated_at,
    });
  } catch (err) {
    console.error("user-status-export error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
