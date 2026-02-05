import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'shop_purchase' | 'nctr_credited' | 'tier_change' | 'pending_purchase';
  user_id?: string;
  email?: string;
  data: Record<string, unknown>;
}

const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

const getEmailTemplate = (type: string, data: Record<string, unknown>) => {
  const baseUrl = 'https://crescendo.nctr.live';
  
  const headerStyle = `
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: white;
    padding: 32px;
    text-align: center;
    border-radius: 12px 12px 0 0;
  `;
  
  const bodyStyle = `
    background: #fafafa;
    padding: 32px;
    font-family: system-ui, -apple-system, sans-serif;
    color: #1a1a1a;
    line-height: 1.6;
  `;
  
  const buttonStyle = `
    display: inline-block;
    background: #2C3539;
    color: white;
    padding: 14px 28px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    margin-top: 24px;
  `;
  
  const footerStyle = `
    background: #f0f0f0;
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: #666;
    border-radius: 0 0 12px 12px;
  `;

  switch (type) {
    case 'shop_purchase':
      return {
        subject: `You earned ${formatNumber(data.nctr_earned as number)} NCTR from your purchase!`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <div style="${headerStyle}">
              <h1 style="margin: 0; font-size: 28px;">🎉 NCTR Earned!</h1>
            </div>
            <div style="${bodyStyle}">
              <p style="font-size: 18px; margin-bottom: 20px;">Great news, <strong>${data.name || 'Member'}</strong>!</p>
              
              <p>Your purchase of <strong>$${formatNumber(data.amount as number)}</strong> at <strong>${data.store || 'NCTR Merch'}</strong> just earned you:</p>
              
              <div style="background: linear-gradient(135deg, #2C3539 0%, #3d4a4f 100%); color: white; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0;">
                <p style="margin: 0; font-size: 36px; font-weight: bold;">+${formatNumber(data.nctr_earned as number)} NCTR</p>
              </div>
              
              <p>Your NCTR is building your digital ownership stake in the NCTR Alliance ecosystem.</p>
              
              ${data.total_balance ? `<p><strong>Current NCTR Balance:</strong> ${formatNumber(data.total_balance as number)} NCTR</p>` : ''}
              
              <p style="margin-top: 20px;">Keep earning at The Garden — shop 6,000+ brands and earn NCTR with every purchase.</p>
              
              <div style="text-align: center;">
                <a href="${baseUrl}/rewards" style="${buttonStyle}">View My Rewards</a>
              </div>
            </div>
            <div style="${footerStyle}">
              <p style="margin: 0;">You're receiving this because you have email notifications enabled for shop purchases.</p>
              <p style="margin: 8px 0 0 0;"><a href="${baseUrl}/profile" style="color: #666;">Manage notification preferences</a></p>
            </div>
          </div>
        `,
      };

    case 'tier_change':
      const tierEmoji = {
        'diamond': '💎',
        'platinum': '⚡',
        'gold': '🏆',
        'silver': '🥈',
        'bronze': '🥉',
      }[String(data.tier_name).toLowerCase()] || '🌟';
      
      return {
        subject: `You've reached ${data.tier_name} Status!`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <div style="${headerStyle}">
              <h1 style="margin: 0; font-size: 28px;">${tierEmoji} Status Unlocked!</h1>
            </div>
            <div style="${bodyStyle}">
              <p style="font-size: 18px; margin-bottom: 20px;">Congratulations, <strong>${data.name || 'Member'}</strong>!</p>
              
              <p>Your 360LOCK commitment has unlocked <strong>${data.tier_name}</strong> status.</p>
              
              <div style="background: linear-gradient(135deg, ${data.badge_color || '#2C3539'} 0%, #1a1a2e 100%); color: white; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0;">
                <p style="margin: 0; font-size: 48px;">${tierEmoji}</p>
                <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: bold;">${data.tier_name}</p>
              </div>
              
              <h3 style="margin-bottom: 16px;">Your New Benefits:</h3>
              <ul style="padding-left: 20px;">
                ${data.multiplier ? `<li><strong>${data.multiplier}x</strong> earning multiplier</li>` : ''}
                ${data.claims_per_period ? `<li><strong>${data.claims_per_period}</strong> claims per period</li>` : ''}
                ${data.discount_percent ? `<li><strong>${data.discount_percent}%</strong> discount on rewards</li>` : ''}
                ${data.priority_support ? `<li>Priority support access</li>` : ''}
                ${data.early_access ? `<li>Early access to new rewards</li>` : ''}
              </ul>
              
              <p style="margin-top: 20px;">Your rewards are growing with your commitment.</p>
              
              <div style="text-align: center;">
                <a href="${baseUrl}/benefits" style="${buttonStyle}">Explore Your Benefits</a>
              </div>
            </div>
            <div style="${footerStyle}">
              <p style="margin: 0;">You're receiving this because you have email notifications enabled for tier changes.</p>
              <p style="margin: 8px 0 0 0;"><a href="${baseUrl}/profile" style="color: #666;">Manage notification preferences</a></p>
            </div>
          </div>
        `,
      };

    case 'nctr_credited':
      return {
        subject: `Your NCTR Balance Updated`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <div style="${headerStyle}">
              <h1 style="margin: 0; font-size: 28px;">📊 Balance Update</h1>
            </div>
            <div style="${bodyStyle}">
              <p style="font-size: 18px; margin-bottom: 20px;"><strong>${data.name || 'Member'}</strong>, your NCTR balance has been updated.</p>
              
              <div style="background: linear-gradient(135deg, #2C3539 0%, #3d4a4f 100%); color: white; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; font-size: 18px; opacity: 0.9;">Added</p>
                <p style="margin: 0; font-size: 36px; font-weight: bold;">+${formatNumber(data.amount as number)} NCTR</p>
              </div>
              
              <div style="display: flex; justify-content: space-between; background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <div>
                  <p style="margin: 0; font-size: 14px; color: #666;">New Balance</p>
                  <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: bold;">${formatNumber(data.new_balance as number)} NCTR</p>
                </div>
                <div style="text-align: right;">
                  <p style="margin: 0; font-size: 14px; color: #666;">Current Status</p>
                  <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: bold;">${data.tier || 'Member'}</p>
                </div>
              </div>
              
              ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
              
              <div style="text-align: center;">
                <a href="${baseUrl}/dashboard" style="${buttonStyle}">View Dashboard</a>
              </div>
            </div>
            <div style="${footerStyle}">
              <p style="margin: 0;">You're receiving this because you have email notifications enabled for NCTR updates.</p>
              <p style="margin: 8px 0 0 0;"><a href="${baseUrl}/profile" style="color: #666;">Manage notification preferences</a></p>
            </div>
          </div>
        `,
      };

    case 'pending_purchase':
      return {
        subject: `You earned NCTR from your purchase — claim it!`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <div style="${headerStyle}">
              <h1 style="margin: 0; font-size: 28px;">🎁 NCTR Waiting For You!</h1>
            </div>
            <div style="${bodyStyle}">
              <p style="font-size: 18px; margin-bottom: 20px;">Hi <strong>${data.customer_name || 'there'}</strong>!</p>
              
              <p>Your purchase of <strong>$${formatNumber(data.amount as number)}</strong> at <strong>NCTR Merch</strong> just earned you:</p>
              
              <div style="background: linear-gradient(135deg, #2C3539 0%, #3d4a4f 100%); color: white; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0;">
                <p style="margin: 0; font-size: 36px; font-weight: bold;">+${formatNumber(data.nctr_earned as number)} NCTR</p>
                <p style="margin: 8px 0 0 0; opacity: 0.9;">Waiting to be claimed</p>
              </div>
              
              <p><strong>What is NCTR?</strong></p>
              <p>NCTR is your digital ownership stake in the NCTR Alliance ecosystem. As a member, you'll unlock exclusive rewards, benefits, and experiences.</p>
              
              <p style="margin-top: 20px;">Sign up for Crescendo to claim your NCTR and start unlocking rewards.</p>
              
              <div style="text-align: center;">
                <a href="${baseUrl}/signup" style="${buttonStyle}">Claim Your NCTR</a>
              </div>
            </div>
            <div style="${footerStyle}">
              <p style="margin: 0;">You're receiving this because you made a purchase at NCTR Merch.</p>
              <p style="margin: 8px 0 0 0;">Questions? Reply to this email.</p>
            </div>
          </div>
        `,
      };

    default:
      throw new Error(`Unknown notification type: ${type}`);
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, user_id, email, data }: NotificationRequest = await req.json();

    if (!type || !data) {
      throw new Error("Missing required fields: type, data");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let recipientEmail = email;
    let userName = data.name as string || data.customer_name as string;

    // If user_id provided, fetch user info and check notification preferences
    if (user_id) {
      const { data: profile } = await supabase
        .from('unified_profiles')
        .select('email, display_name')
        .eq('id', user_id)
        .single();

      if (profile) {
        recipientEmail = profile.email;
        userName = userName || profile.display_name;
      }

      // Check notification preferences
      const { data: settings } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (settings) {
        const preferenceMap: Record<string, string> = {
          'shop_purchase': 'email_shop_purchases',
          'nctr_credited': 'email_nctr_credited',
          'tier_change': 'email_tier_changes',
        };

        const prefKey = preferenceMap[type];
        if (prefKey && settings[prefKey] === false) {
          console.log(`User ${user_id} has disabled ${type} notifications`);
          return new Response(
            JSON.stringify({ success: true, skipped: true, reason: 'User preference disabled' }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    if (!recipientEmail) {
      throw new Error("No recipient email available");
    }

    // Add name to data for template
    data.name = userName;

    const template = getEmailTemplate(type, data);

    console.log(`Sending ${type} notification to ${recipientEmail}`);

    const emailResponse = await resend.emails.send({
      from: "Crescendo <notifications@nctr.live>",
      to: [recipientEmail],
      subject: template.subject,
      html: template.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, email_id: emailResponse.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Notification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
