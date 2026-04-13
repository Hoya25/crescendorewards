import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const ALLOWED_ORIGINS = [
  "https://bountyhunter.nctr.live",
  "https://crescendo.nctr.live",
  "https://godview.nctr.live",
  "https://beacon.nctr.live",
];

function getCorsOrigin(req: Request): string {
  const origin = req.headers.get("origin") || "";
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  if (origin.endsWith(".nctr.live") && origin.startsWith("https://")) return origin;
  return ALLOWED_ORIGINS[0];
}

function corsHeaders(req: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": getCorsOrigin(req),
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "x-sync-secret, content-type",
    "Vary": "Origin",
  };
}

const TIER_ORDER: Record<string, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
  diamond: 5,
};

const VALID_TIERS = Object.keys(TIER_ORDER);

function mapReward(r: any) {
  return {
    id: r.id,
    title: r.title,
    image_url: r.image_url ?? null,
    tier_required: r.min_tier_required ?? r.reward_tier ?? "bronze",
    claims_cost: r.cost ?? 0,
    remaining: r.stock_quantity ?? null,
    powered_by: r.show_powered_by ? r.powered_by_name : null,
    showcase_order: r.showcase_order ?? null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  // Auth check
  const syncSecret = Deno.env.get("SYNC_SECRET");
  if (!syncSecret || req.headers.get("x-sync-secret") !== syncSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const tier = url.searchParams.get("tier")?.toLowerCase() || null;
  const showcase = url.searchParams.get("showcase") === "true";
  const limitParam = parseInt(url.searchParams.get("limit") || "50", 10);
  const limit = Math.max(1, Math.min(50, isNaN(limitParam) ? 50 : limitParam));

  if (tier && !VALID_TIERS.includes(tier)) {
    return new Response(JSON.stringify({ error: "Invalid tier. Must be: " + VALID_TIERS.join(", ") }), {
      status: 400,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Get total active count
  const { count: totalAvailable } = await supabase
    .from("rewards")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  const headers = { ...corsHeaders(req), "Content-Type": "application/json" };

  if (showcase) {
    // Showcase mode: return all rewards marked for showcase, ordered by showcase_order
    const { data, error: scError } = await supabase
      .from("rewards")
      .select("id, title, image_url, min_tier_required, reward_tier, cost, stock_quantity, show_powered_by, powered_by_name, showcase_order")
      .eq("is_active", true)
      .eq("show_in_showcase", true)
      .order("showcase_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(50);

    if (scError) {
      return new Response(JSON.stringify({ error: "Database error" }), { status: 500, headers });
    }

    const rewards = (data ?? []).map(mapReward);

    return new Response(JSON.stringify({
      mode: "showcase",
      tier: null,
      rewards,
      total_available: totalAvailable ?? 0,
    }), { status: 200, headers });
  }

  // Standard tier mode
  const tierLevel = tier ? TIER_ORDER[tier] : 1;
  const accessibleTiers = VALID_TIERS.filter((t) => TIER_ORDER[t] <= tierLevel);

  const { data, error } = await supabase
    .from("rewards")
    .select("id, title, image_url, min_tier_required, reward_tier, cost, stock_quantity, show_powered_by, powered_by_name, showcase_order")
    .eq("is_active", true)
    .in("min_tier_required", accessibleTiers)
    .order("showcase_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500, headers });
  }

  return new Response(JSON.stringify({
    mode: "tier",
    tier: tier ?? "bronze",
    rewards: (data ?? []).map(mapReward),
    total_available: totalAvailable ?? 0,
  }), { status: 200, headers });
});
