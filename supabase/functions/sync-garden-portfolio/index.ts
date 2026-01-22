import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the request body
    const body = await req.json();
    const { wallet_address, portfolio_data } = body as {
      wallet_address?: string;
      portfolio_data?: GardenPortfolioData;
    };

    // Get the unified profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('unified_profiles')
      .select('id, wallet_address')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If portfolio_data is provided (from The Garden webhook/push)
    if (portfolio_data && portfolio_data.wallet_address) {
      // Upsert the wallet portfolio
      const { error: upsertError } = await supabaseAdmin
        .from('wallet_portfolio')
        .upsert({
          user_id: profile.id,
          wallet_address: portfolio_data.wallet_address.toLowerCase(),
          nctr_balance: portfolio_data.nctr_balance || 0,
          nctr_360_locked: portfolio_data.nctr_360_locked || 0,
          nctr_90_locked: portfolio_data.nctr_90_locked || 0,
          nctr_unlocked: portfolio_data.nctr_unlocked || 0,
          locks: portfolio_data.locks || [],
          sync_source: 'garden_push',
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'wallet_address',
        });

      if (upsertError) {
        console.error('Upsert error:', upsertError);
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
            wallet_address: portfolio_data.wallet_address.toLowerCase(),
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);
      }

      // Recalculate tier
      await supabaseAdmin.rpc('calculate_user_tier', { p_user_id: profile.id });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Portfolio synced successfully',
          wallet_address: portfolio_data.wallet_address
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If just linking a wallet address (for future sync)
    if (wallet_address) {
      await supabaseAdmin
        .from('unified_profiles')
        .update({ 
          wallet_address: wallet_address.toLowerCase(),
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      // Create empty portfolio entry
      await supabaseAdmin
        .from('wallet_portfolio')
        .upsert({
          user_id: profile.id,
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
          message: 'Wallet linked successfully. Visit The Garden to sync your portfolio.',
          wallet_address 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'No wallet_address or portfolio_data provided' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
