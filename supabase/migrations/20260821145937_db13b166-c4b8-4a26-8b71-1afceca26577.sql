-- =====================================================
-- PHASE 1: Tier gate column consolidation
-- Canonical column: rewards.min_tier_required
-- Legacy mirrors (deprecated, Phase 3 drop): min_status_tier, required_status_tier
-- rewards.reward_tier is a CLASSIFICATION (standard/premium/exclusive), NOT a gate.
-- =====================================================

-- 1. Backfill canonical column
UPDATE public.rewards
SET min_tier_required = lower(COALESCE(min_tier_required, min_status_tier, required_status_tier))
WHERE COALESCE(min_tier_required, min_status_tier, required_status_tier) IS NOT NULL;

-- 2. Validity constraint on the canonical column
ALTER TABLE public.rewards DROP CONSTRAINT IF EXISTS rewards_min_tier_required_chk;
ALTER TABLE public.rewards
  ADD CONSTRAINT rewards_min_tier_required_chk
  CHECK (min_tier_required IS NULL OR lower(min_tier_required) IN ('bronze','silver','gold','platinum','diamond'));

-- 2b. Relax legacy capitalised-only checks so the deprecated mirrors accept the
-- normalised lowercase value written by the sync trigger.
ALTER TABLE public.rewards DROP CONSTRAINT IF EXISTS rewards_required_status_tier_check;
ALTER TABLE public.rewards
  ADD CONSTRAINT rewards_required_status_tier_check
  CHECK (required_status_tier IS NULL OR lower(required_status_tier) IN ('bronze','silver','gold','platinum','diamond'));

ALTER TABLE public.reward_submissions DROP CONSTRAINT IF EXISTS reward_submissions_required_status_tier_check;
ALTER TABLE public.reward_submissions
  ADD CONSTRAINT reward_submissions_required_status_tier_check
  CHECK (required_status_tier IS NULL OR lower(required_status_tier) IN ('bronze','silver','gold','platinum','diamond'));

-- 3. Sync trigger: any write to any of the three columns converges on min_tier_required
CREATE OR REPLACE FUNCTION public.sync_reward_tier_gate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_gate text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_gate := COALESCE(NEW.min_tier_required, NEW.min_status_tier, NEW.required_status_tier);
  ELSE
    -- On UPDATE, honour whichever column the caller actually changed.
    IF NEW.min_tier_required IS DISTINCT FROM OLD.min_tier_required THEN
      v_gate := NEW.min_tier_required;
    ELSIF NEW.min_status_tier IS DISTINCT FROM OLD.min_status_tier THEN
      v_gate := NEW.min_status_tier;
    ELSIF NEW.required_status_tier IS DISTINCT FROM OLD.required_status_tier THEN
      v_gate := NEW.required_status_tier;
    ELSE
      v_gate := NEW.min_tier_required;
    END IF;
  END IF;

  v_gate := lower(nullif(btrim(coalesce(v_gate, '')), ''));
  IF v_gate IN ('all', 'none') THEN
    v_gate := NULL;
  END IF;

  NEW.min_tier_required   := v_gate;
  NEW.min_status_tier     := v_gate;
  NEW.required_status_tier := v_gate;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS sync_reward_tier_gate_trg ON public.rewards;
CREATE TRIGGER sync_reward_tier_gate_trg
  BEFORE INSERT OR UPDATE ON public.rewards
  FOR EACH ROW EXECUTE FUNCTION public.sync_reward_tier_gate();

-- 3b. Converge legacy mirrors for existing rows (fires the trigger)
UPDATE public.rewards SET min_tier_required = min_tier_required;

-- 4. Column documentation
COMMENT ON COLUMN public.rewards.min_tier_required IS 'CANONICAL minimum status tier gate. Values: null (open) | bronze | silver | gold | platinum | diamond. Enforced by claim_reward() and the process-claim edge function.';
COMMENT ON COLUMN public.rewards.min_status_tier IS 'DEPRECATED mirror of min_tier_required, kept in sync by sync_reward_tier_gate(). Scheduled for removal.';
COMMENT ON COLUMN public.rewards.required_status_tier IS 'DEPRECATED mirror of min_tier_required, kept in sync by sync_reward_tier_gate(). Scheduled for removal.';
COMMENT ON COLUMN public.rewards.reward_tier IS 'Reward CLASSIFICATION (standard | premium | exclusive) for presentation. NOT an access gate.';

-- 5. claim_reward: gate on the canonical column
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
  v_tier_hierarchy TEXT[] := ARRAY['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  v_user_tier_idx INT;
  v_required_tier_idx INT;
  v_min_tier TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- SECURITY: Validate shipping_info input
  IF p_shipping_info IS NOT NULL THEN
    IF length(p_shipping_info::text) > 10000 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Shipping information too large');
    END IF;
    IF p_shipping_info ? 'email' AND p_shipping_info->>'email' IS NOT NULL THEN
      IF p_shipping_info->>'email' !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid email format');
      END IF;
      IF length(p_shipping_info->>'email') > 254 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Email address too long');
      END IF;
    END IF;
    IF p_shipping_info ? 'shipping_name' AND p_shipping_info->>'shipping_name' IS NOT NULL THEN
      IF length(p_shipping_info->>'shipping_name') > 100 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Shipping name too long');
      END IF;
    END IF;
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
    IF p_shipping_info ? 'shipping_city' AND p_shipping_info->>'shipping_city' IS NOT NULL THEN
      IF length(p_shipping_info->>'shipping_city') > 100 THEN
        RETURN jsonb_build_object('success', false, 'error', 'City name too long');
      END IF;
    END IF;
    IF p_shipping_info ? 'shipping_zip' AND p_shipping_info->>'shipping_zip' IS NOT NULL THEN
      IF length(p_shipping_info->>'shipping_zip') > 20 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Postal code too long');
      END IF;
    END IF;
    IF p_shipping_info ? 'phone' AND p_shipping_info->>'phone' IS NOT NULL THEN
      IF length(p_shipping_info->>'phone') > 30 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Phone number too long');
      END IF;
    END IF;
    IF p_shipping_info ? 'wallet_address' AND p_shipping_info->>'wallet_address' IS NOT NULL THEN
      IF length(p_shipping_info->>'wallet_address') > 100 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Wallet address too long');
      END IF;
    END IF;
  END IF;

  SELECT * INTO v_reward FROM rewards WHERE id = p_reward_id AND is_active = true;
  IF v_reward IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward not found or inactive');
  END IF;

  v_delivery_method := COALESCE(v_reward.delivery_method, 'email');

  SELECT claim_balance INTO v_current_claims FROM profiles WHERE id = v_user_id;
  IF v_current_claims IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  SELECT st.tier_name INTO v_user_tier
  FROM unified_profiles up
  LEFT JOIN status_tiers st ON up.current_tier_id = st.id
  WHERE up.auth_user_id = v_user_id;

  -- =====================================================
  -- CANONICAL TIER GATE: rewards.min_tier_required
  -- =====================================================
  v_min_tier := COALESCE(v_reward.min_tier_required, v_reward.min_status_tier);

  IF v_min_tier IS NOT NULL THEN
    v_required_tier_idx := array_position(v_tier_hierarchy, lower(v_min_tier));
    v_user_tier_idx := array_position(v_tier_hierarchy, lower(COALESCE(v_user_tier, 'bronze')));

    IF v_required_tier_idx IS NOT NULL AND (v_user_tier_idx IS NULL OR v_user_tier_idx < v_required_tier_idx) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'This reward requires ' || initcap(v_min_tier) || ' status or higher. You''re currently ' || initcap(COALESCE(v_user_tier, 'Member')) || ' — keep earning to level up!',
        'required_tier', v_min_tier,
        'current_tier', COALESCE(v_user_tier, 'none')
      );
    END IF;
  END IF;

  -- Per-reward promotional pricing override, else base cost
  IF v_reward.status_tier_claims_cost IS NOT NULL AND v_user_tier IS NOT NULL
     AND v_reward.status_tier_claims_cost ? v_user_tier THEN
    v_required_claims := (v_reward.status_tier_claims_cost->>v_user_tier)::INT;
  ELSE
    v_required_claims := v_reward.cost;
  END IF;

  IF v_current_claims < v_required_claims THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient claims',
      'required', v_required_claims,
      'available', v_current_claims
    );
  END IF;

  IF v_reward.stock_quantity IS NOT NULL AND v_reward.stock_quantity <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward out of stock');
  END IF;

  UPDATE profiles
  SET claim_balance = claim_balance - v_required_claims,
      updated_at = now()
  WHERE id = v_user_id;

  IF v_reward.stock_quantity IS NOT NULL THEN
    UPDATE rewards
    SET stock_quantity = stock_quantity - 1,
        updated_at = now()
    WHERE id = p_reward_id;
  END IF;

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

-- 6. Submission -> reward trigger: write the canonical column only
CREATE OR REPLACE FUNCTION public.create_reward_from_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_reward_id uuid;
  v_gate text;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    v_gate := lower(nullif(btrim(coalesce(NEW.min_status_tier, NEW.required_status_tier, '')), ''));
    IF v_gate IN ('all', 'none') THEN
      v_gate := NULL;
    END IF;

    INSERT INTO public.rewards (
      title,
      description,
      category,
      cost,
      image_url,
      stock_quantity,
      is_active,
      is_featured,
      submission_id,
      floor_usd_amount,
      lock_option,
      multiplier_at_submission,
      claims_required,
      contributor_user_id,
      reward_origin,
      min_tier_required
    )
    VALUES (
      NEW.title,
      NEW.description,
      NEW.category,
      COALESCE(NEW.claims_required, NEW.claim_passes_required, 1),
      NEW.image_url,
      NEW.stock_quantity,
      true,
      false,
      NEW.id,
      NEW.floor_usd_amount,
      NEW.lock_option,
      NEW.multiplier_at_submission,
      COALESCE(NEW.claims_required, NEW.claim_passes_required, 1),
      CASE WHEN NEW.reward_origin = 'contributor' THEN NEW.user_id ELSE NULL END,
      NEW.reward_origin,
      v_gate
    )
    RETURNING id INTO v_reward_id;

    RAISE NOTICE 'Created reward % from submission %', v_reward_id, NEW.id;

    NEW.admin_notes := COALESCE(NEW.admin_notes || E'\n\n', '') ||
                       'Published to marketplace as reward ID: ' || v_reward_id::text;
  END IF;

  RETURN NEW;
END;
$function$;