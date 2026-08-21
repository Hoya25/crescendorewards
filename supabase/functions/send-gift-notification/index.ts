import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { adminClient, getAuthUserId, isAdminUser, isInternalCaller, escapeHtml, safeText, unauthorized } from "../_shared/auth.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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
  const claimUrl = data.giftCode ? `${baseUrl}/claim?code=${encodeURIComponent(String(data.giftCode))}` : `${baseUrl}/claim`;

  switch (data.type) {
    case "gift_sent":
      return {
        subject: `🎁 ${(data.senderName || "Someone")} sent you a gift on Crescendo!`,
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
                  <strong>${safeText(data.senderName, 80) || "A Crescendo member"}</strong> has sent you <strong>${Number(data.claimsAmount) || 0} Claims</strong>!
                </p>
                ${data.message ? `
                  <div style="background: #f9fafb; border-left: 4px solid #7c3aed; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">Personal message:</p>
                    <p style="color: #374151; font-size: 16px; margin: 0; font-style: italic;">"${safeText(data.message, 500)}"</p>
                  </div>
                ` : ""}
                <div style="background: linear-gradient(135deg, #7c3aed10 0%, #a855f710 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                  <p style="color: #7c3aed; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">YOUR GIFT CODE</p>
                  <p style="color: #374151; font-size: 28px; margin: 0; font-weight: 700; letter-spacing: 2px;">${escapeHtml(data.giftCode) || "GIFT-XXXXXXXX"}</p>
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
                  Great news! <strong>${safeText(data.claimedByName, 80) || "The recipient"}</strong> has claimed your gift of <strong>${Number(data.claimsAmount) || 0} Claims</strong>.
                </p>
                <div style="background: #f0fdf4; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                  <p style="color: #10b981; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">GIFT DELIVERED</p>
                  <p style="color: #374151; font-size: 24px; margin: 0; font-weight: 700;">${Number(data.claimsAmount) || 0} Claims</p>
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
                  Don't miss out! You have a gift of <strong>${Number(data.claimsAmount) || 0} Claims</strong> waiting for you that expires in <strong>3 days</strong>.
                </p>
                ${data.senderName ? `
                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
                    Sent by: ${safeText(data.senderName, 80)}
                  </p>
                ` : ""}
                <div style="background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                  <p style="color: #b45309; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">EXPIRES SOON</p>
                  <p style="color: #374151; font-size: 24px; margin: 0 0 8px 0; font-weight: 700;">${Number(data.claimsAmount) || 0} Claims</p>
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
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  try {
    const body: GiftNotificationRequest = await req.json();

    if (!body.giftId || !body.type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: giftId and type" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Load the gift and derive every email field from it. The recipient address,
    // amount, gift code and message can no longer be supplied by the caller.
    const admin = adminClient();
    const { data: gift, error: giftError } = await admin
      .from("claim_gifts")
      .select("id, sender_id, recipient_email, recipient_id, claims_amount, message, gift_code, expires_at")
      .eq("id", body.giftId)
      .maybeSingle();

    if (giftError || !gift) {
      return new Response(
        JSON.stringify({ error: "Gift not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Authorization: internal callers pass through; otherwise the caller must be
    // the gift's sender, its recipient, or an admin.
    if (!isInternalCaller(req)) {
      const callerId = await getAuthUserId(req);
      if (!callerId) return unauthorized(corsHeaders);

      const { data: callerProfile } = await admin
        .from("unified_profiles")
        .select("id, email")
        .eq("auth_user_id", callerId)
        .maybeSingle();

      const isParty =
        (callerProfile?.id && (callerProfile.id === gift.sender_id || callerProfile.id === gift.recipient_id)) ||
        (callerProfile?.email &&
          String(callerProfile.email).toLowerCase() === String(gift.recipient_email ?? "").toLowerCase());

      if (!isParty && !(await isAdminUser(callerId))) {
        return unauthorized(corsHeaders);
      }
    }

    // Display names come from the profile rows referenced by the gift.
    const nameFor = async (profileId: string | null) => {
      if (!profileId) return undefined;
      const { data: p } = await admin
        .from("unified_profiles")
        .select("display_name")
        .eq("id", profileId)
        .maybeSingle();
      return (p?.display_name as string) ?? undefined;
    };

    const data: GiftNotificationRequest = {
      type: body.type,
      giftId: gift.id as string,
      recipientEmail: gift.recipient_email as string,
      senderName: await nameFor(gift.sender_id as string | null),
      claimsAmount: Number(gift.claims_amount ?? 0),
      message: (gift.message as string) ?? undefined,
      giftCode: (gift.gift_code as string) ?? undefined,
      expiresAt: (gift.expires_at as string) ?? undefined,
      claimedByName: await nameFor(gift.recipient_id as string | null),
    };

    if (!data.recipientEmail) {
      return new Response(
        JSON.stringify({ error: "Gift has no recipient email" }),
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
