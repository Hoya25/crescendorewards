
CREATE OR REPLACE FUNCTION public.calculate_user_tier(p_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet_360_locked numeric;
  v_deposit_locked numeric;
  v_total_locked numeric;
  v_tier_id uuid;
  v_auth_user_id uuid;
BEGIN
  -- Get total 360LOCK amount from wallet_portfolio
  SELECT COALESCE(SUM(nctr_360_locked), 0)
  INTO v_wallet_360_locked
  FROM wallet_portfolio
  WHERE user_id = p_user_id;

  -- Get auth_user_id for the unified profile
  SELECT auth_user_id INTO v_auth_user_id
  FROM unified_profiles
  WHERE id = p_user_id;

  -- Get total_locked_nctr from deposits (profiles table)
  SELECT COALESCE(total_locked_nctr, 0)
  INTO v_deposit_locked
  FROM profiles
  WHERE id = v_auth_user_id;

  -- Combine both sources
  v_total_locked := v_wallet_360_locked + v_deposit_locked;

  -- Find matching tier
  SELECT id INTO v_tier_id
  FROM status_tiers
  WHERE is_active = true
    AND min_nctr_360_locked <= v_total_locked
    AND (max_nctr_360_locked IS NULL OR max_nctr_360_locked >= v_total_locked)
  ORDER BY sort_order DESC
  LIMIT 1;

  -- Update user profile
  UPDATE unified_profiles
  SET current_tier_id = v_tier_id,
      tier_calculated_at = now(),
      updated_at = now()
  WHERE id = p_user_id;

  RETURN v_tier_id;
END;
$function$;
