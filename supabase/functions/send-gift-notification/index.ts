import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GiftNotificationRequest {
  type: "gift_sent" | "gift_claimed" | "gift_expiring";
  giftId: string;
  recipientEmail: string;
  senderName?: string;
  claimsAmount: number;
  message?: string;
  giftCode?: string;
  expiresAt?: string;
  claimedByName?: string;
}

const getEmailContent = (data: GiftNotificationRequest) => {
  const baseUrl = "https://crescendo-nctr-live.lovable.app";
  const claimUrl = data.giftCode ? `${baseUrl}/claim?code=${data.giftCode}` : `${baseUrl}/claim`;

  switch (data.type) {
    case "gift_sent":
      return {
        subject: `🎁 ${data.senderName || "Someone"} sent you a gift on Crescendo!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">🎁</div>
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">You've received a gift!</h1>
              </div>
              <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                  <strong>${data.senderName || "A Crescendo member"}</strong> has sent you <strong>${data.claimsAmount} Claims</strong>!
                </p>
                ${data.message ? `
                  <div style="background: #f9fafb; border-left: 4px solid #7c3aed; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">Personal message:</p>
                    <p style="color: #374151; font-size: 16px; margin: 0; font-style: italic;">"${data.message}"</p>
                  </div>
                ` : ""}
                <div style="background: linear-gradient(135deg, #7c3aed10 0%, #a855f710 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                  <p style="color: #7c3aed; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">YOUR GIFT CODE</p>
                  <p style="color: #374151; font-size: 28px; margin: 0; font-weight: 700; letter-spacing: 2px;">${data.giftCode || "GIFT-XXXXXXXX"}</p>
                </div>
                <a href="${claimUrl}" style="display: block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-align: center; margin: 24px 0;">
                  Claim Your Gift
                </a>
                ${data.expiresAt ? `
                  <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
                    This gift expires on ${new Date(data.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                ` : ""}
              </div>
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
                © ${new Date().getFullYear()} Crescendo. All rights reserved.
              </p>
            </div>
          </body>
          </html>
        `,
      };

    case "gift_claimed":
      return {
        subject: `✅ Your gift was claimed!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Your gift was claimed!</h1>
              </div>
              <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                  Great news! <strong>${data.claimedByName || "The recipient"}</strong> has claimed your gift of <strong>${data.claimsAmount} Claims</strong>.
                </p>
                <div style="background: #f0fdf4; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                  <p style="color: #10b981; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">GIFT DELIVERED</p>
                  <p style="color: #374151; font-size: 24px; margin: 0; font-weight: 700;">${data.claimsAmount} Claims</p>
                </div>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                  Thank you for spreading the joy of Crescendo! Your generosity helps grow our community.
                </p>
              </div>
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
                © ${new Date().getFullYear()} Crescendo. All rights reserved.
              </p>
            </div>
          </body>
          </html>
        `,
      };

    case "gift_expiring":
      return {
        subject: `⏰ Your Crescendo gift expires in 3 days!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">⏰</div>
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Your gift expires soon!</h1>
              </div>
              <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                  Don't miss out! You have a gift of <strong>${data.claimsAmount} Claims</strong> waiting for you that expires in <strong>3 days</strong>.
                </p>
                ${data.senderName ? `
                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
                    Sent by: ${data.senderName}
                  </p>
                ` : ""}
                <div style="background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                  <p style="color: #b45309; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">EXPIRES SOON</p>
                  <p style="color: #374151; font-size: 24px; margin: 0 0 8px 0; font-weight: 700;">${data.claimsAmount} Claims</p>
                  <p style="color: #b45309; font-size: 12px; margin: 0;">
                    ${data.expiresAt ? new Date(data.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "Expiring soon"}
                  </p>
                </div>
                <a href="${claimUrl}" style="display: block; background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-align: center; margin: 24px 0;">
                  Claim Now Before It Expires
                </a>
              </div>
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
                © ${new Date().getFullYear()} Crescendo. All rights reserved.
              </p>
            </div>
          </body>
          </html>
        `,
      };

    default:
      throw new Error("Invalid notification type");
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: GiftNotificationRequest = await req.json();
    
    if (!data.recipientEmail || !data.type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: recipientEmail and type" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { subject, html } = getEmailContent(data);

    // Send email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Crescendo <notifications@nctr.io>",
        to: [data.recipientEmail],
        subject,
        html,
      }),
    });

    const emailResult = await emailResponse.json();

    console.log("Gift notification email sent:", emailResult);

    return new Response(JSON.stringify({ success: true, ...emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-gift-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
