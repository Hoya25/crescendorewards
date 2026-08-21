-- Accepts either identifier space (auth user id or unified profile id) for "self".
CREATE OR REPLACE FUNCTION public.is_self_or_admin(p_subject uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    p_subject = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.unified_profiles
      WHERE id = p_subject AND auth_user_id = auth.uid()
    )
    OR public.is_current_user_admin()
  );
$$;

REVOKE ALL ON FUNCTION public.is_self_or_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_self_or_admin(uuid) TO authenticated, service_role;

-- 1. get_all_claims: admin only
CREATE OR REPLACE FUNCTION public.get_all_claims()
RETURNS TABLE(claim_id uuid, user_id uuid, user_email text, user_name text, reward_id uuid, reward_title text, reward_cost integer, status text, claimed_at timestamp with time zone, shipping_info jsonb, delivery_method text, delivery_status text, delivery_data jsonb, delivered_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  SELECT rc.id, rc.user_id, p.email, p.full_name, rc.reward_id, r.title, r.cost,
         rc.status, rc.claimed_at, rc.shipping_info, rc.delivery_method,
         rc.delivery_status, rc.delivery_data, rc.delivered_at
  FROM rewards_claims rc
  JOIN profiles p ON p.id = rc.user_id
  JOIN rewards r ON r.id = rc.reward_id
  ORDER BY rc.claimed_at DESC;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_all_claims() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_all_claims() TO authenticated, service_role;

-- 2. get_user_wishlist
CREATE OR REPLACE FUNCTION public.get_user_wishlist(p_user_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(wishlist_id uuid, user_id uuid, user_email text, user_name text, reward_id uuid, reward_title text, reward_cost integer, reward_image text, reward_category text, notes text, added_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_user_id IS NULL THEN
    IF NOT public.is_current_user_admin() THEN
      RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    RETURN QUERY
    SELECT w.id, w.user_id, p.email, p.full_name, w.reward_id, r.title, r.cost,
           r.image_url, r.category, w.notes, w.created_at
    FROM reward_wishlists w
    JOIN profiles p ON p.id = w.user_id
    JOIN rewards r ON r.id = w.reward_id
    ORDER BY p.full_name, w.created_at DESC;
  ELSE
    IF NOT public.is_self_or_admin(p_user_id) THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    SELECT w.id, w.user_id, p.email, p.full_name, w.reward_id, r.title, r.cost,
           r.image_url, r.category, w.notes, w.created_at
    FROM reward_wishlists w
    JOIN profiles p ON p.id = w.user_id
    JOIN rewards r ON r.id = w.reward_id
    WHERE w.user_id = p_user_id
    ORDER BY w.created_at DESC;
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_user_wishlist(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_wishlist(uuid) TO authenticated, service_role;

-- 3. get_unified_user_profile
CREATE OR REPLACE FUNCTION public.get_unified_user_profile(p_auth_user_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_subject uuid := COALESCE(p_auth_user_id, auth.uid());
  v_profile unified_profiles;
  v_tier status_tiers;
  v_portfolio_data jsonb;
  v_total_360_locked numeric;
BEGIN
  IF v_subject IS NULL OR NOT public.is_self_or_admin(v_subject) THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  SELECT * INTO v_profile FROM unified_profiles WHERE auth_user_id = v_subject;

  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  SELECT * INTO v_tier FROM status_tiers WHERE id = v_profile.current_tier_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id', wp.id,
           'wallet_address', wp.wallet_address,
           'nctr_balance', COALESCE(wp.nctr_balance, 0),
           'nctr_360_locked', COALESCE(wp.nctr_360_locked, 0),
           'nctr_90_locked', COALESCE(wp.nctr_90_locked, 0),
           'nctr_unlocked', COALESCE(wp.nctr_unlocked, 0),
           'locks', COALESCE(wp.locks, '[]'::jsonb),
           'last_synced_at', wp.last_synced_at,
           'sync_source', wp.sync_source
         )), '[]'::jsonb),
         COALESCE(SUM(wp.nctr_360_locked), 0)
  INTO v_portfolio_data, v_total_360_locked
  FROM wallet_portfolio wp
  WHERE wp.user_id = v_profile.id;

  RETURN jsonb_build_object(
    'id', v_profile.id,
    'auth_user_id', v_profile.auth_user_id,
    'email', v_profile.email,
    'display_name', v_profile.display_name,
    'avatar_url', v_profile.avatar_url,
    'wallet_address', v_profile.wallet_address,
    'portfolio', jsonb_build_object(
      'wallets', v_portfolio_data,
      'total_360_locked', v_total_360_locked,
      'total_90_locked', (SELECT COALESCE(SUM(nctr_90_locked), 0) FROM wallet_portfolio WHERE user_id = v_profile.id),
      'total_balance', (SELECT COALESCE(SUM(nctr_balance), 0) FROM wallet_portfolio WHERE user_id = v_profile.id),
      'total_unlocked', (SELECT COALESCE(SUM(nctr_unlocked), 0) FROM wallet_portfolio WHERE user_id = v_profile.id)
    ),
    'status', CASE WHEN v_tier IS NOT NULL THEN jsonb_build_object(
      'tier_id', v_tier.id,
      'tier_name', v_tier.tier_name,
      'display_name', v_tier.display_name,
      'badge_emoji', v_tier.badge_emoji,
      'badge_color', v_tier.badge_color,
      'min_nctr_360_locked', v_tier.min_nctr_360_locked,
      'max_nctr_360_locked', v_tier.max_nctr_360_locked,
      'benefits', v_tier.benefits,
      'sort_order', v_tier.sort_order
    ) ELSE NULL END,
    'crescendo', jsonb_build_object(
      'claims_balance', COALESCE((v_profile.crescendo_data->>'claims_balance')::integer, 0),
      'data', COALESCE(v_profile.crescendo_data, '{}'::jsonb)
    ),
    'garden', jsonb_build_object('data', COALESCE(v_profile.garden_data, '{}'::jsonb)),
    'created_at', v_profile.created_at,
    'updated_at', v_profile.updated_at,
    'last_active_garden', v_profile.last_active_garden,
    'last_active_crescendo', v_profile.last_active_crescendo
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_unified_user_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_unified_user_profile(uuid) TO authenticated, service_role;

-- 4. get_user_activity
CREATE OR REPLACE FUNCTION public.get_user_activity(p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(id uuid, activity_type text, title text, description text, amount numeric, created_at timestamp with time zone, metadata jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_subject uuid := COALESCE(p_user_id, auth.uid());
BEGIN
  IF v_subject IS NULL OR NOT public.is_self_or_admin(v_subject) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT rc.id, 'reward_claim'::TEXT, 'Claimed ' || r.title, 'Reward redeemed',
         r.cost::NUMERIC, rc.claimed_at,
         jsonb_build_object('reward_id', r.id, 'reward_image', r.image_url)
  FROM rewards_claims rc
  JOIN rewards r ON r.id = rc.reward_id
  WHERE rc.user_id = v_subject
  UNION ALL
  SELECT p.id, 'purchase'::TEXT, 'Purchased ' || p.claims_amount || ' Claims',
         p.package_name, p.amount_paid::NUMERIC, p.created_at,
         jsonb_build_object('package_id', p.package_id)
  FROM purchases p
  WHERE p.user_id = v_subject AND p.status = 'completed'
  UNION ALL
  SELECT mh.id, 'tier_change'::TEXT, 'Reached ' || mh.tier_name || ' Status',
         COALESCE('Upgraded from ' || mh.previous_tier_name, 'Started membership'),
         mh.locked_nctr::NUMERIC, mh.created_at,
         jsonb_build_object('tier_level', mh.tier_level, 'previous_tier', mh.previous_tier_name)
  FROM membership_history mh
  WHERE mh.user_id = v_subject
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_user_activity(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_activity(uuid, integer) TO authenticated, service_role;

-- 5. get_user_journey_stats: admin only
CREATE OR REPLACE FUNCTION public.get_user_journey_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  RETURN jsonb_build_object(
    'total_sessions', (SELECT COUNT(*) FROM user_sessions WHERE user_id = p_user_id),
    'total_page_views', (SELECT COUNT(*) FROM user_activity WHERE user_id = p_user_id AND event_type = 'page_view'),
    'total_clicks', (SELECT COUNT(*) FROM user_activity WHERE user_id = p_user_id AND event_type = 'click'),
    'total_actions', (SELECT COUNT(*) FROM user_activity WHERE user_id = p_user_id AND event_type = 'action'),
    'avg_session_duration', (SELECT COALESCE(AVG(duration_seconds), 0) FROM user_sessions WHERE user_id = p_user_id AND duration_seconds IS NOT NULL),
    'total_time_seconds', (SELECT COALESCE(SUM(duration_seconds), 0) FROM user_sessions WHERE user_id = p_user_id),
    'first_seen', (SELECT MIN(created_at) FROM user_activity WHERE user_id = p_user_id),
    'last_seen', (SELECT MAX(created_at) FROM user_activity WHERE user_id = p_user_id),
    'rewards_claimed', (SELECT COUNT(*) FROM rewards_claims rc JOIN unified_profiles up ON rc.user_id = up.auth_user_id WHERE up.id = p_user_id),
    'referrals_made', (SELECT COUNT(*) FROM referrals r JOIN unified_profiles up ON r.referrer_id = up.auth_user_id WHERE up.id = p_user_id)
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_user_journey_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_journey_stats(uuid) TO authenticated, service_role;

-- 6. get_referral_leaderboard: subject derived from session; parameter has no authority
CREATE OR REPLACE FUNCTION public.get_referral_leaderboard(p_user_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_self uuid := auth.uid();
  v_month_start date := date_trunc('month', now())::date;
  v_month_year text := to_char(now(), 'YYYY-MM');
  v_top_10 jsonb;
  v_user_entry jsonb;
BEGIN
  IF v_self IS NULL THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  WITH monthly_referrals AS (
    SELECT r.referrer_id, up.display_name,
           COUNT(*) AS referral_count,
           COUNT(*) FILTER (WHERE r.is_paid = true) AS paid_referrals
    FROM referrals r
    JOIN unified_profiles up ON up.auth_user_id = r.referrer_id
    WHERE r.created_at >= v_month_start
      AND up.leaderboard_opt_in = true
      AND NOT public.is_fixture_member(up.auth_user_id)
    GROUP BY r.referrer_id, up.display_name
  ),
  ranked AS (
    SELECT referrer_id, display_name, referral_count, paid_referrals,
           ROW_NUMBER() OVER (ORDER BY referral_count DESC, paid_referrals DESC) AS rank
    FROM monthly_referrals
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'rank', rank,
           'display_name', display_name,
           'referral_count', referral_count,
           'paid_referrals', paid_referrals,
           'is_current_user', (referrer_id = v_self)
         ) ORDER BY rank), '[]'::jsonb)
  INTO v_top_10
  FROM ranked
  WHERE rank <= 10;

  WITH monthly_referrals AS (
    SELECT r.referrer_id, up.display_name, up.leaderboard_opt_in,
           COUNT(*) AS referral_count,
           COUNT(*) FILTER (WHERE r.is_paid = true) AS paid_referrals
    FROM referrals r
    JOIN unified_profiles up ON up.auth_user_id = r.referrer_id
    WHERE r.created_at >= v_month_start
      AND up.leaderboard_opt_in = true
    GROUP BY r.referrer_id, up.display_name, up.leaderboard_opt_in
  ),
  ranked AS (
    SELECT referrer_id, display_name, leaderboard_opt_in, referral_count, paid_referrals,
           ROW_NUMBER() OVER (ORDER BY referral_count DESC, paid_referrals DESC) AS rank
    FROM monthly_referrals
  )
  SELECT jsonb_build_object(
           'rank', rank, 'display_name', display_name,
           'referral_count', referral_count, 'paid_referrals', paid_referrals,
           'opted_in', leaderboard_opt_in)
  INTO v_user_entry
  FROM ranked
  WHERE referrer_id = v_self;

  IF v_user_entry IS NULL THEN
    SELECT jsonb_build_object(
             'rank', NULL, 'display_name', up.display_name,
             'referral_count', 0, 'paid_referrals', 0,
             'opted_in', up.leaderboard_opt_in)
    INTO v_user_entry
    FROM unified_profiles up
    WHERE up.auth_user_id = v_self;
  END IF;

  RETURN jsonb_build_object(
    'top_10', v_top_10,
    'current_user', COALESCE(v_user_entry, '{}'::jsonb),
    'month', v_month_year,
    'bonus_nctr', 5000
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_referral_leaderboard(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_referral_leaderboard(uuid) TO authenticated, service_role;