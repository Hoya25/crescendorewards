-- Canonical Groundball allocation (per member_groundball_status table comment):
-- bronze = 2 selections, silver = 4, gold = 7. Platinum/Diamond map to gold.
CREATE OR REPLACE FUNCTION public.groundball_tier_for_member(p_member_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
           WHEN st.tier_name IN ('gold','platinum','diamond') THEN 'gold'
           WHEN st.tier_name = 'silver' THEN 'silver'
           WHEN st.tier_name = 'bronze' THEN 'bronze'
           ELSE 'none'
         END
  FROM public.unified_profiles up
  LEFT JOIN public.status_tiers st ON st.id = up.current_tier_id
  WHERE up.auth_user_id = p_member_id OR up.id = p_member_id
  ORDER BY (up.auth_user_id = p_member_id) DESC
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.groundball_tier_for_member(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.groundball_slots_for_tier(p_tier text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_tier
           WHEN 'gold'   THEN 7
           WHEN 'silver' THEN 4
           WHEN 'bronze' THEN 2
           ELSE 0
         END
$$;

REVOKE ALL ON FUNCTION public.groundball_slots_for_tier(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.groundball_ensure_status(p_member_id uuid)
RETURNS member_groundball_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_row   public.member_groundball_status;
  v_tier  text;
  v_max   integer;
  v_used  integer;
BEGIN
  SELECT * INTO v_row FROM public.member_groundball_status
  WHERE member_id = p_member_id FOR UPDATE;

  -- Derive from the member's real membership status, never from a default.
  v_tier := COALESCE(public.groundball_tier_for_member(p_member_id), 'none');
  v_max  := public.groundball_slots_for_tier(v_tier);

  -- Slots are consumed only by non-giveback selections.
  SELECT COUNT(*) INTO v_used
  FROM public.member_reward_selections s
  LEFT JOIN public.groundball_rewards r ON r.id = s.reward_id
  WHERE s.member_id = p_member_id
    AND s.is_active
    AND COALESCE(r.is_giveback, false) = false;

  IF v_row.id IS NULL THEN
    INSERT INTO public.member_groundball_status
      (member_id, status_tier, selections_used, selections_max,
       bonus_selections, free_swaps_remaining)
    VALUES (p_member_id, v_tier, v_used, v_max, 0, 1)
    ON CONFLICT (member_id) DO UPDATE SET updated_at = now()
    RETURNING * INTO v_row;

  ELSIF COALESCE(v_row.status_tier, 'none') = 'none'
        AND COALESCE(v_row.selections_max, 0) = 0
        AND v_max > 0 THEN
    -- Row exists but was never provisioned (the zero-slot lockout state).
    -- Heal it without disturbing purchased bonus slots or swap credits.
    UPDATE public.member_groundball_status
    SET status_tier     = v_tier,
        selections_max  = v_max,
        selections_used = v_used,
        updated_at      = now()
    WHERE member_id = p_member_id
    RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$function$;

REVOKE ALL ON FUNCTION public.groundball_ensure_status(uuid) FROM PUBLIC, anon, authenticated;