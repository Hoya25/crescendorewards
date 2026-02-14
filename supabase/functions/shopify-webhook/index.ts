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

// Get user's tier multiplier from status_tiers
async function getUserTierMultiplier(supabase: any, userId: string): Promise<{ tierName: string; earningMultiplier: number; tierId: string | null }> {
  const { data: userProfile } = await supabase
    .from('unified_profiles')
    .select('current_tier_id')
    .eq('id', userId)
    .single();

  if (!userProfile?.current_tier_id) {
    return { tierName: 'bronze', earningMultiplier: 1.0, tierId: null };
  }

  const { data: tierData } = await supabase
    .from('status_tiers')
    .select('id, tier_name, earning_multiplier')
    .eq('id', userProfile.current_tier_id)
    .single();

  return {
    tierName: tierData?.tier_name?.toLowerCase() || 'bronze',
    earningMultiplier: Number(tierData?.earning_multiplier) || 1.0,
    tierId: tierData?.id || null,
  };
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
  const accessibleStatuses: (string | null)[] = [null];
  const tierHierarchy = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const tierIndex = tierHierarchy.indexOf(tierName);
  
  for (let i = 0; i <= tierIndex; i++) {
    accessibleStatuses.push(tierHierarchy[i]);
  }

  const { count: totalMerchBounties } = await supabase
    .from('bounties')
    .select('id', { count: 'exact' })
    .eq('is_active', true)
    .eq('requires_purchase', true)
    .in('bounty_tier', ['merch_tier1', 'merch_tier2', 'merch_tier3', 'merch_recurring']);

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

// HMAC verification for Shopify webhook authenticity
async function verifyShopifyWebhook(req: Request, rawBody: string): Promise<boolean> {
  const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
  if (!hmacHeader) return false;

  const secret = Deno.env.get('SHOPIFY_WEBHOOK_SECRET');
  if (!secret) {
    console.error('SHOPIFY_WEBHOOK_SECRET not configured');
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const computedHmac = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return computedHmac === hmacHeader;
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
    // Read raw body for HMAC verification
    const rawBody = await req.text();

    // Verify HMAC signature
    if (!await verifyShopifyWebhook(req, rawBody)) {
      console.error('HMAC verification failed');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const topic = req.headers.get('x-shopify-topic');
    console.log('Webhook received (verified), topic:', topic);

    // Only process orders/paid events
    if (topic !== 'orders/paid') {
      console.log('Ignoring non-orders/paid topic:', topic);
      return new Response(JSON.stringify({ success: true, message: 'Topic ignored' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = JSON.parse(rawBody);
    console.log('Processing order:', body.id, 'Order number:', body.order_number);

    // Extract order data
    const orderId = String(body.id);
    const orderNumber = body.order_number ? String(body.order_number) : null;
    const totalPrice = parseFloat(body.total_price || '0');
    const currency = body.currency || 'USD';
    
    const productNames = (body.line_items || [])
      .map((item: any) => item.title || item.name)
      .filter(Boolean)
      .join(', ');
    
    const customerEmail = body.email || 
      body.customer?.email || 
      body.contact_email || 
      null;
    
    const customerFirstName = body.customer?.first_name || '';
    const customerLastName = body.customer?.last_name || '';
    const customerName = [customerFirstName, customerLastName].filter(Boolean).join(' ') || null;

    console.log('Customer:', customerEmail, customerName);

    if (!customerEmail) {
      console.log('No customer email found, storing as pending');
    }

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

    if (totalPrice < minPurchase) {
      console.log('Order below minimum purchase:', totalPrice, '<', minPurchase);
      return new Response(JSON.stringify({ success: true, message: 'Below minimum purchase' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // =====================================================
    // MULTIPLIER CALCULATION
    // =====================================================
    const baseNctr = totalPrice * nctrPerDollar;

    // Merch purchases always get 3x merch 360LOCK bonus
    const merchLockMultiplier = 3.0;

    // Default status multiplier (used if user not found)
    let statusMultiplier = 1.0;
    let tierAtTime = 'bronze';

    // Try to find user by email
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

        // Get user's tier multiplier
        const tierInfo = await getUserTierMultiplier(supabase, userId);
        statusMultiplier = tierInfo.earningMultiplier;
        tierAtTime = tierInfo.tierName;
        console.log('User tier:', tierAtTime, 'multiplier:', statusMultiplier);
      } else {
        console.log('No matching user found for email:', customerEmail);
      }
    }

    // FORMULA: final = base × merch_lock_multiplier × status_multiplier
    const finalNctr = Math.round(baseNctr * merchLockMultiplier * statusMultiplier);
    console.log(`NCTR calc: ${baseNctr} base × ${merchLockMultiplier} merch × ${statusMultiplier} status = ${finalNctr} final`);

    // Credit NCTR to user
    if (status === 'credited' && userId) {
      const { data: profileData } = await supabase
        .from('unified_profiles')
        .select('auth_user_id, crescendo_data')
        .eq('id', userId)
        .single();

      if (profileData?.auth_user_id) {
        // Update profiles table (legacy) - use parameterized Supabase client instead of raw SQL
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('locked_nctr')
          .eq('id', profileData.auth_user_id)
          .single();

        if (currentProfile) {
          await supabase
            .from('profiles')
            .update({ 
              locked_nctr: (currentProfile.locked_nctr || 0) + finalNctr,
              updated_at: new Date().toISOString(),
            })
            .eq('id', profileData.auth_user_id);
        }

        // Update crescendo_data in unified_profiles
        const currentData = profileData.crescendo_data || {};
        const currentLocked = Number((currentData as any)?.locked_nctr) || 0;
        await supabase
          .from('unified_profiles')
          .update({
            crescendo_data: {
              ...currentData,
              locked_nctr: currentLocked + finalNctr,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }

      // Record in nctr_transactions for audit trail
      await supabase.from('nctr_transactions').insert({
        user_id: userId,
        source: 'merch_purchase',
        base_amount: baseNctr,
        status_multiplier: statusMultiplier,
        merch_lock_multiplier: merchLockMultiplier,
        final_amount: finalNctr,
        lock_type: '360lock',
        tier_at_time: tierAtTime,
        notes: `Shopify order #${orderNumber || orderId} — ${productNames}`,
      });
    }

    // Insert shop transaction (use finalNctr as the earned amount)
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
        nctr_earned: finalNctr,
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
        const tierInfo = await getUserTierAndBounties(supabase, userId);
        console.log('User tier info:', tierInfo);

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

        const { data: profileForNotif } = await supabase
          .from('unified_profiles')
          .select('auth_user_id')
          .eq('id', userId)
          .single();

        const authUserId = profileForNotif?.auth_user_id;

        if (authUserId) {
          await supabase.from('notifications').insert({
            user_id: authUserId,
            type: 'merch_bounty_unlock',
            title: '🏆 Merch Bounties Unlocked!',
            message: `Thanks for your purchase! You earned ${finalNctr.toLocaleString()} NCTR (${merchLockMultiplier}x merch × ${statusMultiplier}x ${tierAtTime} status). You have ${tierInfo.accessibleCount} merch bounties available.`,
            metadata: {
              transaction_id: transaction.id,
              bounties_unlocked: tierInfo.accessibleCount,
              total_bounties: tierInfo.totalCount,
              locked_bounties: tierInfo.lockedCount,
              product_name: productNames,
              base_nctr: baseNctr,
              merch_multiplier: merchLockMultiplier,
              status_multiplier: statusMultiplier,
              final_nctr: finalNctr,
              tier_at_time: tierAtTime,
            },
          });

          if (tierInfo.tierName === 'bronze') {
            await supabase.from('notifications').insert({
              user_id: authUserId,
              type: 'status_upgrade_prompt',
              title: '🚀 More Bounties Waiting at Silver',
              message: 'You unlocked Tier 1 merch bounties — complete them with 360LOCK and you are on your way to Silver status (1.25x earning multiplier), which unlocks Tier 2 bounties worth up to 1,500 NCTR each.',
              metadata: {
                current_tier: 'bronze',
                target_tier: 'silver',
                locked_bounties: tierInfo.lockedCount,
              },
            });
          } else if (tierInfo.tierName === 'silver') {
            await supabase.from('notifications').insert({
              user_id: authUserId,
              type: 'status_upgrade_prompt',
              title: '🔥 Tier 3 Bounties Waiting at Gold',
              message: 'You have access to Tier 1 and Tier 2 merch bounties. Keep earning with 360LOCK to reach Gold (1.5x earning multiplier) and unlock Tier 3 campaign bounties worth up to 3,000 NCTR each.',
              metadata: {
                current_tier: 'silver',
                target_tier: 'gold',
                locked_bounties: tierInfo.lockedCount,
              },
            });
          }
        }
      } catch (bountyError) {
        console.error('Error processing merch bounty eligibility:', bountyError);
      }
    }

    // Send email notification with multiplier info
    if (status === 'credited' && userId) {
      await sendNotification(supabaseUrl, 'shop_purchase', userId, null, {
        name: userDisplayName || customerName,
        amount: totalPrice,
        nctr_earned: finalNctr,
        base_nctr: baseNctr,
        merch_multiplier: merchLockMultiplier,
        status_multiplier: statusMultiplier,
        tier: tierAtTime,
        store: 'NCTR Merch',
        order_number: orderNumber,
      });
    } else if (status === 'pending' && customerEmail) {
      await sendNotification(supabaseUrl, 'pending_purchase', null, customerEmail, {
        customer_name: customerName,
        amount: totalPrice,
        nctr_earned: finalNctr,
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      base_nctr: baseNctr,
      merch_lock_multiplier: merchLockMultiplier,
      status_multiplier: statusMultiplier,
      nctr_earned: finalNctr,
      tier: tierAtTime,
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
