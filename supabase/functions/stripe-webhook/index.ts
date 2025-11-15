import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

const claimPackages = {
  'starter': { claims: 10 },
  'popular': { claims: 25 },
  'premium': { claims: 50 },
  'ultimate': { claims: 100 },
  'mega': { claims: 220 }, // 210 + 10 bonus
};

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

      // First get current balance
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("claim_balance")
        .eq("id", userId)
        .single();

      if (!profile) {
        console.error("Profile not found for user:", userId);
        return new Response("Profile not found", { status: 404 });
      }

      // Update with new balance
      const { error } = await supabaseClient
        .from("profiles")
        .update({
          claim_balance: profile.claim_balance + package_info.claims
        })
        .eq("id", userId);

      if (error) {
        console.error("Error updating claim balance:", error);
        return new Response("Database error", { status: 500 });
      }

      console.log(`Successfully added ${package_info.claims} claims to user ${userId}`);
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
