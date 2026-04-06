import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results = {
      processed: 0,
      verified: 0,
      locked: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const user of users) {
      try {
        // verify-universal-auth
        const { error: authError } = await supabase.functions.invoke(
          "verify-universal-auth",
          {
            body: {
              user_id: user.id,
              email: user.email,
            },
          }
        );

        if (authError) {
          console.error(
            `verify-universal-auth failed for user ${user.id}:`,
            authError
          );
          results.errors.push(`auth:${user.id}`);
        } else {
          results.verified++;
        }

        // receive-lock-request
        const { error: lockError } = await supabase.functions.invoke(
          "receive-lock-request",
          {
            body: {
              user_id: user.id,
              nctr_locked_points: user.nctr_locked_points,
              nctr_earned_total: user.nctr_earned_total,
              nctr_balance_points: user.nctr_balance_points,
            },
          }
        );

        if (lockError) {
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
