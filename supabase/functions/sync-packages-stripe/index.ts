import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    // Verify admin access
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check admin role
    const { data: roleCheck } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!roleCheck) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Use service role for data operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Fetch packages without Stripe price ID
    const { data: packages, error: fetchError } = await supabaseAdmin
      .from('claim_packages')
      .select('*')
      .is('stripe_price_id', null)
      .eq('is_active', true);

    if (fetchError) throw fetchError;

    let synced = 0;

    for (const pkg of packages || []) {
      try {
        // Create Stripe product
        const product = await stripe.products.create({
          name: pkg.name,
          description: pkg.description || `${pkg.claims_amount} Claims Package`,
          metadata: {
            package_id: pkg.id,
            claims_amount: pkg.claims_amount.toString(),
            bonus_nctr: pkg.bonus_nctr.toString(),
          },
        });

        // Create Stripe price
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: pkg.price_cents,
          currency: 'usd',
          metadata: {
            package_id: pkg.id,
          },
        });

        // Update package with Stripe IDs
        const { error: updateError } = await supabaseAdmin
          .from('claim_packages')
          .update({
            stripe_product_id: product.id,
            stripe_price_id: price.id,
          })
          .eq('id', pkg.id);

        if (updateError) {
          console.error(`Failed to update package ${pkg.id}:`, updateError);
        } else {
          synced++;
          console.log(`Synced package ${pkg.name}: ${price.id}`);
        }
      } catch (stripeError) {
        console.error(`Stripe error for package ${pkg.name}:`, stripeError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, synced, total: packages?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
