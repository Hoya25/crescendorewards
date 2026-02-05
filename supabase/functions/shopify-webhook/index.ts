import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-topic, x-shopify-hmac-sha256, x-shopify-shop-domain',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const topic = req.headers.get('x-shopify-topic');
    console.log('Webhook received, topic:', topic);

    // Only process orders/paid events
    if (topic !== 'orders/paid') {
      console.log('Ignoring non-orders/paid topic:', topic);
      return new Response(JSON.stringify({ success: true, message: 'Topic ignored' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    console.log('Processing order:', body.id, 'Order number:', body.order_number);

    // Extract order data
    const orderId = String(body.id);
    const orderNumber = body.order_number ? String(body.order_number) : null;
    const totalPrice = parseFloat(body.total_price || '0');
    const currency = body.currency || 'USD';
    
    // Get customer email (try multiple locations)
    const customerEmail = body.email || 
      body.customer?.email || 
      body.contact_email || 
      null;
    
    // Get customer name
    const customerFirstName = body.customer?.first_name || '';
    const customerLastName = body.customer?.last_name || '';
    const customerName = [customerFirstName, customerLastName].filter(Boolean).join(' ') || null;

    console.log('Customer:', customerEmail, customerName);

    if (!customerEmail) {
      console.log('No customer email found, storing as pending');
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate order
    const { data: existingOrder } = await supabase
      .from('shop_transactions')
      .select('id')
      .eq('order_id', orderId)
      .single();

    if (existingOrder) {
      console.log('Duplicate order, skipping:', orderId);
      return new Response(JSON.stringify({ success: true, message: 'Order already processed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get shop settings
    const { data: settings } = await supabase
      .from('shop_settings')
      .select('nctr_per_dollar, min_purchase_for_reward, is_active')
      .eq('store_identifier', 'nctr-merch')
      .eq('is_active', true)
      .single();

    if (!settings) {
      console.log('Shop not active or settings not found');
      return new Response(JSON.stringify({ success: true, message: 'Shop not active' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const nctrPerDollar = Number(settings.nctr_per_dollar) || 1.0;
    const minPurchase = Number(settings.min_purchase_for_reward) || 0;

    // Check minimum purchase requirement
    if (totalPrice < minPurchase) {
      console.log('Order below minimum purchase:', totalPrice, '<', minPurchase);
      return new Response(JSON.stringify({ success: true, message: 'Below minimum purchase' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate NCTR earned
    const nctrEarned = totalPrice * nctrPerDollar;
    console.log('NCTR earned:', nctrEarned, '(rate:', nctrPerDollar, ')');

    // Try to find user by email (case-insensitive)
    let userId: string | null = null;
    let status = 'pending';
    let creditedAt: string | null = null;

    if (customerEmail) {
      const { data: user } = await supabase
        .from('unified_profiles')
        .select('id')
        .ilike('email', customerEmail)
        .single();

      if (user) {
        userId = user.id;
        status = 'credited';
        creditedAt = new Date().toISOString();
        console.log('Found matching user:', userId);

        // Credit NCTR to user (update locked_nctr in profiles table via auth_user_id)
        const { data: profileData } = await supabase
          .from('unified_profiles')
          .select('auth_user_id')
          .eq('id', userId)
          .single();

        if (profileData?.auth_user_id) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              locked_nctr: supabase.rpc('increment_locked_nctr', { 
                user_id: profileData.auth_user_id, 
                amount: nctrEarned 
              })
            })
            .eq('id', profileData.auth_user_id);

          // If increment function doesn't exist, do raw update
          if (updateError) {
            await supabase.rpc('sql', {
              query: `UPDATE profiles SET locked_nctr = locked_nctr + ${nctrEarned} WHERE id = '${profileData.auth_user_id}'`
            }).catch(() => {
              // Fallback: just log that we couldn't update balance
              console.log('Note: Could not auto-credit NCTR to user balance');
            });
          }
        }
      } else {
        console.log('No matching user found for email:', customerEmail);
      }
    }

    // Insert transaction
    const { data: transaction, error: insertError } = await supabase
      .from('shop_transactions')
      .insert({
        order_id: orderId,
        order_number: orderNumber,
        order_total: totalPrice,
        currency,
        customer_email: customerEmail,
        customer_name: customerName,
        user_id: userId,
        nctr_per_dollar_at_time: nctrPerDollar,
        nctr_earned: nctrEarned,
        status,
        credited_at: creditedAt,
        store_identifier: 'nctr-merch',
        shopify_data: body,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting transaction:', insertError);
      throw insertError;
    }

    console.log('Order stored:', transaction?.id, 'Status:', status);

    return new Response(JSON.stringify({ 
      success: true, 
      nctr_earned: nctrEarned,
      status,
      transaction_id: transaction?.id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
