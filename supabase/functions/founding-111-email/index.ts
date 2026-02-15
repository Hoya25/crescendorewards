import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const ADMIN_EMAIL = "anderson@projectbutterfly.io";

interface EmailRequest {
  type: "qualified" | "approved";
  user_id: string;
  email?: string;
  display_name?: string;
  founding_number?: number;
  purchase_count?: number;
  total_spend?: number;
  referral_purchases?: number;
}

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  try {
    const body: EmailRequest = await req.json();
    const { type, display_name, email, founding_number, purchase_count, total_spend, referral_purchases } = body;

    if (type === "qualified") {
      // Notify admin that a member qualified
      await resend.emails.send({
        from: "Crescendo <notifications@crescendo.nctr.live>",
        to: [ADMIN_EMAIL],
        subject: `Founding 111 Candidate: ${display_name || "Unknown"} qualified`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #323232;">Founding 111 — New Candidate Qualified</h2>
            <p><strong>${display_name || "Unknown"}</strong> has met both requirements:</p>
            <ul>
              <li>${purchase_count || 0} purchases ($${((total_spend || 0) / 100).toFixed(0)} spent)</li>
              <li>${referral_purchases || 0} referral purchases</li>
            </ul>
            <p>
              <a href="https://crescendo.nctr.live/admin" 
                 style="display: inline-block; padding: 12px 24px; background: #E2FF6D; color: #323232; font-weight: bold; text-decoration: none; border-radius: 8px;">
                Review at Admin Panel
              </a>
            </p>
          </div>
        `,
      });
    } else if (type === "approved" && email) {
      // Notify member they've been approved
      await resend.emails.send({
        from: "Crescendo <notifications@crescendo.nctr.live>",
        to: [email],
        subject: `Welcome to the Founding 111 — You're Member #${founding_number}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #323232;">🎉 Congratulations, ${display_name || "Member"}!</h2>
            <p style="font-size: 18px;">You've been verified as <strong style="color: #323232;">Founding Member #${founding_number}</strong>.</p>
            <p>Your benefits are now active:</p>
            <ul style="line-height: 2;">
              <li><strong>1,250 NCTR</strong> bonus (360LOCK)</li>
              <li><strong>5× boosted</strong> referral drip for 6 months</li>
              <li><strong>Exclusive merch</strong> access</li>
            </ul>
            <p style="color: #666; font-size: 14px;">This status is permanent and can never be earned again.</p>
            <p>
              <a href="https://crescendo.nctr.live/bounties" 
                 style="display: inline-block; padding: 12px 24px; background: #E2FF6D; color: #323232; font-weight: bold; text-decoration: none; border-radius: 8px;">
                View Your Status
              </a>
            </p>
          </div>
        `,
      });

      // Also notify admin
      await resend.emails.send({
        from: "Crescendo <notifications@crescendo.nctr.live>",
        to: [ADMIN_EMAIL],
        subject: `Founding 111: ${display_name || "Member"} approved as #${founding_number}`,
        html: `<p>${display_name} (${email}) has been approved as Founding Member #${founding_number}.</p>`,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Founding 111 email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
