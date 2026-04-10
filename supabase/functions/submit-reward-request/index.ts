import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const NOTIFY_EMAIL = 'anderson@projectbutterfly.io';

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { request_title, request_details, tier_at_time, user_email, handle } = body;

    if (!request_title || typeof request_title !== 'string' || request_title.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'request_title is required' }), { status: 400, headers: corsHeaders });
    }
    if (request_title.length > 500) {
      return new Response(JSON.stringify({ error: 'request_title too long' }), { status: 400, headers: corsHeaders });
    }
    if (request_details && request_details.length > 2000) {
      return new Response(JSON.stringify({ error: 'request_details too long' }), { status: 400, headers: corsHeaders });
    }

    // Insert into reward_requests
    const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { error: insertError } = await serviceClient
      .from('reward_requests')
      .insert({
        user_id: user.id,
        user_email: user_email || user.email,
        request_title: request_title.trim(),
        request_details: request_details?.trim() || null,
        tier_at_time: tier_at_time || null,
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to save request' }), { status: 500, headers: corsHeaders });
    }

    // Send notification email via Resend
    const displayHandle = handle || user_email || user.email || 'Unknown';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #131313;">New Reward Request</h2>
        <p><strong>From:</strong> ${displayHandle}</p>
        <p><strong>Email:</strong> ${user_email || user.email}</p>
        <p><strong>Tier:</strong> ${tier_at_time || 'Unknown'}</p>
        <hr style="border: 1px solid #E2FF6D;" />
        <p><strong>Request:</strong></p>
        <p style="font-size: 18px; color: #131313;">${request_title}</p>
        ${request_details ? `<p><strong>Details:</strong></p><p style="color: #5A5A58;">${request_details}</p>` : ''}
      </div>
    `;

    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Crescendo <onboarding@resend.dev>',
          to: [NOTIFY_EMAIL],
          subject: `[Crescendo] Reward Request from ${displayHandle}`,
          html: emailHtml,
        }),
      });

      if (!resendResponse.ok) {
        const errText = await resendResponse.text();
        console.error('Resend error:', errText);
      } else {
        await resendResponse.text();
      }
    } catch (emailErr) {
      console.error('Email send error:', emailErr);
      // Don't fail the request if email fails
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
  }
});
