import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const adminUserId = claimsData.claims.sub;

    // Check admin role
    const { data: adminCheck } = await supabaseAdmin
      .from("admin_users")
      .select("id")
      .eq("is_active", true)
      .limit(1);

    // Verify via unified_profiles
    const { data: upRecord } = await supabaseAdmin
      .from("unified_profiles")
      .select("id")
      .eq("auth_user_id", adminUserId)
      .single();

    if (!upRecord) {
      return new Response(JSON.stringify({ error: "Admin not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: adminRecord } = await supabaseAdmin
      .from("admin_users")
      .select("id")
      .eq("user_id", upRecord.id)
      .eq("is_active", true)
      .single();

    if (!adminRecord) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all active tiers with claims_per_month > 0
    const { data: tiers, error: tiersError } = await supabaseAdmin
      .from("status_tiers")
      .select("id, tier_name, display_name, claims_per_month")
      .eq("is_active", true)
      .gt("claims_per_month", 0);

    if (tiersError) throw tiersError;
    if (!tiers || tiers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No tiers with claims allocation", distributed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalDistributed = 0;
    let usersProcessed = 0;
    const tierResults: Record<string, number> = {};

    for (const tier of tiers) {
      // Get all users in this tier
      const { data: users, error: usersError } = await supabaseAdmin
        .from("unified_profiles")
        .select("id, auth_user_id, display_name, email")
        .eq("current_tier_id", tier.id);

      if (usersError) {
        console.error(`Error fetching users for tier ${tier.tier_name}:`, usersError);
        continue;
      }
      if (!users || users.length === 0) continue;

      tierResults[tier.tier_name] = users.length;

      for (const user of users) {
        if (!user.auth_user_id) continue;

        // Credit claims to profiles table
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({
            claim_balance: supabaseAdmin.rpc ? undefined : undefined,
          })
          .eq("id", user.auth_user_id);

        // Use raw SQL via rpc isn't available, so do increment manually
        const { data: currentProfile } = await supabaseAdmin
          .from("profiles")
          .select("claim_balance")
          .eq("id", user.auth_user_id)
          .single();

        if (currentProfile) {
          const newBalance = (currentProfile.claim_balance || 0) + tier.claims_per_month;

          await supabaseAdmin
            .from("profiles")
            .update({ claim_balance: newBalance, updated_at: new Date().toISOString() })
            .eq("id", user.auth_user_id);
        }

        // Log in nctr_transactions
        await supabaseAdmin.from("nctr_transactions").insert({
          user_id: user.id,
          source: "monthly_tier_allocation",
          base_amount: tier.claims_per_month,
          status_multiplier: 1,
          merch_lock_multiplier: 1,
          final_amount: tier.claims_per_month,
          tier_at_time: tier.tier_name,
          notes: `Monthly Claims distribution: ${tier.claims_per_month} Claims as ${tier.display_name} member`,
        });

        // Send notification
        await supabaseAdmin.from("notifications").insert({
          user_id: user.auth_user_id,
          type: "monthly_claims",
          title: "Monthly Claims Arrived!",
          message: `You received ${tier.claims_per_month} Claims as a ${tier.display_name} member.`,
          metadata: {
            claims_amount: tier.claims_per_month,
            tier_name: tier.tier_name,
            display_name: tier.display_name,
            distributed_at: new Date().toISOString(),
          },
        });

        totalDistributed += tier.claims_per_month;
        usersProcessed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_claims_distributed: totalDistributed,
        users_processed: usersProcessed,
        tier_breakdown: tierResults,
        distributed_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Monthly claims distribution error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
