import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    const { priceId, packageId, successUrl, cancelUrl, customAmount, customClaims } = await req.json();
    
    // Either priceId (for predefined packages) or customAmount (for custom purchases) is required
    if (!priceId && !customAmount) {
      throw new Error("Price ID or custom amount is required");
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Build line items based on whether it's a predefined package or custom amount
    let lineItems;
    let metadata;

    if (customAmount && customClaims) {
      // Custom amount purchase using price_data
      lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Custom Pack - ${customClaims} Claims`,
              description: `${customClaims} Claim Passes + ${customAmount * 3} Bonus NCTR (360LOCK)`,
            },
            unit_amount: customAmount * 100, // Convert dollars to cents
          },
          quantity: 1,
        },
      ];
      metadata = {
        user_id: user.id,
        package_id: 'custom',
        custom_amount: customAmount.toString(),
        custom_claims: customClaims.toString(),
      };
    } else {
      // Predefined package
      lineItems = [
        {
          price: priceId,
          quantity: 1,
        },
      ];
      metadata = {
        user_id: user.id,
        package_id: packageId,
      };
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl || `${origin}/?payment=success`,
      cancel_url: cancelUrl || `${origin}/?payment=canceled`,
      metadata,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
