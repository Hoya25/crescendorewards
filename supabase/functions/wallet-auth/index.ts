import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import { verifyMessage } from 'https://esm.sh/viem@2.39.0';
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface ChallengeRequest {
  action: 'get-challenge';
  wallet_address: string;
}

interface VerifyRequest {
  action: 'verify-signature';
  wallet_address: string;
  signature: string;
  nonce: string;
}

type RequestBody = ChallengeRequest | VerifyRequest;

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body: RequestBody = await req.json();

    if (body.action === 'get-challenge') {
      // Generate a cryptographically secure nonce
      const nonceBytes = new Uint8Array(32);
      crypto.getRandomValues(nonceBytes);
      const nonce = Array.from(nonceBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const walletAddress = body.wallet_address.toLowerCase();

      // Clean up any old nonces for this wallet
      await supabase
        .from('auth_nonces')
        .delete()
        .eq('wallet_address', walletAddress);

      // Store the nonce with 5-minute expiration
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      
      const { error: insertError } = await supabase
        .from('auth_nonces')
        .insert({
          wallet_address: walletAddress,
          nonce: nonce,
          expires_at: expiresAt,
          used: false
        });

      if (insertError) {
        console.error('Failed to create nonce:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate challenge' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create the message for the user to sign
      const message = `Welcome to Crescendo!\n\nPlease sign this message to authenticate.\n\nWallet: ${walletAddress}\nNonce: ${nonce}\n\nThis signature will not trigger a blockchain transaction or cost any gas fees.`;

      return new Response(
        JSON.stringify({ nonce, message }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.action === 'verify-signature') {
      const walletAddress = body.wallet_address.toLowerCase();
      const { signature, nonce } = body;

      // Verify the nonce exists, hasn't expired, and hasn't been used
      const { data: nonceData, error: nonceError } = await supabase
        .from('auth_nonces')
        .select('*')
        .eq('wallet_address', walletAddress)
        .eq('nonce', nonce)
        .eq('used', false)
        .single();

      if (nonceError || !nonceData) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired nonce' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if nonce has expired
      if (new Date(nonceData.expires_at) < new Date()) {
        // Clean up expired nonce
        await supabase
          .from('auth_nonces')
          .delete()
          .eq('id', nonceData.id);

        return new Response(
          JSON.stringify({ error: 'Challenge has expired. Please request a new one.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Recreate the message that was signed
      const message = `Welcome to Crescendo!\n\nPlease sign this message to authenticate.\n\nWallet: ${walletAddress}\nNonce: ${nonce}\n\nThis signature will not trigger a blockchain transaction or cost any gas fees.`;

      // Verify the signature using viem
      let isValid = false;
      try {
        isValid = await verifyMessage({
          address: walletAddress as `0x${string}`,
          message,
          signature: signature as `0x${string}`,
        });
      } catch (verifyError) {
        console.error('Signature verification failed:', verifyError);
        return new Response(
          JSON.stringify({ error: 'Invalid signature format' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Signature verification failed' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark the nonce as used (single-use)
      await supabase
        .from('auth_nonces')
        .update({ used: true })
        .eq('id', nonceData.id);

      // Check if user exists with this wallet address in profiles table
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (existingProfile) {
        // User exists with this wallet - return success
        const isPlaceholderEmail = existingProfile.email?.includes('@wallet.crescendo.app');
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            user_exists: true,
            user_id: existingProfile.id,
            email: existingProfile.email,
            needs_profile_completion: isPlaceholderEmail || !existingProfile.full_name,
            message: 'Wallet verified successfully'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // New user - create account with wallet
      const walletEmail = `${walletAddress}@wallet.crescendo.app`;
      
      // Generate a secure random password for the wallet user
      const passwordBytes = new Uint8Array(32);
      crypto.getRandomValues(passwordBytes);
      const securePassword = Array.from(passwordBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email: walletEmail,
        password: securePassword,
        email_confirm: true, // Auto-confirm since we verified wallet ownership
        user_metadata: {
          full_name: `User ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
          wallet_address: walletAddress,
        },
      });

      if (signUpError) {
        console.error('Failed to create user:', signUpError);
        return new Response(
          JSON.stringify({ error: 'Failed to create account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update profile with wallet address
      if (signUpData.user) {
        await supabase
          .from('profiles')
          .update({ wallet_address: walletAddress })
          .eq('id', signUpData.user.id);
      }

      // Generate a session for the new user
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: walletEmail,
      });

      if (sessionError) {
        console.error('Failed to generate session:', sessionError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          user_exists: false,
          user_id: signUpData.user?.id,
          email: walletEmail,
          message: 'Account created successfully'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Wallet auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
