import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface MergeRequest {
  wallet_user_id: string;      // The wallet-only user ID (placeholder email)
  target_email: string;         // The real email to merge into
  wallet_address: string;       // The wallet address to link
  first_name: string;
  last_name: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body: MergeRequest = await req.json();
    const { wallet_user_id, target_email, wallet_address, first_name, last_name } = body;

    if (!wallet_user_id || !target_email || !wallet_address) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = target_email.toLowerCase().trim();
    const normalizedWallet = wallet_address.toLowerCase();
    const fullName = `${first_name} ${last_name}`;

    // Check if the target email already exists in profiles
    const { data: existingProfile, error: lookupError } = await supabase
      .from('profiles')
      .select('id, email, wallet_address, full_name, claim_balance, available_nctr, locked_nctr')
      .eq('email', normalizedEmail)
      .not('email', 'ilike', '%@wallet.crescendo.app')
      .maybeSingle();

    if (lookupError) {
      console.error('Lookup error:', lookupError);
      return new Response(
        JSON.stringify({ error: 'Failed to lookup existing user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the wallet user's data
    const { data: walletProfile, error: walletLookupError } = await supabase
      .from('profiles')
      .select('id, claim_balance, available_nctr, locked_nctr')
      .eq('id', wallet_user_id)
      .single();

    if (walletLookupError || !walletProfile) {
      console.error('Wallet profile lookup error:', walletLookupError);
      return new Response(
        JSON.stringify({ error: 'Wallet user not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingProfile) {
      // MERGE: Email user already exists - merge wallet user into existing email user
      console.log(`Merging wallet user ${wallet_user_id} into existing email user ${existingProfile.id}`);

      // 1. Merge balances from wallet user into existing user
      const mergedClaimBalance = (existingProfile.claim_balance || 0) + (walletProfile.claim_balance || 0);
      const mergedAvailableNctr = (existingProfile.available_nctr || 0) + (walletProfile.available_nctr || 0);
      const mergedLockedNctr = (existingProfile.locked_nctr || 0) + (walletProfile.locked_nctr || 0);

      // 2. Update existing profile with wallet address and merged balances
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          wallet_address: normalizedWallet,
          full_name: existingProfile.full_name || fullName,
          claim_balance: mergedClaimBalance,
          available_nctr: mergedAvailableNctr,
          locked_nctr: mergedLockedNctr,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProfile.id);

      if (updateError) {
        console.error('Update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to merge profiles' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 3. Transfer rewards_claims from wallet user to existing user
      await supabase
        .from('rewards_claims')
        .update({ user_id: existingProfile.id })
        .eq('user_id', wallet_user_id);

      // 4. Transfer purchases from wallet user to existing user
      await supabase
        .from('purchases')
        .update({ user_id: existingProfile.id })
        .eq('user_id', wallet_user_id);

      // 5. Transfer reward_wishlists from wallet user
      await supabase
        .from('reward_wishlists')
        .update({ user_id: existingProfile.id })
        .eq('user_id', wallet_user_id);

      // 6. Transfer reward_watchlist entries
      await supabase
        .from('reward_watchlist')
        .update({ user_id: existingProfile.id })
        .eq('user_id', wallet_user_id);

      // 7. Transfer notifications
      await supabase
        .from('notifications')
        .update({ user_id: existingProfile.id })
        .eq('user_id', wallet_user_id);

      // 8. Transfer membership_history
      await supabase
        .from('membership_history')
        .update({ user_id: existingProfile.id })
        .eq('user_id', wallet_user_id);

      // 9. Update unified_profiles - link wallet to existing user's unified profile
      const { data: existingUnified } = await supabase
        .from('unified_profiles')
        .select('id')
        .eq('auth_user_id', existingProfile.id)
        .maybeSingle();

      if (existingUnified) {
        await supabase
          .from('unified_profiles')
          .update({ 
            wallet_address: normalizedWallet,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingUnified.id);
      }

      // 10. Delete the wallet user's unified_profile entry
      await supabase
        .from('unified_profiles')
        .delete()
        .eq('auth_user_id', wallet_user_id);

      // 11. Delete the wallet user's profile (we've merged everything)
      await supabase
        .from('profiles')
        .delete()
        .eq('id', wallet_user_id);

      // 12. Optionally delete the wallet auth user (commented out as it may cause issues)
      // await supabase.auth.admin.deleteUser(wallet_user_id);

      // Log the merge activity
      await supabase
        .from('cross_platform_activity_log')
        .insert({
          user_id: existingUnified?.id || null,
          platform: 'crescendo',
          action_type: 'wallet_user_merged',
          action_data: {
            wallet_user_id,
            target_user_id: existingProfile.id,
            wallet_address: normalizedWallet,
            balances_merged: {
              claim_balance: walletProfile.claim_balance,
              available_nctr: walletProfile.available_nctr,
              locked_nctr: walletProfile.locked_nctr,
            },
            merged_at: new Date().toISOString(),
          },
        });

      return new Response(
        JSON.stringify({
          success: true,
          merged: true,
          target_user_id: existingProfile.id,
          message: 'Wallet linked to existing account successfully',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // NO EXISTING USER: Just update the wallet user's profile with real email and name
      console.log(`Updating wallet user ${wallet_user_id} with real email: ${normalizedEmail}`);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email: normalizedEmail,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', wallet_user_id);

      if (updateError) {
        console.error('Update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update unified_profiles as well
      await supabase
        .from('unified_profiles')
        .update({
          email: normalizedEmail,
          display_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', wallet_user_id);

      return new Response(
        JSON.stringify({
          success: true,
          merged: false,
          target_user_id: wallet_user_id,
          message: 'Profile updated successfully',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Merge wallet user error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
