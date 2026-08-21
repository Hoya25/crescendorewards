-- Server-owned Claims spending for Groundball, plus a lock on the JSON balance key.

CREATE OR REPLACE FUNCTION public.groundball_swap_reward(
  p_selection_id uuid,
  p_use_free_swap boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_swap_cost integer := 15;
  v_auth_id uuid := auth.uid();
  v_selection record;
  v_is_giveback boolean := false;
  v_paid boolean := false;
  v_used_free boolean := false;
  v_data jsonb;
  v_balance numeric;
  v_free_remaining integer;
  v_used integer;
BEGIN
  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT s.id, s.member_id, s.reward_id, COALESCE(r.is_giveback, false) AS is_giveback
    INTO v_selection
  FROM public.member_reward_selections s
  LEFT JOIN public.groundball_rewards r ON r.id = s.reward_id
  WHERE s.id = p_selection_id
    AND s.member_id = v_auth_id
    AND s.is_active = true
  FOR UPDATE OF s;

  IF v_selection.id IS NULL THEN
    RAISE EXCEPTION 'Selection not found';
  END IF;

  v_is_giveback := v_selection.is_giveback;

  SELECT COALESCE(free_swaps_remaining, 0), COALESCE(selections_used, 0)
    INTO v_free_remaining, v_used
  FROM public.member_groundball_status
  WHERE member_id = v_auth_id
  FOR UPDATE;

  v_used_free := p_use_free_swap AND NOT v_is_giveback AND COALESCE(v_free_remaining, 0) > 0;
  v_paid := NOT v_is_giveback AND NOT v_used_free;

  IF v_paid THEN
    SELECT COALESCE(crescendo_data, '{}'::jsonb) INTO v_data
    FROM public.unified_profiles
    WHERE auth_user_id = v_auth_id
    FOR UPDATE;

    IF v_data IS NULL THEN
      RAISE EXCEPTION 'Profile not found';
    END IF;

    v_balance := COALESCE((v_data->>'claims_balance')::numeric, (v_data->>'claim_balance')::numeric, 0);

    IF v_balance < v_swap_cost THEN
      RAISE EXCEPTION 'Insufficient Claims. You need % Claims for this swap.', v_swap_cost;
    END IF;

    v_balance := v_balance - v_swap_cost;

    UPDATE public.unified_profiles
    SET crescendo_data = COALESCE(crescendo_data, '{}'::jsonb)
                         || jsonb_build_object('claims_balance', v_balance),
        updated_at = now()
    WHERE auth_user_id = v_auth_id;
  ELSE
    SELECT COALESCE((COALESCE(crescendo_data, '{}'::jsonb)->>'claims_balance')::numeric, 0)
      INTO v_balance
    FROM public.unified_profiles
    WHERE auth_user_id = v_auth_id;
  END IF;

  UPDATE public.member_reward_selections
  SET is_active = false
  WHERE id = p_selection_id;

  IF NOT v_is_giveback THEN
    UPDATE public.member_groundball_status
    SET selections_used = GREATEST(0, COALESCE(selections_used, 1) - 1),
        free_swaps_remaining = CASE
          WHEN v_used_free THEN GREATEST(0, COALESCE(free_swaps_remaining, 1) - 1)
          ELSE free_swaps_remaining
        END,
        updated_at = now()
    WHERE member_id = v_auth_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'reward_id', v_selection.reward_id,
    'is_giveback', v_is_giveback,
    'used_free_swap', v_used_free,
    'paid_swap', v_paid,
    'claims_charged', CASE WHEN v_paid THEN v_swap_cost ELSE 0 END,
    'claims_balance', COALESCE(v_balance, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.groundball_purchase_bonus_slot()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot_cost integer := 25;
  v_auth_id uuid := auth.uid();
  v_data jsonb;
  v_balance numeric;
  v_bonus integer;
BEGIN
  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COALESCE(crescendo_data, '{}'::jsonb) INTO v_data
  FROM public.unified_profiles
  WHERE auth_user_id = v_auth_id
  FOR UPDATE;

  IF v_data IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  v_balance := COALESCE((v_data->>'claims_balance')::numeric, (v_data->>'claim_balance')::numeric, 0);

  IF v_balance < v_slot_cost THEN
    RAISE EXCEPTION 'Insufficient Claims. You need % Claims for a bonus slot.', v_slot_cost;
  END IF;

  v_balance := v_balance - v_slot_cost;

  UPDATE public.unified_profiles
  SET crescendo_data = COALESCE(crescendo_data, '{}'::jsonb)
                       || jsonb_build_object('claims_balance', v_balance),
      updated_at = now()
  WHERE auth_user_id = v_auth_id;

  INSERT INTO public.member_groundball_status (member_id, bonus_selections, selections_max, selections_used, free_swaps_remaining)
  VALUES (v_auth_id, 1, 3, 0, 1)
  ON CONFLICT (member_id) DO UPDATE
    SET bonus_selections = COALESCE(public.member_groundball_status.bonus_selections, 0) + 1,
        updated_at = now()
  RETURNING bonus_selections INTO v_bonus;

  RETURN jsonb_build_object(
    'success', true,
    'claims_charged', v_slot_cost,
    'claims_balance', v_balance,
    'bonus_selections', v_bonus
  );
END;
$$;

REVOKE ALL ON FUNCTION public.groundball_swap_reward(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.groundball_purchase_bonus_slot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.groundball_swap_reward(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.groundball_purchase_bonus_slot() TO authenticated;

-- Lock the JSON claims balance against direct client writes.
CREATE OR REPLACE FUNCTION public.block_client_financial_writes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_role text := current_user;
BEGIN
  IF v_role NOT IN ('anon', 'authenticated') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

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
      -- Claims are dollar-denominated: a client-created profile starts at zero.
      NEW.crescendo_data := (COALESCE(NEW.crescendo_data, '{}'::jsonb) - 'claim_balance')
                            || jsonb_build_object('claims_balance', 0);
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

    -- Claims balance lives inside crescendo_data; only server code may change it.
    IF COALESCE(NEW.crescendo_data->>'claims_balance', '')
         IS DISTINCT FROM COALESCE(OLD.crescendo_data->>'claims_balance', '')
       OR COALESCE(NEW.crescendo_data->>'claim_balance', '')
         IS DISTINCT FROM COALESCE(OLD.crescendo_data->>'claim_balance', '') THEN
      RAISE EXCEPTION 'Claims balance is server-owned and cannot be modified by clients';
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
$function$;