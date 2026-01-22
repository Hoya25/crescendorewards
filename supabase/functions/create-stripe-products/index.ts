import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// All 10 claim package tiers
const PACKAGES = [
  { name: "Lite Pack", price: 2500, claims: 5, description: "5 Claims - Perfect for trying out" },
  { name: "Starter Pack", price: 5500, claims: 12, description: "12 Claims - Great starter value" },
  { name: "Plus Pack", price: 11000, claims: 25, description: "25 Claims - Popular choice" },
  { name: "Core Pack", price: 21500, claims: 50, description: "50 Claims - Solid foundation" },
  { name: "Pro Pack", price: 42000, claims: 100, description: "100 Claims - For serious collectors" },
  { name: "Premium Pack", price: 71500, claims: 175, description: "175 Claims - Premium value" },
  { name: "Elite Pack", price: 125000, claims: 310, description: "310 Claims - Elite tier benefits" },
  { name: "Mega Pack", price: 250000, claims: 625, description: "625 Claims - Massive savings" },
  { name: "Ultra Pack", price: 500000, claims: 1250, description: "1,250 Claims - Ultra premium" },
  { name: "Max Pack", price: 2500000, claims: 6250, description: "6,250 Claims - Maximum value with 10x bonus" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    console.log("Starting to create Stripe products and prices...");

    const results = [];

    for (const pkg of PACKAGES) {
      console.log(`Creating product: ${pkg.name}`);

      // Create the product
      const product = await stripe.products.create({
        name: pkg.name,
        description: pkg.description,
        metadata: {
          claims: pkg.claims.toString(),
          package_type: "claim_pack",
        },
      });

      console.log(`Created product: ${product.id}`);

      // Create the price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: pkg.price,
        currency: "usd",
        metadata: {
          claims: pkg.claims.toString(),
        },
      });

      console.log(`Created price: ${price.id} for ${pkg.name}`);

      results.push({
        name: pkg.name,
        price_dollars: pkg.price / 100,
        claims: pkg.claims,
        product_id: product.id,
        price_id: price.id,
      });
    }

    console.log("All products created successfully!");

    // Format results for easy copy-paste
    const priceIdMap = results.reduce((acc, r) => {
      const key = r.name.toLowerCase().replace(" pack", "").replace(" ", "_");
      acc[key] = r.price_id;
      return acc;
    }, {} as Record<string, string>);

    return new Response(
      JSON.stringify({
        success: true,
        message: "All 10 Stripe products and prices created successfully!",
        products: results,
        price_ids_for_config: priceIdMap,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error creating Stripe products:", errorMessage);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        hint: "Make sure STRIPE_SECRET_KEY is set to your LIVE key (sk_live_...)"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
