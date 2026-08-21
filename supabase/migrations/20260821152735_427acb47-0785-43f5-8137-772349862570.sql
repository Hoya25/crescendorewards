-- ============================================================
-- 1. Guard trigger: block client-side writes to server-owned columns
-- ============================================================
CREATE OR REPLACE FUNCTION public.block_client_financial_writes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_role text := current_user;
BEGIN
  -- Only constrain the two Data API roles. service_role / postgres / owners of
  -- SECURITY DEFINER functions run with a different current_user and pass through.
  IF v_role NOT IN ('anon', 'authenticated') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Verified admins may adjust balances (their actions are audited elsewhere).
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_TABLE_NAME = 'nctr_transactions' THEN
    RAISE EXCEPTION 'nctr_transactions is server-owned and cannot be written by clients';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'wallet_portfolio' THEN
      NEW.nctr_balance := 0;
      NEW.nctr_360_locked := 0;
      NEW.nctr_90_locked := 0;
      NEW.nctr_unlocked := 0;
      NEW.locks := '[]'::jsonb;
      NEW.sync_source := 'client_registration';
    ELSIF TG_TABLE_NAME = 'unified_profiles' THEN
      NEW.nctr_balance_points := 0;
      NEW.nctr_locked_points := 0;
      NEW.nctr_earned_total := 0;
      NEW.wallet_verified := false;
      NEW.wallet_verified_at := NULL;
      NEW.signup_bonus_awarded := false;
      NEW.tier_override := NULL;
      NEW.tier_override_by := NULL;
      NEW.tier_override_at := NULL;
    ELSIF TG_TABLE_NAME = 'user_onboarding' THEN
      NEW.onboarding_nctr_awarded := 0;
    ELSIF TG_TABLE_NAME = 'profiles' THEN
      NEW.available_nctr := 0;
      NEW.locked_nctr := 0;
      NEW.total_locked_nctr := 0;
      NEW.claim_balance := 0;
      NEW.has_claimed_signup_bonus := false;
      NEW.wallet_verified_at := NULL;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE: reject any change to a server-owned column
  IF TG_TABLE_NAME = 'wallet_portfolio' THEN
    IF NEW.nctr_balance IS DISTINCT FROM OLD.nctr_balance
       OR NEW.nctr_360_locked IS DISTINCT FROM OLD.nctr_360_locked
       OR NEW.nctr_90_locked IS DISTINCT FROM OLD.nctr_90_locked
       OR NEW.nctr_unlocked IS DISTINCT FROM OLD.nctr_unlocked
       OR NEW.locks IS DISTINCT FROM OLD.locks THEN
      RAISE EXCEPTION 'NCTR balances are server-owned and cannot be modified by clients';
    END IF;
  ELSIF TG_TABLE_NAME = 'unified_profiles' THEN
    IF NEW.nctr_balance_points IS DISTINCT FROM OLD.nctr_balance_points
       OR NEW.nctr_locked_points IS DISTINCT FROM OLD.nctr_locked_points
       OR NEW.nctr_earned_total IS DISTINCT FROM OLD.nctr_earned_total
       OR NEW.current_tier_id IS DISTINCT FROM OLD.current_tier_id
       OR NEW.tier_override IS DISTINCT FROM OLD.tier_override
       OR NEW.tier_override_by IS DISTINCT FROM OLD.tier_override_by
       OR NEW.tier_override_at IS DISTINCT FROM OLD.tier_override_at
       OR NEW.wallet_verified IS DISTINCT FROM OLD.wallet_verified
       OR NEW.wallet_verified_at IS DISTINCT FROM OLD.wallet_verified_at
       OR NEW.signup_bonus_awarded IS DISTINCT FROM OLD.signup_bonus_awarded
       OR NEW.nctr_lock_expires_at IS DISTINCT FROM OLD.nctr_lock_expires_at
       OR NEW.nctr_lock_duration_days IS DISTINCT FROM OLD.nctr_lock_duration_days
       OR NEW.onchain_vesting_synced IS DISTINCT FROM OLD.onchain_vesting_synced
       OR NEW.onchain_vesting_contract IS DISTINCT FROM OLD.onchain_vesting_contract
       OR NEW.bh_user_id IS DISTINCT FROM OLD.bh_user_id THEN
      RAISE EXCEPTION 'Balance, tier and wallet-verification fields are server-owned and cannot be modified by clients';
    END IF;
  ELSIF TG_TABLE_NAME = 'user_onboarding' THEN
    IF NEW.onboarding_nctr_awarded IS DISTINCT FROM OLD.onboarding_nctr_awarded THEN
      RAISE EXCEPTION 'Onboarding awards are server-owned; use award_onboarding_item()';
    END IF;
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    IF NEW.available_nctr IS DISTINCT FROM OLD.available_nctr
       OR NEW.locked_nctr IS DISTINCT FROM OLD.locked_nctr
       OR NEW.total_locked_nctr IS DISTINCT FROM OLD.total_locked_nctr
       OR NEW.claim_balance IS DISTINCT FROM OLD.claim_balance
       OR NEW.has_claimed_signup_bonus IS DISTINCT FROM OLD.has_claimed_signup_bonus
       OR NEW.has_status_access_pass IS DISTINCT FROM OLD.has_status_access_pass
       OR NEW.wallet_verified_at IS DISTINCT FROM OLD.wallet_verified_at THEN
      RAISE EXCEPTION 'Balances, claims and wallet verification are server-owned and cannot be modified by clients';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_client_writes ON public.wallet_portfolio;
CREATE TRIGGER guard_client_writes
BEFORE INSERT OR UPDATE ON public.wallet_portfolio
FOR EACH ROW EXECUTE FUNCTION public.block_client_financial_writes();

DROP TRIGGER IF EXISTS guard_client_writes ON public.unified_profiles;
CREATE TRIGGER guard_client_writes
BEFORE INSERT OR UPDATE ON public.unified_profiles
FOR EACH ROW EXECUTE FUNCTION public.block_client_financial_writes();

DROP TRIGGER IF EXISTS guard_client_writes ON public.user_onboarding;
CREATE TRIGGER guard_client_writes
BEFORE INSERT OR UPDATE ON public.user_onboarding
FOR EACH ROW EXECUTE FUNCTION public.block_client_financial_writes();

DROP TRIGGER IF EXISTS guard_client_writes ON public.profiles;
CREATE TRIGGER guard_client_writes
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.block_client_financial_writes();

DROP TRIGGER IF EXISTS guard_client_writes ON public.nctr_transactions;
CREATE TRIGGER guard_client_writes
BEFORE INSERT OR UPDATE OR DELETE ON public.nctr_transactions
FOR EACH ROW EXECUTE FUNCTION public.block_client_financial_writes();

-- ============================================================
-- 2. claim_signup_bonus() — idempotent 25 NCTR + 5 Claims
-- ============================================================
CREATE OR REPLACE FUNCTION public.claim_signup_bonus()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth uuid := auth.uid();
  v_profile public.unified_profiles;
BEGIN
  IF v_auth IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO v_profile
  FROM public.unified_profiles
  WHERE auth_user_id = v_auth
  FOR UPDATE;

  IF v_profile.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'profile_not_found');
  END IF;

  IF COALESCE(v_profile.signup_bonus_awarded, false) THEN
    RETURN jsonb_build_object('success', true, 'awarded', false, 'reason', 'already_awarded');
  END IF;

  UPDATE public.unified_profiles
  SET signup_bonus_awarded = true,
      has_completed_onboarding = true,
      nctr_balance_points = COALESCE(nctr_balance_points, 0) + 25,
      updated_at = now()
  WHERE id = v_profile.id;

  UPDATE public.profiles
  SET has_claimed_signup_bonus = true,
      claim_balance = COALESCE(claim_balance, 0) + 5,
      updated_at = now()
  WHERE id = v_auth;

  INSERT INTO public.nctr_transactions (
    user_id, source, base_amount, status_multiplier, merch_lock_multiplier,
    final_amount, notes, lock_type
  ) VALUES (
    v_profile.id, 'signup_bonus', 25, 1, 1, 25,
    'Welcome to Crescendo — 25 NCTR + 5 Claims', '360lock'
  );

  INSERT INTO public.cross_platform_activity_log (user_id, platform, action_type, action_data)
  VALUES (v_profile.id, 'crescendo', 'signup_bonus',
    jsonb_build_object('amount', 25, 'type', 'signup_bonus', 'nctr', 25, 'claims', 5,
                       'description', 'Welcome to Crescendo'));

  RETURN jsonb_build_object('success', true, 'awarded', true, 'nctr', 25, 'claims', 5);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_signup_bonus() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_signup_bonus() TO authenticated;

-- ============================================================
-- 3. award_onboarding_item(p_item) — server-defined amounts only
-- ============================================================
CREATE OR REPLACE FUNCTION public.award_onboarding_item(p_item text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth uuid := auth.uid();
  v_profile_id uuid;
  v_amount integer;
  v_already boolean;
BEGIN
  IF v_auth IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  v_amount := CASE p_item
    WHEN 'profile_completed'   THEN 10
    WHEN 'first_wishlist_item' THEN 10
    WHEN 'first_referral'      THEN 50
    ELSE NULL
  END;

  IF v_amount IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_item');
  END IF;

  SELECT id INTO v_profile_id
  FROM public.unified_profiles
  WHERE auth_user_id = v_auth;

  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'profile_not_found');
  END IF;

  INSERT INTO public.user_onboarding (user_id)
  VALUES (v_profile_id)
  ON CONFLICT (user_id) DO NOTHING;

  EXECUTE format('SELECT COALESCE(%I, false) FROM public.user_onboarding WHERE user_id = $1 FOR UPDATE', p_item)
  INTO v_already USING v_profile_id;

  IF v_already THEN
    RETURN jsonb_build_object('success', true, 'awarded', false, 'reason', 'already_awarded');
  END IF;

  EXECUTE format(
    'UPDATE public.user_onboarding
       SET %I = true, %I = now(),
           onboarding_nctr_awarded = COALESCE(onboarding_nctr_awarded, 0) + $2,
           updated_at = now()
     WHERE user_id = $1',
    p_item, p_item || '_at'
  ) USING v_profile_id, v_amount;

  UPDATE public.profiles
  SET available_nctr = COALESCE(available_nctr, 0) + v_amount,
      updated_at = now()
  WHERE id = v_auth;

  INSERT INTO public.nctr_transactions (
    user_id, source, base_amount, status_multiplier, merch_lock_multiplier,
    final_amount, notes, lock_type
  ) VALUES (
    v_profile_id, 'onboarding', v_amount, 1, 1, v_amount,
    'Onboarding step: ' || p_item, '360lock'
  );

  RETURN jsonb_build_object('success', true, 'awarded', true, 'item', p_item, 'nctr', v_amount);
END;
$$;

REVOKE ALL ON FUNCTION public.award_onboarding_item(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_onboarding_item(text) TO authenticated;

-- ============================================================
-- 4. register_wallet_address(p_wallet) — never marks verified
-- ============================================================
CREATE OR REPLACE FUNCTION public.register_wallet_address(p_wallet text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth uuid := auth.uid();
  v_wallet text;
BEGIN
  IF v_auth IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  IF p_wallet IS NULL THEN
    UPDATE public.profiles
    SET registered_wallet_address = NULL, wallet_verified_at = NULL, updated_at = now()
    WHERE id = v_auth;
    RETURN jsonb_build_object('success', true, 'wallet_address', NULL);
  END IF;

  v_wallet := lower(trim(p_wallet));

  IF v_wallet !~ '^0x[a-f0-9]{40}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_wallet_address');
  END IF;

  UPDATE public.profiles
  SET registered_wallet_address = v_wallet,
      wallet_verified_at = NULL,
      updated_at = now()
  WHERE id = v_auth;

  RETURN jsonb_build_object('success', true, 'wallet_address', v_wallet, 'verified', false);
END;
$$;

REVOKE ALL ON FUNCTION public.register_wallet_address(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_wallet_address(text) TO authenticated;