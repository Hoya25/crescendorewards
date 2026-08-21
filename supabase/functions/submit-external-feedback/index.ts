import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { safeText, safeUrl } from "../_shared/auth.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExternalFeedbackRequest {
  page_url: string;
  whats_working?: string | null;
  whats_broken?: string | null;
  image_url?: string | null;
  user_email?: string | null;
  source: string; // e.g., "the-garden", "crescendo"
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ExternalFeedbackRequest = await req.json();
    const { page_url, whats_working, whats_broken, image_url, user_email, source } = body;

    // Validate required fields
    if (!page_url) {
      return new Response(
        JSON.stringify({ error: "page_url is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Only plain http(s) links are accepted, and free text is length-capped.
    if (!safeUrl(page_url)) {
      return new Response(
        JSON.stringify({ error: "page_url must be a valid http(s) URL" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if ((whats_working?.length ?? 0) > 4000 || (whats_broken?.length ?? 0) > 4000) {
      return new Response(
        JSON.stringify({ error: "Feedback text is too long (4000 characters max)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!whats_working && !whats_broken) {
      return new Response(
        JSON.stringify({ error: "At least one of whats_working or whats_broken is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Simple abuse throttle: cap total anonymous feedback per 10-minute window
    // so this endpoint cannot be used to flood the admin inbox.
    const windowStart = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .gte("created_at", windowStart);

    if ((recentCount ?? 0) >= 20) {
      return new Response(
        JSON.stringify({ error: "Too many feedback submissions right now. Try again shortly." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Insert feedback into database
    const { data: feedbackData, error: insertError } = await supabase
      .from("feedback")
      .insert({
        page_url,
        whats_working,
        whats_broken,
        image_url,
        status: "pending",
        // Store source in page_url or we could add a source column later
        // For now, prefix the page_url with source identifier
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting feedback:", insertError);
      throw insertError;
    }

    console.log("Feedback saved:", feedbackData.id);

    // Get admin emails to notify
    const { data: adminUsers, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("is_active", true);

    if (adminError) {
      console.error("Error fetching admins:", adminError);
    }

    let adminEmails: string[] = [];
    if (adminUsers && adminUsers.length > 0) {
      const adminUserIds = adminUsers.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from("unified_profiles")
        .select("email")
        .in("id", adminUserIds);

      adminEmails = profiles
        ?.map((p: { email: string | null }) => p.email)
        .filter((email: string | null): email is string => !!email) || [];
    }

    // Send email notification if we have admins and Resend key
    if (adminEmails.length > 0 && RESEND_API_KEY) {
      const feedbackType = whats_broken ? "🔧 Issue Report" : "✨ Positive Feedback";
      const sourceLabel = source === "the-garden" ? "The Garden" : (source || "External").slice(0, 60);
      const escapeHtmlType = feedbackType; // fixed, non-user-controlled label

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">${escapeHtmlType}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">New feedback from <strong>${safeText(sourceLabel, 60)}</strong></p>
            </div>
            
            <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                  <strong>Source:</strong> ${safeText(sourceLabel, 60)}
                </p>
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                  <strong>From:</strong> ${safeText(user_email, 200) || "Anonymous user"}
                </p>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  <strong>Page:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${safeText(page_url, 500)}</code>
                </p>
              </div>
              
              ${whats_working ? `
                <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
                  <h3 style="margin: 0 0 8px 0; color: #15803d; font-size: 14px; font-weight: 600;">✨ What's Working</h3>
                  <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6;">${safeText(whats_working, 4000)}</p>
                </div>
              ` : ""}
              
              ${whats_broken ? `
                <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
                  <h3 style="margin: 0 0 8px 0; color: #b91c1c; font-size: 14px; font-weight: 600;">🔧 What's Broken</h3>
                  <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6;">${safeText(whats_broken, 4000)}</p>
                </div>
              ` : ""}
              
              ${safeUrl(image_url) ? `
                <div style="margin: 24px 0; text-align: center;">
                  <p style="color: #6b7280; font-size: 14px; margin-bottom: 12px;">📸 Screenshot attached:</p>
                  <a href="${safeUrl(image_url)}" style="display: inline-block; background: #7c3aed; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; font-size: 14px;">
                    View Screenshot
                  </a>
                </div>
              ` : ""}
              
              <div style="border-top: 1px solid #e5e7eb; margin-top: 24px; padding-top: 24px; text-align: center;">
                <a href="https://crescendo-nctr-live.lovable.app/admin" style="display: inline-block; background: #18181b; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                  View in Admin Panel
                </a>
              </div>
            </div>
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
              © ${new Date().getFullYear()} Crescendo. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Crescendo Beta <onboarding@resend.dev>",
            to: adminEmails,
            subject: `${feedbackType} from ${sourceLabel}`,
            html: emailHtml,
          }),
        });

        const emailResult = await emailResponse.json();
        console.log("Email notification sent:", emailResult);
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Don't fail the request if email fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        feedback_id: feedbackData.id,
        message: "Feedback submitted successfully" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in submit-external-feedback:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
