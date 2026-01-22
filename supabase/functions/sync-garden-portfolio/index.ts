import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-garden-webhook-secret',
};

interface GardenPortfolioData {
  wallet_address: string;
  nctr_balance: number;
  nctr_360_locked: number;
  nctr_90_locked: number;
  nctr_unlocked: number;
  locks?: Array<{
    amount: number;
    lock_type: string;
    lock_date: string;
    unlock_date: string;
  }>;
}

interface WebhookPayload {
  event: 'portfolio_updated' | 'wallet_linked';
  user_id?: string; // unified_profiles.id
  auth_user_id?: string; // auth.users.id
  email?: string;
  wallet_address: string;
  portfolio: GardenPortfolioData;
  timestamp: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('GARDEN_WEBHOOK_SECRET');
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check for webhook secret (service-to-service)
    const gardenWebhookSecret = req.headers.get('x-garden-webhook-secret');
    const authHeader = req.headers.get('authorization');
    
    let userId: string | null = null;
    let authUserId: string | null = null;

    // Webhook from The Garden (service-to-service)
    if (gardenWebhookSecret) {
      if (webhookSecret && gardenWebhookSecret !== webhookSecret) {
        return new Response(
          JSON.stringify({ error: 'Invalid webhook secret' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const payload: WebhookPayload = await req.json();
      console.log('Webhook received:', payload.event, payload.email || payload.user_id);

      // Find user by various identifiers
      let profile = null;
      
      if (payload.user_id) {
        const { data } = await supabaseAdmin
          .from('unified_profiles')
          .select('id, auth_user_id, wallet_address')
          .eq('id', payload.user_id)
          .single();
        profile = data;
      }
      
      if (!profile && payload.auth_user_id) {
        const { data } = await supabaseAdmin
          .from('unified_profiles')
          .select('id, auth_user_id, wallet_address')
          .eq('auth_user_id', payload.auth_user_id)
          .single();
        profile = data;
      }
      
      if (!profile && payload.email) {
        const { data } = await supabaseAdmin
          .from('unified_profiles')
          .select('id, auth_user_id, wallet_address')
          .ilike('email', payload.email)
          .single();
        profile = data;
      }

      if (!profile) {
        return new Response(
          JSON.stringify({ error: 'User not found', searched: { user_id: payload.user_id, auth_user_id: payload.auth_user_id, email: payload.email } }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = profile.id;
      authUserId = profile.auth_user_id;

      // Sync the portfolio data
      const portfolioData = payload.portfolio;
      const walletAddress = (portfolioData.wallet_address || payload.wallet_address).toLowerCase();

      const { error: upsertError } = await supabaseAdmin
        .from('wallet_portfolio')
        .upsert({
          user_id: userId,
          wallet_address: walletAddress,
          nctr_balance: portfolioData.nctr_balance || 0,
          nctr_360_locked: portfolioData.nctr_360_locked || 0,
          nctr_90_locked: portfolioData.nctr_90_locked || 0,
          nctr_unlocked: portfolioData.nctr_unlocked || 0,
          locks: portfolioData.locks || [],
          sync_source: 'garden_webhook',
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'wallet_address',
        });

      if (upsertError) {
        console.error('Portfolio upsert error:', upsertError);
        return new Response(
          JSON.stringify({ error: 'Failed to sync portfolio', details: upsertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update wallet address on profile if not set
      if (!profile.wallet_address) {
        await supabaseAdmin
          .from('unified_profiles')
          .update({ 
            wallet_address: walletAddress,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      }

      // Recalculate tier
      await supabaseAdmin.rpc('calculate_user_tier', { p_user_id: userId });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Portfolio synced via webhook',
          user_id: userId,
          wallet_address: walletAddress,
          nctr_360_locked: portfolioData.nctr_360_locked
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticated user request (manual sync trigger)
    if (authHeader) {
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      authUserId = user.id;

      // Get the unified profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('unified_profiles')
        .select('id, wallet_address, email')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ error: 'Profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = profile.id;

      const body = await req.json().catch(() => ({}));
      const { action, wallet_address, portfolio_data } = body as {
        action?: 'link_wallet' | 'sync_portfolio';
        wallet_address?: string;
        portfolio_data?: GardenPortfolioData;
      };

      // Link wallet action
      if (action === 'link_wallet' && wallet_address) {
        await supabaseAdmin
          .from('unified_profiles')
          .update({ 
            wallet_address: wallet_address.toLowerCase(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        // Create placeholder portfolio entry
        await supabaseAdmin
          .from('wallet_portfolio')
          .upsert({
            user_id: userId,
            wallet_address: wallet_address.toLowerCase(),
            nctr_balance: 0,
            nctr_360_locked: 0,
            nctr_90_locked: 0,
            nctr_unlocked: 0,
            locks: [],
            sync_source: 'wallet_link',
            last_synced_at: new Date().toISOString(),
          }, {
            onConflict: 'wallet_address',
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Wallet linked. Sync your portfolio from The Garden.',
            wallet_address,
            garden_url: 'https://thegarden.nctr.live'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Manual portfolio sync (with data provided)
      if (portfolio_data && portfolio_data.wallet_address) {
        const walletAddr = portfolio_data.wallet_address.toLowerCase();
        
        await supabaseAdmin
          .from('wallet_portfolio')
          .upsert({
            user_id: userId,
            wallet_address: walletAddr,
            nctr_balance: portfolio_data.nctr_balance || 0,
            nctr_360_locked: portfolio_data.nctr_360_locked || 0,
            nctr_90_locked: portfolio_data.nctr_90_locked || 0,
            nctr_unlocked: portfolio_data.nctr_unlocked || 0,
            locks: portfolio_data.locks || [],
            sync_source: 'manual_sync',
            last_synced_at: new Date().toISOString(),
          }, {
            onConflict: 'wallet_address',
          });

        if (!profile.wallet_address) {
          await supabaseAdmin
            .from('unified_profiles')
            .update({ wallet_address: walletAddr, updated_at: new Date().toISOString() })
            .eq('id', userId);
        }

        await supabaseAdmin.rpc('calculate_user_tier', { p_user_id: userId });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Portfolio synced',
            wallet_address: walletAddr
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Return current sync status
      const { data: portfolioData } = await supabaseAdmin
        .from('wallet_portfolio')
        .select('*')
        .eq('user_id', userId);

      return new Response(
        JSON.stringify({ 
          success: true,
          profile_id: userId,
          wallet_address: profile.wallet_address,
          portfolio: portfolioData || [],
          message: portfolioData?.length ? 'Portfolio data found' : 'No portfolio data. Visit The Garden to sync.',
          garden_url: 'https://thegarden.nctr.live'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Authorization required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
