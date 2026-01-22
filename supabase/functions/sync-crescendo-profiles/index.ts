import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

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

// Send failure notification email
async function sendFailureNotification(errorMessage: string, details: Record<string, unknown>) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("RESEND_API_KEY not configured - skipping email notification");
    return;
  }

  const resend = new Resend(resendApiKey);
  const adminEmail = "anderson@projectbutterfly.io";

  try {
    await resend.emails.send({
      from: "Crescendo Alerts <onboarding@resend.dev>",
      to: [adminEmail],
      subject: "🚨 Crescendo Profile Sync Failed",
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">⚠️ Sync Failure Alert</h1>
          </div>
          <div style="background: #1a1a1a; color: #e5e5e5; padding: 24px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; margin-bottom: 16px;">
              The Crescendo profile sync encountered an error:
            </p>
            <div style="background: #2a2a2a; padding: 16px; border-radius: 8px; border-left: 4px solid #dc2626; margin-bottom: 20px;">
              <code style="color: #fca5a5; word-break: break-all;">${errorMessage}</code>
            </div>
            <h3 style="color: #fbbf24; margin-bottom: 12px;">Details</h3>
            <pre style="background: #2a2a2a; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; color: #a3a3a3;">
${JSON.stringify(details, null, 2)}
            </pre>
            <p style="color: #737373; font-size: 12px; margin-top: 20px;">
              Timestamp: ${new Date().toISOString()}
            </p>
          </div>
        </div>
      `,
    });
    console.log("Failure notification email sent successfully");
  } catch (emailError) {
    console.error("Failed to send notification email:", emailError);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    const url = new URL(req.url);
    const testMode = url.searchParams.get("test") === "true";

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

    // Test mode - simulate a failure and send email
    if (testMode) {
      console.log("Test mode activated - simulating sync failure");
      
      const testError = "Simulated sync failure for testing email notifications";
      const testDetails = {
        test_mode: true,
        triggered_by: user.email || user.id,
        simulated_error: "Database connection timeout",
        profiles_attempted: 0,
        timestamp: new Date().toISOString(),
      };

      await sendFailureNotification(testError, testDetails);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Test email notification sent! Check your inbox.",
          test_details: testDetails,
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Fetch all Crescendo profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("*");

    if (profilesError) {
      const errorMsg = `Failed to fetch profiles: ${profilesError.message}`;
      await sendFailureNotification(errorMsg, { 
        error_code: profilesError.code,
        stage: "fetch_profiles" 
      });
      throw new Error(errorMsg);
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

    // If there were errors during sync, send notification
    if (results.errors.length > 0) {
      await sendFailureNotification(
        `Sync completed with ${results.errors.length} errors`,
        {
          synced: results.synced,
          created: results.created,
          updated: results.updated,
          errors: results.errors,
        }
      );
    }

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
    
    // Send failure notification for critical errors
    await sendFailureNotification(errorMessage, {
      stage: "critical_failure",
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
