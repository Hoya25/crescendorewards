-- Update claim_reward function to support tier-based pricing
CREATE OR REPLACE FUNCTION public.claim_reward(
  p_reward_id uuid,
  p_shipping_info jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_reward_cost integer;
  v_tier_cost integer;
  v_user_balance integer;
  v_stock integer;
  v_claim_id uuid;
  v_is_sponsored boolean;
  v_tier_claims_cost jsonb;
  v_user_tier text;
  v_unified_profile_id uuid;
  v_tier_name text;
  v_discount integer;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get reward details including tier pricing
  SELECT cost, stock_quantity, is_sponsored, status_tier_claims_cost 
  INTO v_reward_cost, v_stock, v_is_sponsored, v_tier_claims_cost
  FROM rewards
  WHERE id = p_reward_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward not found or inactive');
  END IF;
  
  -- Check stock
  IF v_stock IS NOT NULL AND v_stock <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Out of stock');
  END IF;
  
  -- Get user balance from profiles
  SELECT claim_balance INTO v_user_balance
  FROM profiles
  WHERE id = v_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;
  
  -- Calculate tier-based price if reward is sponsored and has tier pricing
  v_tier_cost := v_reward_cost;
  v_tier_name := 'droplet'; -- default
  
  IF v_is_sponsored = true AND v_tier_claims_cost IS NOT NULL THEN
    -- Get user's current tier from unified_profiles
    SELECT up.id, LOWER(st.tier_name)
    INTO v_unified_profile_id, v_user_tier
    FROM unified_profiles up
    LEFT JOIN status_tiers st ON up.current_tier_id = st.id
    WHERE up.auth_user_id = v_user_id;
    
    IF v_user_tier IS NOT NULL THEN
      v_tier_name := v_user_tier;
      -- Get tier-specific price, fallback to base cost
      v_tier_cost := COALESCE((v_tier_claims_cost->>v_user_tier)::integer, v_reward_cost);
    END IF;
  END IF;
  
  -- Check if user can afford
  IF v_user_balance < v_tier_cost THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Insufficient balance',
      'required', v_tier_cost,
      'balance', v_user_balance
    );
  END IF;
  
  -- Calculate discount for logging
  v_discount := v_reward_cost - v_tier_cost;
  
  -- Deduct balance (using tier-based price)
  UPDATE profiles
  SET claim_balance = claim_balance - v_tier_cost
  WHERE id = v_user_id;
  
  -- Update stock
  IF v_stock IS NOT NULL THEN
    UPDATE rewards
    SET stock_quantity = stock_quantity - 1
    WHERE id = p_reward_id;
  END IF;
  
  -- Create claim with pricing info in shipping_info for audit
  INSERT INTO rewards_claims (user_id, reward_id, shipping_info)
  VALUES (
    v_user_id, 
    p_reward_id, 
    CASE 
      WHEN p_shipping_info IS NOT NULL THEN 
        p_shipping_info || jsonb_build_object(
          'tier_applied', v_tier_name,
          'tier_price', v_tier_cost,
          'base_price', v_reward_cost,
          'discount', v_discount
        )
      ELSE
        jsonb_build_object(
          'tier_applied', v_tier_name,
          'tier_price', v_tier_cost,
          'base_price', v_reward_cost,
          'discount', v_discount
        )
    END
  )
  RETURNING id INTO v_claim_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'claim_id', v_claim_id,
    'new_balance', v_user_balance - v_tier_cost,
    'tier_applied', v_tier_name,
    'tier_price', v_tier_cost,
    'base_price', v_reward_cost,
    'discount', v_discount
  );
END;
$$;