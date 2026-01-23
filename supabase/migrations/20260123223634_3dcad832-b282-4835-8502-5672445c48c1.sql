-- =====================================================
-- Security Fix: Referrals RLS and claim_reward validation
-- =====================================================

-- 1. Fix referrals RLS - restrict referred users from seeing who referred them
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;

-- Allow referrers to view referrals they made (not the reverse)
CREATE POLICY "Referrers can view their referrals"
ON public.referrals
FOR SELECT
TO authenticated
USING (auth.uid() = referrer_id);

-- Admin access to view all referrals
CREATE POLICY "Admins can view all referrals"
ON public.referrals
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Update claim_reward function with shipping_info validation
CREATE OR REPLACE FUNCTION public.claim_reward(p_reward_id uuid, p_shipping_info jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_reward RECORD;
  v_current_claims INT;
  v_required_claims INT;
  v_user_tier TEXT;
  v_claim_id UUID;
  v_delivery_method TEXT;
  v_validated_shipping jsonb;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- =====================================================
  -- SECURITY: Validate shipping_info input
  -- =====================================================
  IF p_shipping_info IS NOT NULL THEN
    -- Size limit (10KB max) to prevent data bloat
    IF length(p_shipping_info::text) > 10000 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Shipping information too large');
    END IF;

    -- Validate email if present
    IF p_shipping_info ? 'email' AND p_shipping_info->>'email' IS NOT NULL THEN
      IF p_shipping_info->>'email' !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid email format');
      END IF;
      -- Limit email length
      IF length(p_shipping_info->>'email') > 254 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Email address too long');
      END IF;
    END IF;

    -- Validate shipping name if present
    IF p_shipping_info ? 'shipping_name' AND p_shipping_info->>'shipping_name' IS NOT NULL THEN
      IF length(p_shipping_info->>'shipping_name') > 100 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Shipping name too long');
      END IF;
    END IF;

    -- Validate address lines if present
    IF p_shipping_info ? 'shipping_address_line1' AND p_shipping_info->>'shipping_address_line1' IS NOT NULL THEN
      IF length(p_shipping_info->>'shipping_address_line1') > 200 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Address line 1 too long');
      END IF;
    END IF;
    IF p_shipping_info ? 'shipping_address_line2' AND p_shipping_info->>'shipping_address_line2' IS NOT NULL THEN
      IF length(p_shipping_info->>'shipping_address_line2') > 200 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Address line 2 too long');
      END IF;
    END IF;

    -- Validate city
    IF p_shipping_info ? 'shipping_city' AND p_shipping_info->>'shipping_city' IS NOT NULL THEN
      IF length(p_shipping_info->>'shipping_city') > 100 THEN
        RETURN jsonb_build_object('success', false, 'error', 'City name too long');
      END IF;
    END IF;

    -- Validate zip/postal code
    IF p_shipping_info ? 'shipping_zip' AND p_shipping_info->>'shipping_zip' IS NOT NULL THEN
      IF length(p_shipping_info->>'shipping_zip') > 20 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Postal code too long');
      END IF;
    END IF;

    -- Validate phone if present
    IF p_shipping_info ? 'phone' AND p_shipping_info->>'phone' IS NOT NULL THEN
      IF length(p_shipping_info->>'phone') > 30 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Phone number too long');
      END IF;
    END IF;

    -- Validate wallet address if present
    IF p_shipping_info ? 'wallet_address' AND p_shipping_info->>'wallet_address' IS NOT NULL THEN
      IF length(p_shipping_info->>'wallet_address') > 100 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Wallet address too long');
      END IF;
    END IF;
  END IF;
  -- End of validation
  -- =====================================================

  -- Get reward details
  SELECT * INTO v_reward FROM rewards WHERE id = p_reward_id AND is_active = true;
  IF v_reward IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward not found or inactive');
  END IF;

  -- Get delivery method
  v_delivery_method := COALESCE(v_reward.delivery_method, 'email');

  -- Get user's current claim balance
  SELECT claim_balance INTO v_current_claims FROM profiles WHERE id = v_user_id;
  IF v_current_claims IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  -- Get user's tier for tier-specific pricing
  SELECT st.tier_name INTO v_user_tier
  FROM unified_profiles up
  LEFT JOIN status_tiers st ON up.current_tier_id = st.id
  WHERE up.auth_user_id = v_user_id;

  -- Determine required claims based on tier pricing or default cost
  IF v_reward.status_tier_claims_cost IS NOT NULL AND v_user_tier IS NOT NULL 
     AND v_reward.status_tier_claims_cost ? v_user_tier THEN
    v_required_claims := (v_reward.status_tier_claims_cost->>v_user_tier)::INT;
  ELSE
    v_required_claims := v_reward.cost;
  END IF;

  -- Check if user has enough claims
  IF v_current_claims < v_required_claims THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Insufficient claims',
      'required', v_required_claims,
      'available', v_current_claims
    );
  END IF;

  -- Check stock if applicable
  IF v_reward.stock_quantity IS NOT NULL AND v_reward.stock_quantity <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward out of stock');
  END IF;

  -- Deduct claims from user
  UPDATE profiles 
  SET claim_balance = claim_balance - v_required_claims,
      updated_at = now()
  WHERE id = v_user_id;

  -- Reduce stock if applicable
  IF v_reward.stock_quantity IS NOT NULL THEN
    UPDATE rewards 
    SET stock_quantity = stock_quantity - 1,
        updated_at = now()
    WHERE id = p_reward_id;
  END IF;

  -- Create claim record with validated shipping info
  INSERT INTO rewards_claims (
    user_id, 
    reward_id, 
    status,
    delivery_method,
    shipping_info,
    delivery_status
  )
  VALUES (
    v_user_id, 
    p_reward_id, 
    'pending',
    v_delivery_method,
    CASE 
      WHEN p_shipping_info IS NOT NULL THEN 
        p_shipping_info || jsonb_build_object(
          'claimed_at', now()::text,
          'user_tier', COALESCE(v_user_tier, 'none'),
          'claims_spent', v_required_claims
        )
      ELSE
        jsonb_build_object(
          'claimed_at', now()::text,
          'user_tier', COALESCE(v_user_tier, 'none'),
          'claims_spent', v_required_claims
        )
    END,
    'pending'
  )
  RETURNING id INTO v_claim_id;

  RETURN jsonb_build_object(
    'success', true, 
    'claim_id', v_claim_id,
    'claims_spent', v_required_claims,
    'remaining_claims', v_current_claims - v_required_claims
  );
END;
$function$;