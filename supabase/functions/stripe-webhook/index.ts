import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

const claimPackages = {
  'starter': { claims: 10, name: 'Starter Pack', price: 5000 }, // $50
  'popular': { claims: 25, name: 'Popular Pack', price: 12500 }, // $125
  'premium': { claims: 50, name: 'Premium Pack', price: 25000 }, // $250
  'ultimate': { claims: 100, name: 'Ultimate Pack', price: 50000 }, // $500
  'mega': { claims: 220, name: 'Mega Pack', price: 100000 }, // $1000
};

// Calculate bonus NCTR: 3 NCTR per $1 spent
function calculateBonusNCTR(amountInCents: number): number {
  const dollars = amountInCents / 100;
  return Math.floor(dollars * 3);
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log("Webhook event type:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const userId = session.metadata?.user_id;
      const packageId = session.metadata?.package_id;

      if (!userId || !packageId) {
        console.error("Missing metadata:", { userId, packageId });
        return new Response("Missing metadata", { status: 400 });
      }

      const package_info = claimPackages[packageId as keyof typeof claimPackages];
      if (!package_info) {
        console.error("Invalid package ID:", packageId);
        return new Response("Invalid package", { status: 400 });
      }

      // Update user's claim balance
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      // First get current balance and locked NCTR
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("claim_balance, locked_nctr")
        .eq("id", userId)
        .single();

      if (!profile) {
        console.error("Profile not found for user:", userId);
        return new Response("Profile not found", { status: 404 });
      }

      // Calculate bonus NCTR (automatically added to 360LOCK)
      const bonusNCTR = calculateBonusNCTR(package_info.price);
      console.log(`Calculated bonus NCTR: ${bonusNCTR} for purchase amount: $${package_info.price / 100}`);

      // Update with new balance and bonus locked NCTR
      const { error } = await supabaseClient
        .from("profiles")
        .update({
          claim_balance: profile.claim_balance + package_info.claims,
          locked_nctr: profile.locked_nctr + bonusNCTR
        })
        .eq("id", userId);

      if (error) {
        console.error("Error updating claim balance:", error);
        return new Response("Database error", { status: 500 });
      }

      // Record the purchase
      const { error: purchaseError } = await supabaseClient
        .from("purchases")
        .insert({
          user_id: userId,
          package_id: packageId,
          package_name: package_info.name,
          claims_amount: package_info.claims,
          amount_paid: package_info.price,
          currency: 'usd',
          stripe_session_id: session.id,
          status: 'completed'
        });

      if (purchaseError) {
        console.error("Error recording purchase:", purchaseError);
        // Don't fail the webhook if we can't record the purchase
      }

      console.log(`Successfully added ${package_info.claims} claims and ${bonusNCTR} bonus NCTR (360LOCK) to user ${userId}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
