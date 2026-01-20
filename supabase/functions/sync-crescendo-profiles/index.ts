import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  bio: string | null;
  level: number;
  locked_nctr: number;
  available_nctr: number;
  claim_balance: number;
  referral_code: string | null;
  referred_by: string | null;
  has_claimed_signup_bonus: boolean;
  has_status_access_pass: boolean;
  created_at: string;
  updated_at: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all Crescendo profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("*");

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    const results = {
      synced: 0,
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    // Process each profile
    for (const profile of profiles as Profile[]) {
      try {
        // Check if unified profile exists
        const { data: existingProfile } = await supabaseAdmin
          .from("unified_profiles")
          .select("id")
          .eq("auth_user_id", profile.id)
          .single();

        // Build crescendo_data JSON
        const crescendoData = {
          level: profile.level,
          locked_nctr: profile.locked_nctr,
          available_nctr: profile.available_nctr,
          claim_balance: profile.claim_balance,
          bio: profile.bio,
          referral_code: profile.referral_code,
          referred_by: profile.referred_by,
          has_claimed_signup_bonus: profile.has_claimed_signup_bonus,
          has_status_access_pass: profile.has_status_access_pass,
          synced_at: new Date().toISOString(),
        };

        if (existingProfile) {
          // Update existing unified profile
          const { error: updateError } = await supabaseAdmin
            .from("unified_profiles")
            .update({
              email: profile.email,
              display_name: profile.full_name,
              avatar_url: profile.avatar_url,
              wallet_address: profile.wallet_address,
              crescendo_data: crescendoData,
              last_active_crescendo: profile.updated_at,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingProfile.id);

          if (updateError) {
            results.errors.push(`Update failed for ${profile.id}: ${updateError.message}`);
          } else {
            results.updated++;
          }
        } else {
          // Create new unified profile
          const { error: insertError } = await supabaseAdmin
            .from("unified_profiles")
            .insert({
              auth_user_id: profile.id,
              email: profile.email,
              display_name: profile.full_name,
              avatar_url: profile.avatar_url,
              wallet_address: profile.wallet_address,
              crescendo_data: crescendoData,
              garden_data: {},
              last_active_crescendo: profile.updated_at,
              created_at: profile.created_at,
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            results.errors.push(`Insert failed for ${profile.id}: ${insertError.message}`);
          } else {
            results.created++;
          }
        }

        results.synced++;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        results.errors.push(`Error processing ${profile.id}: ${errorMessage}`);
      }
    }

    console.log("Sync completed:", results);

    // Log sync activity for status indicator
    const summary = {
      created: results.created,
      updated: results.updated,
      errors: results.errors.length,
      total_synced: results.synced,
      synced_at: new Date().toISOString(),
    };

    await supabaseAdmin
      .from("cross_platform_activity_log")
      .insert({
        platform: "crescendo",
        action_type: "profile_sync",
        action_data: summary,
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${results.synced} profiles (${results.created} created, ${results.updated} updated)`,
        summary,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
