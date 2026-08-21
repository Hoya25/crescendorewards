-- Server-derived admin check: no arguments, identity comes from the session only.
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.admin_users au
      JOIN public.unified_profiles up ON up.id = au.user_id
      WHERE up.auth_user_id = auth.uid() AND au.is_active = true
    )
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated, service_role;

-- 1. admin_gift_reward
CREATE OR REPLACE FUNCTION public.admin_gift_reward(p_user_id uuid, p_reward_id uuid, p_admin_notes text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_reward_cost INTEGER;
  v_reward_title TEXT;
  v_current_balance INTEGER;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  SELECT cost, title INTO v_reward_cost, v_reward_title
  FROM rewards WHERE id = p_reward_id AND is_active = true;

  IF v_reward_cost IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward not found or inactive');
  END IF;

  SELECT claim_balance INTO v_current_balance FROM profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  UPDATE profiles
  SET claim_balance = COALESCE(claim_balance, 0) + v_reward_cost
  WHERE id = p_user_id;

  DELETE FROM reward_wishlists
  WHERE user_id = p_user_id AND reward_id = p_reward_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Successfully gifted ' || v_reward_cost || ' claims for ' || v_reward_title,
    'claims_gifted', v_reward_cost,
    'new_balance', COALESCE(v_current_balance, 0) + v_reward_cost
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_gift_reward(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_gift_reward(uuid, uuid, text) TO authenticated, service_role;

-- 2. update_claim_status
CREATE OR REPLACE FUNCTION public.update_claim_status(p_claim_id uuid, p_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  IF p_status NOT IN ('pending', 'approved', 'shipped', 'completed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid status');
  END IF;

  UPDATE rewards_claims SET status = p_status WHERE id = p_claim_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Claim not found');
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Claim status updated');
END;
$function$;

REVOKE ALL ON FUNCTION public.update_claim_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_claim_status(uuid, text) TO authenticated, service_role;

-- 3. update_claim_delivery_status
CREATE OR REPLACE FUNCTION public.update_claim_delivery_status(p_claim_id uuid, p_delivery_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  IF p_delivery_status NOT IN ('pending', 'processing', 'shipped', 'delivered', 'failed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid delivery status');
  END IF;

  UPDATE rewards_claims
  SET delivery_status = p_delivery_status,
      delivered_at = CASE WHEN p_delivery_status = 'delivered' THEN now() ELSE delivered_at END
  WHERE id = p_claim_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Claim not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.update_claim_delivery_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_claim_delivery_status(uuid, text) TO authenticated, service_role;