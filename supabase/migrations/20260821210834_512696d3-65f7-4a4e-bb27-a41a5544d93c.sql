-- 1. claim_handle: identity from session
DROP FUNCTION IF EXISTS public.claim_handle(uuid, text);

CREATE OR REPLACE FUNCTION public.claim_handle(p_handle text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  clean_handle text;
  availability json;
  user_profile record;
  locked_nctr numeric;
  current_tier text;
  last_change record;
  days_since_change integer;
  last_tier_at_change text;
  change_reason text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT id INTO v_user_id FROM unified_profiles WHERE auth_user_id = auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  clean_handle := lower(trim(p_handle));

  availability := check_handle_available(clean_handle);
  IF NOT (availability->>'available')::boolean THEN
    RETURN availability;
  END IF;

  SELECT * INTO user_profile FROM unified_profiles WHERE id = v_user_id;

  SELECT COALESCE(nctr_360_locked, 0) + COALESCE(nctr_90_locked, 0)
  INTO locked_nctr FROM wallet_portfolio WHERE user_id = v_user_id;

  IF locked_nctr IS NULL OR locked_nctr = 0 THEN
    locked_nctr := COALESCE((user_profile.crescendo_data->>'locked_nctr')::numeric, 0);
  END IF;

  IF COALESCE(locked_nctr, 0) < 100 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Bronze status required (100+ NCTR locked). You have ' || COALESCE(locked_nctr, 0)::text || ' locked.',
      'locked_nctr', COALESCE(locked_nctr, 0),
      'required', 100
    );
  END IF;

  IF locked_nctr >= 50000 THEN current_tier := 'diamond';
  ELSIF locked_nctr >= 10000 THEN current_tier := 'platinum';
  ELSIF locked_nctr >= 2000 THEN current_tier := 'gold';
  ELSIF locked_nctr >= 500 THEN current_tier := 'silver';
  ELSE current_tier := 'bronze';
  END IF;

  IF user_profile.handle IS NULL THEN
    change_reason := 'initial_claim';
  ELSE
    SELECT * INTO last_change FROM handle_history
    WHERE user_id = v_user_id ORDER BY changed_at DESC LIMIT 1;

    IF FOUND THEN
      days_since_change := EXTRACT(DAY FROM (now() - last_change.changed_at));
      last_tier_at_change := last_change.tier_at_change;
    ELSE
      days_since_change := 999;
      last_tier_at_change := 'bronze';
    END IF;

    IF current_tier IS DISTINCT FROM COALESCE(last_tier_at_change, 'bronze')
       AND current_tier IN ('silver', 'gold', 'platinum', 'diamond') THEN
      change_reason := 'tier_upgrade';
    ELSIF days_since_change >= 365 THEN
      change_reason := 'annual_change';
    ELSE
      RETURN json_build_object(
        'success', false,
        'error', 'Handle changes available once per year or when you reach a new tier. Next eligible: ' ||
          CASE WHEN days_since_change < 365 THEN (365 - days_since_change)::text || ' days' ELSE 'now' END,
        'days_until_eligible', GREATEST(0, 365 - days_since_change),
        'current_tier', current_tier,
        'last_tier_at_change', last_tier_at_change
      );
    END IF;
  END IF;

  INSERT INTO handle_history (user_id, old_handle, new_handle, reason, tier_at_change)
  VALUES (v_user_id, COALESCE(user_profile.handle, ''), clean_handle, change_reason, current_tier);

  UPDATE unified_profiles SET handle = clean_handle WHERE id = v_user_id;

  IF change_reason = 'initial_claim' THEN
    INSERT INTO nctr_transactions (user_id, base_amount, final_amount, source, notes)
    VALUES (v_user_id, 250, 250, 'bounty', 'Claimed @' || clean_handle || ' handle');
  END IF;

  RETURN json_build_object(
    'success', true,
    'handle', clean_handle,
    'reason', change_reason,
    'message', CASE change_reason
      WHEN 'initial_claim' THEN 'You are now @' || clean_handle || '! +250 NCTR'
      WHEN 'tier_upgrade' THEN 'Handle updated to @' || clean_handle || '! Free change with your new ' || initcap(current_tier) || ' status'
      WHEN 'annual_change' THEN 'Handle updated to @' || clean_handle || '!'
      ELSE 'Handle updated to @' || clean_handle
    END
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_handle(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_handle(text) TO authenticated, service_role;

-- 2. cancel_gift: sender derived from session, or active admin
DROP FUNCTION IF EXISTS public.cancel_gift(uuid, uuid);

CREATE OR REPLACE FUNCTION public.cancel_gift(p_gift_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_gift claim_gifts;
  v_profile_id uuid;
  v_sender_auth_id uuid;
  v_is_admin boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  v_is_admin := public.is_current_user_admin();
  SELECT id INTO v_profile_id FROM unified_profiles WHERE auth_user_id = auth.uid();

  SELECT * INTO v_gift FROM claim_gifts WHERE id = p_gift_id FOR UPDATE;

  IF v_gift IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gift not found');
  END IF;

  IF v_gift.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Can only cancel pending gifts');
  END IF;

  IF NOT v_is_admin AND (v_profile_id IS NULL OR v_gift.sender_id != v_profile_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  UPDATE claim_gifts SET status = 'cancelled' WHERE id = p_gift_id;

  IF NOT v_gift.is_admin_gift AND NOT v_gift.is_purchased THEN
    SELECT auth_user_id INTO v_sender_auth_id FROM unified_profiles WHERE id = v_gift.sender_id;

    UPDATE profiles
    SET claim_balance = COALESCE(claim_balance, 0) + v_gift.claims_amount,
        updated_at = now()
    WHERE id = v_sender_auth_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'refunded', NOT v_gift.is_admin_gift AND NOT v_gift.is_purchased);
END;
$function$;

REVOKE ALL ON FUNCTION public.cancel_gift(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_gift(uuid) TO authenticated, service_role;

-- 3. perform_social_share
DROP FUNCTION IF EXISTS public.perform_social_share(uuid, text);

CREATE OR REPLACE FUNCTION public.perform_social_share(p_platform text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_current_month TEXT := to_char(now(), 'YYYY-MM');
  v_share_count INT;
  v_max_shares INT := 4;
  v_reward INT := 750;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_platform NOT IN ('twitter', 'farcaster', 'telegram') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid platform');
  END IF;

  SELECT COUNT(*) INTO v_share_count
  FROM social_shares
  WHERE user_id = v_user_id AND month_year = v_current_month;

  IF v_share_count >= v_max_shares THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You''ve reached 4 shares this month',
      'shares_this_month', v_share_count,
      'max_shares', v_max_shares
    );
  END IF;

  INSERT INTO social_shares (user_id, platform, month_year)
  VALUES (v_user_id, p_platform, v_current_month);

  UPDATE profiles
  SET locked_nctr = COALESCE(locked_nctr, 0) + v_reward, updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'shares_this_month', v_share_count + 1,
    'max_shares', v_max_shares,
    'reward', v_reward,
    'message', 'Share recorded! 750 NCTR earned (360LOCK)'
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.perform_social_share(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.perform_social_share(text) TO authenticated, service_role;

-- 4. toggle_leaderboard_opt_in
DROP FUNCTION IF EXISTS public.toggle_leaderboard_opt_in(uuid, boolean);

CREATE OR REPLACE FUNCTION public.toggle_leaderboard_opt_in(p_opt_in boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  UPDATE unified_profiles
  SET leaderboard_opt_in = p_opt_in, updated_at = now()
  WHERE auth_user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  RETURN jsonb_build_object('success', true, 'opted_in', p_opt_in);
END;
$function$;

REVOKE ALL ON FUNCTION public.toggle_leaderboard_opt_in(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_leaderboard_opt_in(boolean) TO authenticated, service_role;

-- 5. Already session-derived: revoke anonymous reach only.
REVOKE ALL ON FUNCTION public.save_referral_slug(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_referral_slug(text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.award_onboarding_item(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_onboarding_item(text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.claim_signup_bonus() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_signup_bonus() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.register_wallet_address(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_wallet_address(text) TO authenticated, service_role;