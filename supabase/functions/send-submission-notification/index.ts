import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface SubmissionNotificationRequest {
  submissionId: string;
  userId: string;
  rewardTitle: string;
  status: "pending" | "approved" | "rejected" | "needs_changes";
  rejectionReason?: string;
  adminNotes?: string;
  rewardId?: string; // For approved submissions
}

const STATUS_CONFIG: Record<string, { emoji: string; subject: string; headline: string; message: string; color: string; cta?: { text: string; url: string } }> = {
  pending: {
    emoji: "📝",
    subject: "Submission Received",
    headline: "Submission Received!",
    message: "We've received your reward submission and it's now in our review queue. Our team will review it within 2-3 business days.",
    color: "#f59e0b",
    cta: { text: "View My Submissions", url: "https://crescendo-nctr-live.lovable.app/my-submissions" }
  },
  approved: {
    emoji: "🎉",
    subject: "Submission Approved!",
    headline: "Congratulations!",
    message: "Your reward submission has been approved and is now live in the marketplace! Members can now claim your reward.",
    color: "#10b981",
    cta: { text: "View in Marketplace", url: "https://crescendo-nctr-live.lovable.app/rewards" }
  },
  rejected: {
    emoji: "❌",
    subject: "Submission Needs Work",
    headline: "Submission Rejected",
    message: "Unfortunately, your reward submission was not approved. But don't worry — you can resubmit with changes!",
    color: "#ef4444",
    cta: { text: "Resubmit Now", url: "https://crescendo-nctr-live.lovable.app/my-submissions" }
  },
  needs_changes: {
    emoji: "✏️",
    subject: "Changes Requested",
    headline: "Almost There!",
    message: "Your submission is close, but our team has requested a few changes before it can be approved.",
    color: "#f59e0b",
    cta: { text: "Make Changes", url: "https://crescendo-nctr-live.lovable.app/my-submissions" }
  },
};

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  try {
    const { submissionId, userId, rewardTitle, status, rejectionReason, adminNotes, rewardId }: SubmissionNotificationRequest = await req.json();

    console.log("Processing submission notification:", { submissionId, userId, status, rewardTitle });

    // Get user email from Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (profileError || !profile?.email) {
      console.error("Could not find user email:", profileError);
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userName = profile.full_name || "Crescendo Contributor";
    const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

    // Build rejection details HTML if applicable
    let rejectionDetailsHtml = "";
    if (status === "rejected" && rejectionReason) {
      rejectionDetailsHtml = `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #dc2626;">📋 Reason for Rejection</h3>
          <p style="margin: 0; color: #7f1d1d; font-size: 14px;">${rejectionReason}</p>
          ${adminNotes ? `<p style="margin: 12px 0 0 0; color: #9ca3af; font-size: 13px; font-style: italic;">Admin notes: ${adminNotes}</p>` : ''}
        </div>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #16a34a;">💡 How to Resubmit</h3>
          <ol style="margin: 0; padding-left: 20px; color: #166534; font-size: 14px;">
            <li style="margin-bottom: 8px;">Go to My Submissions page</li>
            <li style="margin-bottom: 8px;">Find your rejected submission</li>
            <li style="margin-bottom: 8px;">Click "Resubmit with Changes"</li>
            <li>Address the feedback and submit again</li>
          </ol>
        </div>
      `;
    }

    // Build approval details HTML if applicable
    let approvalDetailsHtml = "";
    if (status === "approved" && rewardId) {
      approvalDetailsHtml = `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #16a34a;">🚀 What's Next?</h3>
          <ul style="margin: 0; padding-left: 20px; color: #166534; font-size: 14px;">
            <li style="margin-bottom: 8px;">Your reward is now visible in the marketplace</li>
            <li style="margin-bottom: 8px;">Members can claim it using their claims balance</li>
            <li>You'll be notified when someone claims your reward</li>
          </ul>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "Crescendo <onboarding@resend.dev>",
      to: [profile.email],
      subject: `${statusConfig.emoji} ${statusConfig.subject} - ${rewardTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, ${statusConfig.color} 0%, ${statusConfig.color}cc 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">${statusConfig.emoji} ${statusConfig.headline}</h1>
            </div>
            
            <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
                Hi ${userName},
              </p>
              
              <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
                ${statusConfig.message}
              </p>
              
              <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #111827;">Submission Details</h2>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280;">Reward Title</span>
                  <span style="color: #111827; font-weight: 600;">${rewardTitle}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #6b7280;">Status</span>
                  <span style="color: ${statusConfig.color}; font-weight: 600; text-transform: capitalize;">${status.replace('_', ' ')}</span>
                </div>
              </div>
              
              ${rejectionDetailsHtml}
              ${approvalDetailsHtml}
              
              ${statusConfig.cta ? `
              <div style="text-align: center;">
                <a href="${statusConfig.cta.url}" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  ${statusConfig.cta.text}
                </a>
              </div>
              ` : ''}
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 32px; text-align: center;">
                Questions about your submission? Reply to this email and we'll help you out.
              </p>
            </div>
            
            <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">
              © 2026 Crescendo. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Submission notification email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse.data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending submission notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
