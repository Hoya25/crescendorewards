import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurchaseConfirmationRequest {
  userId: string;
  packageName: string;
  claimsAmount: number;
  bonusNCTR: number;
  amountPaid: number;
  newBalance: number;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, packageName, claimsAmount, bonusNCTR, amountPaid, newBalance }: PurchaseConfirmationRequest = await req.json();

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
    const formattedAmount = (amountPaid / 100).toFixed(2);

    const emailResponse = await resend.emails.send({
      from: "Crescendo <onboarding@resend.dev>",
      to: [profile.email],
      subject: `🎉 Purchase Complete - ${claimsAmount} Claims Added!`,
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
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🎉 Purchase Complete!</h1>
            </div>
            
            <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
                Hi ${userName},
              </p>
              
              <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
                Thank you for your purchase! Your claim passes have been added to your account.
              </p>
              
              <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #111827;">Order Summary</h2>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280;">Package</span>
                  <span style="color: #111827; font-weight: 600;">${packageName}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280;">Claims Added</span>
                  <span style="color: #7c3aed; font-weight: 600;">+${claimsAmount}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280;">Bonus NCTR (360LOCK)</span>
                  <span style="color: #8b5cf6; font-weight: 600;">+${bonusNCTR.toLocaleString()}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280;">Amount Paid</span>
                  <span style="color: #111827; font-weight: 600;">$${formattedAmount}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #111827; font-weight: 600;">New Claims Balance</span>
                  <span style="color: #059669; font-weight: 700; font-size: 18px;">${newBalance}</span>
                </div>
              </div>
              
              <div style="background: linear-gradient(135deg, #7c3aed10 0%, #a855f710 100%); border: 1px solid #7c3aed30; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #7c3aed; font-size: 14px;">
                  <strong>🎁 Bonus Applied!</strong> Your ${bonusNCTR.toLocaleString()} NCTR has been locked for 360 days and is contributing to your membership tier progression.
                </p>
              </div>
              
              <div style="text-align: center;">
                <a href="https://crescendo-nctr-live.lovable.app/rewards" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Browse Rewards
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 32px; text-align: center;">
                Questions? Reply to this email and we'll help you out.
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

    console.log("Purchase confirmation email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse.data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending purchase confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
