import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

// Fallback hardcoded packages (used if DB fetch fails)
const fallbackPackages: Record<string, { claims: number; name: string; price: number }> = {
  'starter': { claims: 10, name: 'Starter Pack', price: 5000 },
  'popular': { claims: 25, name: 'Popular Pack', price: 12500 },
  'premium': { claims: 50, name: 'Premium Pack', price: 25000 },
  'ultimate': { claims: 100, name: 'Ultimate Pack', price: 50000 },
  'mega': { claims: 220, name: 'Mega Pack', price: 100000 },
};

// Calculate bonus NCTR: 3 NCTR per $1 spent
function calculateBonusNCTR(amountInCents: number): number {
  const dollars = amountInCents / 100;
  return Math.floor(dollars * 3);
}

interface ClaimPackageRow {
  claims_amount: number;
  name: string;
  price_cents: number;
  bonus_nctr: number | null;
}

// Fetch package from database by stripe_price_id or package_id
async function getPackageInfo(
  supabaseClient: any,
  packageId: string,
  stripePriceId?: string
): Promise<{ claims: number; name: string; price: number; bonusNCTR: number } | null> {
  // Try to fetch from claim_packages table
  let query = supabaseClient.from('claim_packages').select('claims_amount, name, price_cents, bonus_nctr');
  
  if (stripePriceId) {
    query = query.eq('stripe_price_id', stripePriceId);
  } else if (packageId) {
    // Try matching by package_id (legacy support)
    query = query.ilike('name', `%${packageId}%`);
  }
  
  const { data, error } = await query.maybeSingle();
  
  if (error) {
    console.error('Error fetching package from DB:', error);
  }
  
  if (data) {
    const row = data as ClaimPackageRow;
    return {
      claims: row.claims_amount,
      name: row.name,
      price: row.price_cents,
      bonusNCTR: row.bonus_nctr || calculateBonusNCTR(row.price_cents),
    };
  }
  
  // Fallback to hardcoded packages
  const fallback = fallbackPackages[packageId as keyof typeof fallbackPackages];
  if (fallback) {
    return {
      ...fallback,
      bonusNCTR: calculateBonusNCTR(fallback.price),
    };
  }
  
  return null;
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    // Deno uses WebCrypto (async). Stripe requires constructEventAsync in this runtime.
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    console.log("Webhook event type:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const userId = session.metadata?.user_id;
      const packageId = session.metadata?.package_id;
      const stripePriceId = session.line_items?.[0]?.price?.id;

      if (!userId) {
        console.error("Missing user_id in metadata");
        return new Response("Missing user_id", { status: 400 });
      }

      // Create supabase client first so we can fetch package info
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      // Get package info from database (with fallback)
      const package_info = await getPackageInfo(supabaseClient, packageId || '', stripePriceId);
      
      if (!package_info) {
        console.error("Invalid package - not found in DB or fallbacks:", { packageId, stripePriceId });
        return new Response("Invalid package", { status: 400 });
      }

      console.log(`Processing package: ${package_info.name}, claims: ${package_info.claims}, bonus: ${package_info.bonusNCTR}`);

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

      // Use bonus NCTR from package (database value or calculated)
      const bonusNCTR = package_info.bonusNCTR;
      console.log(`Using bonus NCTR: ${bonusNCTR} for package: ${package_info.name}`);

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

      const newBalance = profile.claim_balance + package_info.claims;
      console.log(`Successfully added ${package_info.claims} claims and ${bonusNCTR} bonus NCTR (360LOCK) to user ${userId}`);

      // Keep the unified profile in sync (UI reads claims_balance from unified_profiles.crescendo_data)
      const { data: unified } = await supabaseClient
        .from("unified_profiles")
        .select("id, crescendo_data")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (unified?.id) {
        const cd = (unified.crescendo_data ?? {}) as Record<string, unknown>;
        const currentClaims = Number((cd as any).claims_balance ?? (cd as any).claim_balance ?? 0);
        const currentLocked = Number((cd as any).locked_nctr ?? 0);
        const nextCrescendoData = {
          ...(cd as any),
          claims_balance: currentClaims + package_info.claims,
          locked_nctr: currentLocked + bonusNCTR,
        };

        const { error: unifiedErr } = await supabaseClient
          .from("unified_profiles")
          .update({ crescendo_data: nextCrescendoData })
          .eq("id", unified.id);

        if (unifiedErr) {
          console.error("Error updating unified profile crescendo_data:", unifiedErr);
        }
      }

      // Send purchase confirmation email
      try {
        const emailResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-purchase-confirmation`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              userId,
              packageName: package_info.name,
              claimsAmount: package_info.claims,
              bonusNCTR,
              amountPaid: package_info.price,
              newBalance,
            }),
          }
        );
        
        if (!emailResponse.ok) {
          console.error("Failed to send purchase confirmation email:", await emailResponse.text());
        } else {
          console.log("Purchase confirmation email sent successfully");
        }
      } catch (emailError) {
        console.error("Error sending purchase confirmation email:", emailError);
        // Don't fail the webhook if email fails
      }
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
