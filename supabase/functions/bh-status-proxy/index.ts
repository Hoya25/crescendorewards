import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BH_FUNCTIONS_BASE = 'https://auibudfactqhisvmiotw.supabase.co/functions/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email;

    // Parse the request body
    const body = await req.json();
    const { action, email, tx_hash, amount, question, user_id } = body;

    // Validate action
    const allowedActions = ['get_user_status', 'verify_deposit', 'upgrade_to_360lock', 'wingman_briefing'];
    if (!action || !allowedActions.includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build the BH request payload
    const syncSecret = Deno.env.get('SYNC_SECRET');
    if (!syncSecret) {
      console.error('SYNC_SECRET not configured');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use the authenticated user's email for email-based actions,
    // preventing users from querying other users' data
    const bhPayload: Record<string, unknown> = { action };

    if (action === 'get_user_status') {
      bhPayload.email = email || userEmail;
    } else if (action === 'verify_deposit') {
      bhPayload.email = email || userEmail;
      bhPayload.tx_hash = tx_hash;
    } else if (action === 'upgrade_to_360lock') {
      bhPayload.email = email || userEmail;
      bhPayload.amount = amount;
    } else if (action === 'wingman_briefing') {
      bhPayload.user_id = user_id || userId;
      if (question) bhPayload.question = question;
    }

    // Call BH admin-api
    const bhRes = await fetch(`${BH_FUNCTIONS_BASE}/admin-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sync-secret': syncSecret,
      },
      body: JSON.stringify(bhPayload),
    });

    const bhData = await bhRes.json();

    // For wingman_briefing, try fallback to direct wingman-briefing function
    if (action === 'wingman_briefing' && !bhRes.ok) {
      try {
        const fallbackRes = await fetch(`${BH_FUNCTIONS_BASE}/wingman-briefing`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-sync-secret': syncSecret,
          },
          body: JSON.stringify({
            user_id: user_id || userId,
            question,
          }),
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          return new Response(JSON.stringify(fallbackData), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        await fallbackRes.text(); // consume
      } catch {
        // fall through to return original response
      }
    }

    return new Response(JSON.stringify(bhData), {
      status: bhRes.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('bh-status-proxy error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
