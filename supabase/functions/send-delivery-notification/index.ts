import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeliveryNotificationRequest {
  claimId: string;
  userId: string;
  rewardTitle: string;
  deliveryStatus: string;
  deliveryMethod: string | null;
}

const DELIVERY_STATUS_CONFIG: Record<string, { emoji: string; subject: string; headline: string; message: string; color: string }> = {
  pending: {
    emoji: "⏳",
    subject: "Your Reward Claim is Pending",
    headline: "Claim Received!",
    message: "We've received your reward claim and it's in our queue for processing. We'll update you as soon as there's progress.",
    color: "#f59e0b",
  },
  processing: {
    emoji: "⚙️",
    subject: "Your Reward is Being Prepared",
    headline: "We're Working on It!",
    message: "Great news! Your reward is now being prepared for delivery. This usually takes 1-3 business days.",
    color: "#3b82f6",
  },
  shipped: {
    emoji: "📦",
    subject: "Your Reward Has Been Shipped!",
    headline: "On Its Way!",
    message: "Your reward has been shipped and is on its way to you. Keep an eye out for tracking information.",
    color: "#8b5cf6",
  },
  delivered: {
    emoji: "✅",
    subject: "Your Reward Has Been Delivered!",
    headline: "Delivery Complete!",
    message: "Your reward has been successfully delivered. We hope you enjoy it! If you have any issues, please let us know.",
    color: "#10b981",
  },
  failed: {
    emoji: "⚠️",
    subject: "Issue with Your Reward Delivery",
    headline: "Delivery Issue",
    message: "We encountered an issue delivering your reward. Our team is looking into it and will reach out to resolve this as soon as possible.",
    color: "#ef4444",
  },
};

const DELIVERY_METHOD_HINTS: Record<string, string> = {
  email: "Check your email inbox (and spam folder) for delivery details.",
  shipping: "You'll receive tracking information once your package ships.",
  wallet_transfer: "The transfer will be sent to your registered wallet address.",
  instant_code: "Your redemption code will be delivered via email.",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { claimId, userId, rewardTitle, deliveryStatus, deliveryMethod }: DeliveryNotificationRequest = await req.json();

    console.log("Processing delivery notification:", { claimId, userId, deliveryStatus, deliveryMethod });

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

    const userName = profile.full_name || "Crescendo Member";
    const statusConfig = DELIVERY_STATUS_CONFIG[deliveryStatus] || DELIVERY_STATUS_CONFIG.pending;
    const methodHint = deliveryMethod ? DELIVERY_METHOD_HINTS[deliveryMethod] : null;

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
                <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #111827;">Claim Details</h2>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280;">Reward</span>
                  <span style="color: #111827; font-weight: 600;">${rewardTitle}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280;">Status</span>
                  <span style="color: ${statusConfig.color}; font-weight: 600; text-transform: capitalize;">${deliveryStatus}</span>
                </div>
                
                ${deliveryMethod ? `
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #6b7280;">Delivery Method</span>
                  <span style="color: #111827; font-weight: 600; text-transform: capitalize;">${deliveryMethod.replace('_', ' ')}</span>
                </div>
                ` : ''}
              </div>
              
              ${methodHint ? `
              <div style="background: linear-gradient(135deg, ${statusConfig.color}10 0%, ${statusConfig.color}05 100%); border: 1px solid ${statusConfig.color}30; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: ${statusConfig.color}; font-size: 14px;">
                  <strong>💡 Tip:</strong> ${methodHint}
                </p>
              </div>
              ` : ''}
              
              <div style="text-align: center;">
                <a href="https://crescendo-nctr-live.lovable.app/dashboard" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View My Claims
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 32px; text-align: center;">
                Questions about your delivery? Reply to this email and we'll help you out.
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

    console.log("Delivery notification email sent:", emailResponse);

    // Also create an in-app notification
    await supabaseClient.from("notifications").insert({
      user_id: userId,
      type: "delivery_update",
      title: `${statusConfig.emoji} ${statusConfig.headline}`,
      message: `${rewardTitle}: ${statusConfig.message}`,
      metadata: { claim_id: claimId, reward_title: rewardTitle, delivery_status: deliveryStatus },
    });

    return new Response(
      JSON.stringify({ success: true, data: emailResponse.data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending delivery notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
