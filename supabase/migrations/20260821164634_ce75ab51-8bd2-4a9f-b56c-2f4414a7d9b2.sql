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
  v_existing_id uuid;
  v_existing_active boolean;
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

  SELECT id, COALESCE(is_active, false) INTO v_existing_id, v_existing_active
  FROM public.member_reward_selections
  WHERE member_id = v_auth_id AND reward_id = p_reward_id
  FOR UPDATE;

  IF v_existing_active THEN
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

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.member_reward_selections
    SET is_active = true,
        selected_at = now()
    WHERE id = v_existing_id
    RETURNING id INTO v_selection_id;
  ELSE
    INSERT INTO public.member_reward_selections (member_id, reward_id, is_active)
    VALUES (v_auth_id, p_reward_id, true)
    RETURNING id INTO v_selection_id;
  END IF;

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