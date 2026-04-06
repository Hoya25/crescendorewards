const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// BH's secured export endpoint — data never leaves BH's own edge functions
const BH_EXPORT_URL =
  "https://auibudfactqhisvmiotw.supabase.co/functions/v1/user-profiles-export";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const syncSecret = Deno.env.get("SYNC_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!syncSecret) {
      console.error("bulk-sync-from-bh: SYNC_SECRET is not set");
      return new Response(
        JSON.stringify({ success: false, error: "Sync secret not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!supabaseUrl) {
      console.error("bulk-sync-from-bh: SUPABASE_URL is not set");
      return new Response(
        JSON.stringify({ success: false, error: "Project URL not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Step 1: Fetch user profiles from BH via proxy endpoint ──────────────
    let users: Array<{
      id: string;
      email: string;
      display_name: string | null;
      avatar_url: string | null;
      nctr_locked_points: number;
      nctr_earned_total: number;
      nctr_balance_points: number;
    }> = [];

    try {
      const bhResponse = await fetch(BH_EXPORT_URL, {
        method: "GET",
        headers: {
          "x-sync-secret": syncSecret,
          "Content-Type": "application/json",
        },
      });

      if (!bhResponse.ok) {
        const errText = await bhResponse.text();
        console.error(
          `bulk-sync-from-bh: BH export returned ${bhResponse.status}:`,
          errText
        );
        return new Response(
          JSON.stringify({
            success: false,
            error: `BH export failed with status ${bhResponse.status}`,
          }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const payload = await bhResponse.json();
      users = payload.users ?? [];
    } catch (fetchErr) {
      console.error("bulk-sync-from-bh: fetch to BH export failed:", fetchErr);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Could not reach BH export endpoint",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (users.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          message: "BH returned zero users — nothing to sync",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 2: Process each user against Crescendo functions ───────────────
    const results = {
      processed: 0,
      verified: 0,
      locked: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const user of users) {
      try {
        const res1 = await fetch(
          `${supabaseUrl}/functions/v1/verify-universal-auth`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-sync-secret": syncSecret,
            },
            body: JSON.stringify({
              email: user.email,
              bh_user_id: user.id,
              display_name: user.display_name || "User",
            }),
          }
        );

        if (!res1.ok) {
          const authError = await res1.text();
          console.error(
            `verify-universal-auth failed for user ${user.id}:`,
            authError
          );
          results.errors.push(`auth:${user.id}`);
        } else {
          results.verified++;
        }

        const res2 = await fetch(
          `${supabaseUrl}/functions/v1/receive-lock-request`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-sync-secret": syncSecret,
            },
            body: JSON.stringify({
              email: user.email,
              nctr_amount: user.nctr_locked_points,
              nctr_locked_points: user.nctr_locked_points,
              nctr_earned_total: user.nctr_earned_total,
            }),
          }
        );

        if (!res2.ok) {
          const lockError = await res2.text();
          console.error(
            `receive-lock-request failed for user ${user.id}:`,
            lockError
          );
          results.errors.push(`lock:${user.id}`);
        } else {
          results.locked++;
        }

        results.processed++;
      } catch (userErr) {
        console.error(`bulk-sync-from-bh: error on user ${user.id}:`, userErr);
        results.errors.push(`processing:${user.id}`);
        results.skipped++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_bh_users: users.length,
        processed: results.processed,
        verified: results.verified,
        locked: results.locked,
        skipped: results.skipped,
        error_count: results.errors.length,
        errors: results.errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("bulk-sync-from-bh unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});