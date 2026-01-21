import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FeedbackNotificationRequest {
  feedback_id: string;
  page_url: string;
  whats_working: string | null;
  whats_broken: string | null;
  image_url: string | null;
  user_email: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      feedback_id, 
      page_url, 
      whats_working, 
      whats_broken, 
      image_url, 
      user_email 
    }: FeedbackNotificationRequest = await req.json();

    // Get admin emails from admin_users table
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: admins, error: adminError } = await supabase
      .from("admin_users")
      .select(`
        user_id,
        unified_profiles!inner(email)
      `)
      .eq("is_active", true);

    if (adminError) {
      console.error("Error fetching admins:", adminError);
      throw adminError;
    }

    // Extract admin emails
    const adminEmails = admins
      ?.map((a: any) => a.unified_profiles?.email)
      .filter((email: string | null) => email) || [];

    if (adminEmails.length === 0) {
      console.log("No admin emails found to notify");
      return new Response(
        JSON.stringify({ message: "No admins to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build email content
    const feedbackType = whats_broken ? "🔧 Issue Report" : "✨ Positive Feedback";
    const baseUrl = "https://crescendo-nctr-live.lovable.app";

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
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">${feedbackType}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">New beta feedback received</p>
          </div>
          
          <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                <strong>From:</strong> ${user_email || "Anonymous user"}
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>Page:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${page_url}</code>
              </p>
            </div>
            
            ${whats_working ? `
              <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
                <h3 style="margin: 0 0 8px 0; color: #15803d; font-size: 14px; font-weight: 600;">✨ What's Working</h3>
                <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6;">${whats_working}</p>
              </div>
            ` : ""}
            
            ${whats_broken ? `
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
                <h3 style="margin: 0 0 8px 0; color: #b91c1c; font-size: 14px; font-weight: 600;">🔧 What's Broken</h3>
                <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6;">${whats_broken}</p>
              </div>
            ` : ""}
            
            ${image_url ? `
              <div style="margin: 24px 0; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin-bottom: 12px;">📸 Screenshot attached:</p>
                <a href="${image_url}" style="display: inline-block; background: #7c3aed; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; font-size: 14px;">
                  View Screenshot
                </a>
              </div>
            ` : ""}
            
            <div style="border-top: 1px solid #e5e7eb; margin-top: 24px; padding-top: 24px; text-align: center;">
              <a href="${baseUrl}/admin" style="display: inline-block; background: #18181b; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
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

    // Send email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Crescendo Beta <notifications@nctr.io>",
        to: adminEmails,
        subject: `${feedbackType} - Crescendo Beta`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Feedback notification sent:", emailResult);

    return new Response(JSON.stringify({ success: true, ...emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending feedback notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);