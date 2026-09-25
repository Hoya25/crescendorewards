import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-topic, x-shopify-hmac-sha256, x-shopify-shop-domain',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// BH is the ledger of record for member balances (ruling M7, 2026-09-25).
// Crescendo computes the merch credit (math unchanged until the earn cutover) and hands it
// to BH, which records it once (idempotent on "shopify:<order_id>") and mirrors the new
// balance back into unified_profiles via receive-lock-request.
const BH_CREDIT_URL = 'https://auibudfactqhisvmiotw.supabase.co/functions/v1/receive-crescendo-credit';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type LedgerResult = {
  outcome: 'credited' | 'rejected' | 'retry' | 'skipped_zero';
  http_status: number | null;
  bh_status: string | null;
  bounty_id: string | null;
  mirror: string | null;
  error: string | null;
};

async function creditBhLedger(payload: Record<string, unknown>): Promise<LedgerResult> {
  const base = { http_status: null, bh_status: null, bounty_id: null, mirror: null, error: null };
  const secret = Deno.env.get('CRESCENDO_BH_CREDIT_SECRET');
  if (!secret) {
    return { ...base, outcome: 'retry', error: 'CRESCENDO_BH_CREDIT_SECRET not configured' };
  }
  try {
    const res = await fetch(BH_CREDIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-sync-secret': secret },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    const data: any = await res.json().catch(() => ({}));
    const common = {
      http_status: res.status,
      bh_status: typeof data?.status === 'string' ? data.status : null,
      bounty_id: typeof data?.bounty_id === 'string' ? data.bounty_id : null,
      mirror: typeof data?.mirror === 'string' ? data.mirror : null,
    };
    if (res.ok && (data?.status === 'credited' || data?.status === 'already_credited')) {
      return { ...common, outcome: 'credited', error: null };
    }
    // 400 invalid / 404 member not in BH / 409 identity mismatch: a retry cannot succeed.
    if (res.status === 400 || res.status === 404 || res.status === 409) {
      return { ...common, outcome: 'rejected', error: String(data?.error ?? `http_${res.status}`) };
    }
    return { ...common, outcome: 'retry', error: String(data?.error ?? `http_${res.status}`) };
  } catch (e) {
    return { ...base, outcome: 'retry', error: e instanceof Error ? e.message : String(e) };
  }
}

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
// Resolve the member's TRUE tier at settlement time from their locked balance.
// Balance is the source of truth. current_tier_id is read for divergence logging
// only. Below the lowest active threshold the member is pre_bronze and correctly
// earns 1.0 — Bronze economics require a qualifying lock.
// This function must never write to unified_profiles or status_tiers. Read-only.
async function getUserTierMultiplier(
  supabase: any,
  userId: string
): Promise<{ tierName: string; earningMultiplier: number; tierId: string | null }> {
  const PRE_BRONZE = { tierName: 'pre_bronze', earningMultiplier: 1.0, tierId: null };

  const { data: userProfile, error: profileError } = await supabase
    .from('unified_profiles')
    .select('current_tier_id, nctr_locked_points, tier_override')
    .eq('id', userId)
    .single();

  if (profileError || !userProfile) {
    console.error(`[tier] profile read failed for user ${userId}; settling pre_bronze`, profileError);
    return PRE_BRONZE;
  }

  const { data: tiers, error: tiersError } = await supabase
    .from('status_tiers')
    .select('id, tier_name, earning_multiplier, min_nctr_360_locked')
    .eq('is_active', true)
    .order('min_nctr_360_locked', { ascending: false });

  if (tiersError || !tiers?.length) {
    console.error(`[tier] tier read failed for user ${userId}; settling pre_bronze`, tiersError);
    return PRE_BRONZE;
  }

  const locked = Number(userProfile.nctr_locked_points) || 0;

  const override = userProfile.tier_override
    ? (tiers.find(
        (t: any) =>
          String(t.tier_name).toLowerCase() ===
          String(userProfile.tier_override).toLowerCase()
      ) ?? null)
    : null;

  const earned = tiers.find((t: any) => locked >= Number(t.min_nctr_360_locked));
  const resolved = override ?? earned ?? null;

  const storedTier = tiers.find((t: any) => t.id === userProfile.current_tier_id);
  if ((storedTier?.tier_name ?? null) !== (resolved?.tier_name ?? null)) {
    console.warn(
      `[tier] divergence user=${userId} locked=${locked} stored=${storedTier?.tier_name ?? 'none'} resolved=${resolved?.tier_name ?? 'pre_bronze'}${override ? ' (override)' : ''}`
    );
  }

  if (!resolved) return PRE_BRONZE;

  return {
    tierName: String(resolved.tier_name).toLowerCase(),
    earningMultiplier: Number(resolved.earning_multiplier) || 1.0,
    tierId: resolved.id ?? null,
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
    let tierAtTime = 'pre_bronze';

    // Try to find user by email
    let userId: string | null = null;
    let status = 'pending';
    let creditedAt: string | null = null;
    let userDisplayName: string | null = null;
    let bhUserId: string | null = null;
    let profileEmail: string | null = null;

    if (customerEmail) {
      const { data: user } = await supabase
        .from('unified_profiles')
        .select('id, display_name, email, bh_user_id')
        .ilike('email', customerEmail)
        .single();

      if (user) {
        userId = user.id;
        userDisplayName = user.display_name;
        bhUserId = typeof user.bh_user_id === 'string' && UUID_RE.test(user.bh_user_id) ? user.bh_user_id : null;
        profileEmail = user.email ?? customerEmail;
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

    // =====================================================
    // LEDGER CREDIT — BH first (ruling M7). Crescendo never writes a member balance
    // directly; the BH mirror updates unified_profiles.nctr_locked_points.
    // Order of operations makes Shopify retries safe:
    //   1. credit BH (idempotent on shopify:<order_id>)
    //   2. claim the order in shop_transactions (order_id is unique)
    //   3. write the nctr_transactions audit row and notifications
    // =====================================================
    let ledger: LedgerResult | null = null;
    if (status === 'credited' && userId) {
      if (finalNctr > 0) {
        ledger = await creditBhLedger({
          ...(bhUserId ? { bh_user_id: bhUserId } : { email: profileEmail ?? customerEmail }),
          source_ref: `shopify:${orderId}`,
          nctr_amount: finalNctr,
          order_usd: totalPrice,
          brand_name: 'NCTR Merch',
          order_number: orderNumber ?? orderId,
          tier_at_time: tierAtTime,
          status_multiplier: statusMultiplier,
          merch_multiplier: merchLockMultiplier,
        });
      } else {
        ledger = { outcome: 'skipped_zero', http_status: null, bh_status: null, bounty_id: null, mirror: null, error: null };
      }
      console.log('BH ledger result:', JSON.stringify(ledger));

      if (ledger.outcome === 'retry') {
        // Transient: record nothing, so Shopify's redelivery re-runs this order end to end.
        console.error('BH ledger credit failed (transient); returning 500 for Shopify retry:', ledger.error);
        return new Response(JSON.stringify({ error: 'Ledger credit pending retry' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (ledger.outcome === 'rejected') {
        // Permanent: keep the order visible for reconciliation, credit nothing, notify nobody.
        console.error('BH ledger credit rejected (permanent):', ledger.error);
        status = 'failed';
        creditedAt = null;
      }
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
        ...(ledger ? { metadata: { ledger } } : {}),
      })
      .select('id')
      .single();

    if (insertError) {
      if ((insertError as any).code === '23505') {
        // A concurrent delivery of the same order already recorded it (BH credit is idempotent).
        console.log('Order recorded by a concurrent delivery, skipping:', orderId);
        return new Response(JSON.stringify({ success: true, message: 'Order already processed' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.error('Error inserting transaction:', insertError);
      throw insertError;
    }

    console.log('Order stored:', transaction?.id, 'Status:', status);

    // Record in nctr_transactions for audit trail (after the claim, so a redelivery never duplicates it)
    if (status === 'credited' && userId) {
      const { error: auditError } = await supabase.from('nctr_transactions').insert({
        user_id: userId,
        source: 'merch_purchase',
        base_amount: baseNctr,
        status_multiplier: statusMultiplier,
        merch_lock_multiplier: merchLockMultiplier,
        final_amount: finalNctr,
        lock_type: '360lock',
        tier_at_time: tierAtTime,
        notes: `Shopify order #${orderNumber || orderId} — ${productNames} · BH bounty ${ledger?.bounty_id ?? 'n/a'}`,
      });
      if (auditError) console.error('Error inserting nctr_transactions:', auditError);
    }

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
      transaction_id: transaction?.id,
      ledger,
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
