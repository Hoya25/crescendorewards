-- ============================================================
-- 1. rewards_claims: RPC/admin-only creation
-- ============================================================
DROP POLICY IF EXISTS "Users can create their own claims" ON public.rewards_claims;
REVOKE INSERT ON public.rewards_claims FROM authenticated, anon;
GRANT ALL ON public.rewards_claims TO service_role;

-- ============================================================
-- 2. member_groundball_status: counters become server-only
-- ============================================================
DROP POLICY IF EXISTS "Members can insert their own groundball status" ON public.member_groundball_status;
DROP POLICY IF EXISTS "Members can update their own groundball status" ON public.member_groundball_status;
REVOKE INSERT, UPDATE, DELETE ON public.member_groundball_status FROM authenticated, anon;
GRANT ALL ON public.member_groundball_status TO service_role;

CREATE OR REPLACE FUNCTION public.block_groundball_counter_writes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_role text := current_user;
BEGIN
  IF v_role NOT IN ('anon', 'authenticated') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP <> 'UPDATE' THEN
    RAISE EXCEPTION 'Groundball status rows are server-owned and cannot be created or deleted by clients';
  END IF;

  IF NEW.selections_used IS DISTINCT FROM OLD.selections_used
     OR NEW.selections_max IS DISTINCT FROM OLD.selections_max
     OR NEW.bonus_selections IS DISTINCT FROM OLD.bonus_selections
     OR NEW.free_swaps_remaining IS DISTINCT FROM OLD.free_swaps_remaining
     OR NEW.status_tier IS DISTINCT FROM OLD.status_tier
     OR NEW.groundball_locked IS DISTINCT FROM OLD.groundball_locked THEN
    RAISE EXCEPTION 'Groundball slots, swaps and status are server-owned and cannot be modified by clients';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS block_groundball_counter_writes ON public.member_groundball_status;
CREATE TRIGGER block_groundball_counter_writes
  BEFORE INSERT OR UPDATE OR DELETE ON public.member_groundball_status
  FOR EACH ROW EXECUTE FUNCTION public.block_groundball_counter_writes();

-- ============================================================
-- 3. member_reward_selections: server-only writes
-- ============================================================
DROP POLICY IF EXISTS "Users can insert their own reward selections" ON public.member_reward_selections;
DROP POLICY IF EXISTS "Users can update their own reward selections" ON public.member_reward_selections;
DROP POLICY IF EXISTS "Users can delete their own reward selections" ON public.member_reward_selections;
REVOKE INSERT, UPDATE, DELETE ON public.member_reward_selections FROM authenticated, anon;
GRANT ALL ON public.member_reward_selections TO service_role;

-- Backfill orphan status rows: members holding selections with no status row.
INSERT INTO public.member_groundball_status
  (member_id, status_tier, selections_used, selections_max, bonus_selections, free_swaps_remaining)
SELECT s.member_id,
       'none',
       COUNT(*) FILTER (WHERE COALESCE(r.is_giveback, false) = false AND s.is_active),
       0, 0, 1
FROM public.member_reward_selections s
LEFT JOIN public.groundball_rewards r ON r.id = s.reward_id
WHERE s.member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.member_groundball_status g WHERE g.member_id = s.member_id
  )
GROUP BY s.member_id;

-- Self-healing provisioner: guarantees a status row exists for a member.
CREATE OR REPLACE FUNCTION public.groundball_ensure_status(p_member_id uuid)
RETURNS public.member_groundball_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row public.member_groundball_status;
BEGIN
  SELECT * INTO v_row FROM public.member_groundball_status
  WHERE member_id = p_member_id FOR UPDATE;

  IF v_row.id IS NULL THEN
    INSERT INTO public.member_groundball_status
      (member_id, status_tier, selections_used, selections_max, bonus_selections, free_swaps_remaining)
    VALUES (p_member_id, 'none',
      (SELECT COUNT(*) FROM public.member_reward_selections s
         LEFT JOIN public.groundball_rewards r ON r.id = s.reward_id
        WHERE s.member_id = p_member_id AND s.is_active
          AND COALESCE(r.is_giveback, false) = false),
      0, 0, 1)
    ON CONFLICT (member_id) DO UPDATE SET updated_at = now()
    RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.groundball_ensure_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.groundball_ensure_status(uuid) TO service_role;

-- Selection through an RPC: ownership, tier gate, slot accounting in one transaction.
CREATE OR REPLACE FUNCTION public.groundball_select_reward(p_reward_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_auth_id uuid := auth.uid();
  v_status public.member_groundball_status;
  v_reward public.groundball_rewards;
  v_required text;
  v_hierarchy text[] := ARRAY['any','none','bronze','silver','gold'];
  v_total integer;
  v_selection_id uuid;
BEGIN
  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_reward FROM public.groundball_rewards
  WHERE id = p_reward_id AND COALESCE(is_active, false) = true;

  IF v_reward.id IS NULL THEN
    RAISE EXCEPTION 'Reward not found';
  END IF;

  v_status := public.groundball_ensure_status(v_auth_id);

  IF EXISTS (
    SELECT 1 FROM public.member_reward_selections
    WHERE member_id = v_auth_id AND reward_id = p_reward_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Reward already selected';
  END IF;

  v_required := COALESCE(v_reward.required_status, 'any');
  IF v_required <> 'any' AND
     array_position(v_hierarchy, COALESCE(v_status.status_tier, 'none'))
       < array_position(v_hierarchy, v_required) THEN
    RAISE EXCEPTION 'Requires % status', v_required;
  END IF;

  IF COALESCE(v_reward.is_giveback, false) = false THEN
    v_total := COALESCE(v_status.selections_max, 0) + COALESCE(v_status.bonus_selections, 0);
    IF COALESCE(v_status.selections_used, 0) >= v_total THEN
      RAISE EXCEPTION 'No selection slots available';
    END IF;

    UPDATE public.member_groundball_status
    SET selections_used = COALESCE(selections_used, 0) + 1,
        updated_at = now()
    WHERE member_id = v_auth_id;
  END IF;

  INSERT INTO public.member_reward_selections (member_id, reward_id, is_active)
  VALUES (v_auth_id, p_reward_id, true)
  RETURNING id INTO v_selection_id;

  RETURN jsonb_build_object(
    'success', true,
    'selection_id', v_selection_id,
    'reward_id', p_reward_id,
    'is_giveback', COALESCE(v_reward.is_giveback, false)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.groundball_select_reward(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.groundball_select_reward(uuid) TO authenticated, service_role;

-- Redemption through an RPC.
CREATE OR REPLACE FUNCTION public.groundball_redeem_selection(p_selection_id uuid, p_notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_auth_id uuid := auth.uid();
  v_selection record;
  v_cadence text;
  v_period text;
  v_count integer;
BEGIN
  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT s.id, s.member_id, s.reward_id, COALESCE(r.cadence, 'one_time') AS cadence
    INTO v_selection
  FROM public.member_reward_selections s
  LEFT JOIN public.groundball_rewards r ON r.id = s.reward_id
  WHERE s.id = p_selection_id AND s.member_id = v_auth_id AND s.is_active = true
  FOR UPDATE OF s;

  IF v_selection.id IS NULL THEN
    RAISE EXCEPTION 'Selection not found';
  END IF;

  v_cadence := v_selection.cadence;
  v_period := CASE v_cadence
    WHEN 'daily' THEN to_char(now(), 'YYYY-MM-DD')
    WHEN 'monthly' THEN to_char(now(), 'YYYY-MM')
    WHEN 'quarterly' THEN to_char(now(), 'YYYY') || '-Q' || to_char(now(), 'Q')
    WHEN 'annual' THEN to_char(now(), 'YYYY')
    ELSE 'one_time'
  END;

  IF EXISTS (
    SELECT 1 FROM public.reward_redemptions
    WHERE selection_id = p_selection_id AND period = v_period
  ) THEN
    RAISE EXCEPTION 'Already redeemed for this period';
  END IF;

  INSERT INTO public.reward_redemptions (member_id, reward_id, selection_id, period, notes)
  VALUES (v_auth_id, v_selection.reward_id, p_selection_id, v_period, NULLIF(p_notes, ''));

  UPDATE public.member_reward_selections
  SET last_redeemed_at = now(),
      redemption_count = COALESCE(redemption_count, 0) + 1
  WHERE id = p_selection_id
  RETURNING redemption_count INTO v_count;

  RETURN jsonb_build_object('success', true, 'period', v_period, 'redemption_count', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.groundball_redeem_selection(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.groundball_redeem_selection(uuid, text) TO authenticated, service_role;

-- ============================================================
-- 4. gear_vault_items: claiming via RPC, guarded columns
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can claim available items" ON public.gear_vault_items;

CREATE OR REPLACE FUNCTION public.block_gear_vault_client_writes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_role text := current_user;
BEGIN
  IF v_role NOT IN ('anon', 'authenticated') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'available';
    NEW.claimer_id := NULL;
    NEW.claimed_at := NULL;
    NEW.shipped_at := NULL;
    NEW.completed_at := NULL;
    NEW.contributor_reward_groundball := 0;
    NEW.contributor_reward_nctr := 0;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.claimer_id IS DISTINCT FROM OLD.claimer_id
     OR NEW.claimed_at IS DISTINCT FROM OLD.claimed_at
     OR NEW.shipped_at IS DISTINCT FROM OLD.shipped_at
     OR NEW.completed_at IS DISTINCT FROM OLD.completed_at
     OR NEW.contributor_reward_groundball IS DISTINCT FROM OLD.contributor_reward_groundball
     OR NEW.contributor_reward_nctr IS DISTINCT FROM OLD.contributor_reward_nctr THEN
    RAISE EXCEPTION 'Gear vault claim status and rewards are server-owned; use gear_vault_claim_item()';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS block_gear_vault_client_writes ON public.gear_vault_items;
CREATE TRIGGER block_gear_vault_client_writes
  BEFORE INSERT OR UPDATE ON public.gear_vault_items
  FOR EACH ROW EXECUTE FUNCTION public.block_gear_vault_client_writes();

CREATE OR REPLACE FUNCTION public.gear_vault_claim_item(p_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_auth_id uuid := auth.uid();
  v_tier text;
  v_hierarchy text[] := ARRAY['none','bronze','silver','gold'];
  v_item public.gear_vault_items;
BEGIN
  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COALESCE(status_tier, 'none') INTO v_tier
  FROM public.member_groundball_status WHERE member_id = v_auth_id;

  IF array_position(v_hierarchy, COALESCE(v_tier, 'none'))
       < array_position(v_hierarchy, 'bronze') THEN
    RAISE EXCEPTION 'Bronze status is required to claim gear';
  END IF;

  SELECT * INTO v_item FROM public.gear_vault_items
  WHERE id = p_item_id FOR UPDATE;

  IF v_item.id IS NULL THEN
    RAISE EXCEPTION 'Item not found';
  END IF;

  IF v_item.status <> 'available' OR v_item.claimer_id IS NOT NULL THEN
    RAISE EXCEPTION 'Item is no longer available';
  END IF;

  UPDATE public.gear_vault_items
  SET status = 'claimed', claimer_id = v_auth_id, claimed_at = now(), updated_at = now()
  WHERE id = p_item_id;

  RETURN jsonb_build_object('success', true, 'item_id', p_item_id);
END;
$$;

REVOKE ALL ON FUNCTION public.gear_vault_claim_item(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gear_vault_claim_item(uuid) TO authenticated, service_role;

-- ============================================================
-- 5. nctr_deposits: members may declare, never credit or approve
-- ============================================================
CREATE OR REPLACE FUNCTION public.block_deposit_client_writes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_role text := current_user;
BEGIN
  IF v_role NOT IN ('anon', 'authenticated') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.amount_nctr := 0;
    NEW.status := 'pending';
    NEW.lock_type := COALESCE(NEW.lock_type, '360LOCK');
    NEW.unlocks_at := NULL;
    NEW.withdrawal_approved_at := NULL;
    NEW.withdrawal_tx_hash := NULL;
    RETURN NEW;
  END IF;

  IF NEW.amount_nctr IS DISTINCT FROM OLD.amount_nctr
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.lock_type IS DISTINCT FROM OLD.lock_type
     OR NEW.unlocks_at IS DISTINCT FROM OLD.unlocks_at
     OR NEW.withdrawal_approved_at IS DISTINCT FROM OLD.withdrawal_approved_at
     OR NEW.withdrawal_tx_hash IS DISTINCT FROM OLD.withdrawal_tx_hash
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Deposit amount, lock type and verification are server-owned and cannot be modified by clients';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS block_deposit_client_writes ON public.nctr_deposits;
CREATE TRIGGER block_deposit_client_writes
  BEFORE INSERT OR UPDATE ON public.nctr_deposits
  FOR EACH ROW EXECUTE FUNCTION public.block_deposit_client_writes();

-- ============================================================
-- 6. Server-only ledgers
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own check-ins" ON public.check_ins;
REVOKE INSERT, UPDATE, DELETE ON public.check_ins FROM authenticated, anon;
GRANT ALL ON public.check_ins TO service_role;

DROP POLICY IF EXISTS "System can insert membership history" ON public.membership_history;
REVOKE INSERT, UPDATE, DELETE ON public.membership_history FROM authenticated, anon;
GRANT ALL ON public.membership_history TO service_role;

DROP POLICY IF EXISTS "contrib_earnings_insert" ON public.contributed_reward_earnings;
REVOKE INSERT, UPDATE, DELETE ON public.contributed_reward_earnings FROM authenticated, anon;
GRANT ALL ON public.contributed_reward_earnings TO service_role;