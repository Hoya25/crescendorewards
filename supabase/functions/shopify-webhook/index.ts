import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-topic, x-shopify-hmac-sha256, x-shopify-shop-domain',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper to send notification email
async function sendNotification(supabaseUrl: string, type: string, userId: string | null, email: string | null, data: Record<string, unknown>) {
  try {
    const notificationUrl = `${supabaseUrl}/functions/v1/send-account-notification`;
    
    const response = await fetch(notificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        type,
        user_id: userId,
        email,
        data,
      }),
    });

    if (!response.ok) {
      console.error('Notification send failed:', await response.text());
    } else {
      console.log(`${type} notification sent successfully`);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Determine user's Crescendo tier and accessible bounties
async function getUserTierAndBounties(supabase: any, userId: string) {
  // Get user's current tier
  const { data: userProfile } = await supabase
    .from('unified_profiles')
    .select('current_tier_id')
    .eq('id', userId)
    .single();

  let tierName = 'bronze'; // default
  if (userProfile?.current_tier_id) {
    const { data: tierData } = await supabase
      .from('status_tiers')
      .select('tier_name')
      .eq('id', userProfile.current_tier_id)
      .single();
    if (tierData?.tier_name) {
      tierName = tierData.tier_name.toLowerCase();
    }
  }

  // Determine which status levels this tier can access
  const accessibleStatuses: (string | null)[] = [null]; // All members can access NULL (no requirement)
  const tierHierarchy = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const tierIndex = tierHierarchy.indexOf(tierName);
  
  for (let i = 0; i <= tierIndex; i++) {
    accessibleStatuses.push(tierHierarchy[i]);
  }

  // Count accessible merch bounties
  let query = supabase
    .from('bounties')
    .select('id', { count: 'exact' })
    .eq('is_active', true)
    .eq('requires_purchase', true)
    .in('bounty_tier', ['merch_tier1', 'merch_tier2', 'merch_tier3', 'merch_recurring']);

  const { count: totalMerchBounties } = await supabase
    .from('bounties')
    .select('id', { count: 'exact' })
    .eq('is_active', true)
    .eq('requires_purchase', true)
    .in('bounty_tier', ['merch_tier1', 'merch_tier2', 'merch_tier3', 'merch_recurring']);

  // Count bounties accessible at user's tier
  // Bounties with min_status_required = NULL are accessible to all
  // Bounties with min_status_required <= user's tier are accessible
  const { data: allMerchBounties } = await supabase
    .from('bounties')
    .select('id, min_status_required')
    .eq('is_active', true)
    .eq('requires_purchase', true)
    .in('bounty_tier', ['merch_tier1', 'merch_tier2', 'merch_tier3', 'merch_recurring']);

  let accessibleCount = 0;
  if (allMerchBounties) {
    for (const bounty of allMerchBounties) {
      const req = bounty.min_status_required?.toLowerCase() || null;
      if (req === null || accessibleStatuses.includes(req)) {
        accessibleCount++;
      }
    }
  }

  return {
    tierName,
    tierIndex,
    accessibleCount,
    totalCount: totalMerchBounties || 0,
    lockedCount: (totalMerchBounties || 0) - accessibleCount,
  };
}

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
    
    // Get product names from line items
    const productNames = (body.line_items || [])
      .map((item: any) => item.title || item.name)
      .filter(Boolean)
      .join(', ');
    
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
    let userDisplayName: string | null = null;

    if (customerEmail) {
      const { data: user } = await supabase
        .from('unified_profiles')
        .select('id, display_name')
        .ilike('email', customerEmail)
        .single();

      if (user) {
        userId = user.id;
        userDisplayName = user.display_name;
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

    // =====================================================
    // MERCH BOUNTY ELIGIBILITY + NOTIFICATIONS
    // =====================================================
    if (status === 'credited' && userId && transaction?.id) {
      try {
        // Get user's tier and accessible bounty counts
        const tierInfo = await getUserTierAndBounties(supabase, userId);
        console.log('User tier info:', tierInfo);

        // Insert merch_purchase_bounty_eligibility record
        const { error: eligibilityError } = await supabase
          .from('merch_purchase_bounty_eligibility')
          .insert({
            user_id: userId,
            shop_transaction_id: transaction.id,
            product_name: productNames || 'NCTR Merch',
            purchase_amount: totalPrice,
            bounties_unlocked: tierInfo.accessibleCount,
          });

        if (eligibilityError) {
          console.error('Error inserting bounty eligibility:', eligibilityError);
        } else {
          console.log('Bounty eligibility created:', tierInfo.accessibleCount, 'bounties unlocked');
        }

        // Get auth_user_id for notifications (notifications table uses auth user id)
        const { data: profileForNotif } = await supabase
          .from('unified_profiles')
          .select('auth_user_id')
          .eq('id', userId)
          .single();

        const authUserId = profileForNotif?.auth_user_id;

        if (authUserId) {
          // PRIMARY notification: Merch Bounties Unlocked (all members)
          await supabase.from('notifications').insert({
            user_id: authUserId,
            type: 'merch_bounty_unlock',
            title: '🏆 Merch Bounties Unlocked!',
            message: `Thanks for your purchase! You have ${tierInfo.accessibleCount} merch bounties available. Complete them with 360LOCK to earn 3x NCTR rewards.`,
            metadata: {
              transaction_id: transaction.id,
              bounties_unlocked: tierInfo.accessibleCount,
              total_bounties: tierInfo.totalCount,
              locked_bounties: tierInfo.lockedCount,
              product_name: productNames,
            },
          });

          // STATUS-BASED upgrade prompt notifications
          if (tierInfo.tierName === 'bronze') {
            // Bronze: can access Tier 1, nudge toward Silver
            await supabase.from('notifications').insert({
              user_id: authUserId,
              type: 'status_upgrade_prompt',
              title: '🚀 More Bounties Waiting at Silver',
              message: 'You unlocked Tier 1 merch bounties — complete them with 360LOCK and you are on your way to Silver status, which unlocks Tier 2 bounties worth up to 1,500 NCTR each.',
              metadata: {
                current_tier: 'bronze',
                target_tier: 'silver',
                locked_bounties: tierInfo.lockedCount,
              },
            });
          } else if (tierInfo.tierName === 'silver') {
            // Silver: can access Tier 1 + 2, nudge toward Gold
            await supabase.from('notifications').insert({
              user_id: authUserId,
              type: 'status_upgrade_prompt',
              title: '🔥 Tier 3 Bounties Waiting at Gold',
              message: 'You have access to Tier 1 and Tier 2 merch bounties. Keep earning with 360LOCK to reach Gold and unlock Tier 3 campaign bounties worth up to 3,000 NCTR each.',
              metadata: {
                current_tier: 'silver',
                target_tier: 'gold',
                locked_bounties: tierInfo.lockedCount,
              },
            });
          }
          // Gold+ members don't get upgrade prompts — they have full access
        }
      } catch (bountyError) {
        console.error('Error processing merch bounty eligibility:', bountyError);
        // Don't fail the whole webhook for bounty errors
      }
    }

    // Send email notification
    if (status === 'credited' && userId) {
      // User exists and was credited - send shop_purchase notification
      await sendNotification(supabaseUrl, 'shop_purchase', userId, null, {
        name: userDisplayName || customerName,
        amount: totalPrice,
        nctr_earned: nctrEarned,
        store: 'NCTR Merch',
        order_number: orderNumber,
      });
    } else if (status === 'pending' && customerEmail) {
      // No matching user - send pending_purchase notification to customer email
      await sendNotification(supabaseUrl, 'pending_purchase', null, customerEmail, {
        customer_name: customerName,
        amount: totalPrice,
        nctr_earned: nctrEarned,
      });
    }

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
