import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const BH_URL = "https://auibudfactqhisvmiotw.supabase.co";
const CRESCENDO_FUNCTIONS_URL = Deno.env.get("SUPABASE_URL") + "/functions/v1";

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers });

  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    // Auth: require SYNC_SECRET
    const syncSecret = Deno.env.get("SYNC_SECRET");
    const provided = req.headers.get("x-sync-secret");
    if (!syncSecret || provided !== syncSecret) {
      return json({ error: "Unauthorized" }, 401);
    }

    // Optional: limit batch size via request body
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 1000;
    const offset = body.offset || 0;

    // Connect to BH with service key to read user_profiles
    const bhServiceKey = Deno.env.get("BOUNTY_HUNTER_SERVICE_KEY");
    if (!bhServiceKey) return json({ error: "BOUNTY_HUNTER_SERVICE_KEY not set" }, 500);

    const bhClient = createClient(BH_URL, bhServiceKey);

    // Fetch BH user_profiles
    const { data: bhUsers, error: bhError } = await bhClient
      .from("user_profiles")
      .select("id, email, display_name, avatar_url, nctr_locked_points, nctr_earned_total, nctr_balance_points")
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (bhError) {
      console.error("Failed to fetch BH user_profiles:", bhError.message);
      return json({ error: "Failed to read BH profiles: " + bhError.message }, 500);
    }

    if (!bhUsers || bhUsers.length === 0) {
      return json({ message: "No users found in range", synced: 0, offset, limit });
    }

    console.log(`Found ${bhUsers.length} BH users (offset=${offset}, limit=${limit})`);

    const results: Array<{ email: string; step1: string; step2: string }> = [];

    for (const user of bhUsers) {
      const email = (user.email || "").trim().toLowerCase();
      if (!email) {
        results.push({ email: "(empty)", step1: "skipped", step2: "skipped" });
        continue;
      }

      const entry: { email: string; step1: string; step2: string } = {
        email,
        step1: "pending",
        step2: "pending",
      };

      // Step 1: verify-universal-auth (ensure Crescendo profile exists)
      try {
        const res1 = await fetch(`${CRESCENDO_FUNCTIONS_URL}/verify-universal-auth`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-sync-secret": syncSecret,
          },
          body: JSON.stringify({
            email,
            bh_user_id: user.id,
            display_name: user.display_name || "User",
            avatar_url: user.avatar_url || null,
          }),
        });
        const r1 = await res1.json();
        entry.step1 = res1.ok ? (r1.exists ? "exists" : "created") : `error: ${r1.error}`;
      } catch (e) {
        entry.step1 = `error: ${e instanceof Error ? e.message : String(e)}`;
      }

      // Step 2: receive-lock-request (sync points)
      try {
        const lockedPoints = Number(user.nctr_locked_points) || 0;
        const balancePoints = Number(user.nctr_balance_points) || 0;
        const earnedTotal = Number(user.nctr_earned_total) || 0;

        const res2 = await fetch(`${CRESCENDO_FUNCTIONS_URL}/receive-lock-request`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-sync-secret": syncSecret,
          },
          body: JSON.stringify({
            email,
            nctr_amount: lockedPoints,
            nctr_locked_points: lockedPoints,
            nctr_balance_points: balancePoints + earnedTotal,
          }),
        });
        const r2 = await res2.json();
        entry.step2 = r2.received ? `ok, tier=${r2.tier_assigned}` : `error: ${r2.error}`;
      } catch (e) {
        entry.step2 = `error: ${e instanceof Error ? e.message : String(e)}`;
      }

      results.push(entry);
      console.log(`[${results.length}/${bhUsers.length}] ${email}: auth=${entry.step1}, sync=${entry.step2}`);
    }

    const succeeded = results.filter(r => !r.step1.startsWith("error") && !r.step2.startsWith("error")).length;
    const failed = results.length - succeeded;

    console.log(`Bulk sync complete: ${succeeded} succeeded, ${failed} failed out of ${results.length}`);

    return json({
      total: results.length,
      succeeded,
      failed,
      offset,
      limit,
      results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("bulk-sync-from-bh error:", msg);
    return json({ error: msg }, 500);
  }
});
