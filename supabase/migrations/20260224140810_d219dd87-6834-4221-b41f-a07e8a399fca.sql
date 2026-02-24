
DROP FUNCTION IF EXISTS public.claim_handle(uuid, text);

CREATE OR REPLACE FUNCTION public.claim_handle(p_user_id uuid, p_handle text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  clean_handle text;
  availability json;
  user_profile record;
  locked_nctr numeric;
  current_tier text;
  last_change record;
  days_since_change integer;
  last_tier_at_change text;
  change_reason text;
BEGIN
  clean_handle := lower(trim(p_handle));

  availability := check_handle_available(clean_handle);
  IF NOT (availability->>'available')::boolean THEN
    RETURN availability;
  END IF;

  SELECT * INTO user_profile
  FROM unified_profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  SELECT COALESCE(nctr_360_locked, 0) + COALESCE(nctr_90_locked, 0)
  INTO locked_nctr
  FROM wallet_portfolio
  WHERE user_id = p_user_id;

  IF locked_nctr IS NULL OR locked_nctr = 0 THEN
    locked_nctr := COALESCE((user_profile.crescendo_data->>'locked_nctr')::numeric, 0);
  END IF;

  IF COALESCE(locked_nctr, 0) < 100 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Bronze status required (100+ NCTR locked). You have ' || COALESCE(locked_nctr, 0)::text || ' locked.',
      'locked_nctr', COALESCE(locked_nctr, 0),
      'required', 100
    );
  END IF;

  IF locked_nctr >= 50000 THEN current_tier := 'diamond';
  ELSIF locked_nctr >= 10000 THEN current_tier := 'platinum';
  ELSIF locked_nctr >= 2000 THEN current_tier := 'gold';
  ELSIF locked_nctr >= 500 THEN current_tier := 'silver';
  ELSE current_tier := 'bronze';
  END IF;

  IF user_profile.handle IS NULL THEN
    change_reason := 'initial_claim';
  ELSE
    SELECT * INTO last_change
    FROM handle_history
    WHERE user_id = p_user_id
    ORDER BY changed_at DESC
    LIMIT 1;

    IF FOUND THEN
      days_since_change := EXTRACT(DAY FROM (now() - last_change.changed_at));
      last_tier_at_change := last_change.tier_at_change;
    ELSE
      days_since_change := 999;
      last_tier_at_change := 'bronze';
    END IF;

    IF current_tier IS DISTINCT FROM COALESCE(last_tier_at_change, 'bronze')
       AND current_tier IN ('silver', 'gold', 'platinum', 'diamond') THEN
      change_reason := 'tier_upgrade';
    ELSIF days_since_change >= 365 THEN
      change_reason := 'annual_change';
    ELSE
      RETURN json_build_object(
        'success', false,
        'error', 'Handle changes available once per year or when you reach a new tier. Next eligible: ' ||
          CASE
            WHEN days_since_change < 365 THEN (365 - days_since_change)::text || ' days'
            ELSE 'now'
          END,
        'days_until_eligible', GREATEST(0, 365 - days_since_change),
        'current_tier', current_tier,
        'last_tier_at_change', last_tier_at_change
      );
    END IF;
  END IF;

  INSERT INTO handle_history (user_id, old_handle, new_handle, reason, tier_at_change)
  VALUES (
    p_user_id,
    COALESCE(user_profile.handle, ''),
    clean_handle,
    change_reason,
    current_tier
  );

  UPDATE unified_profiles
  SET handle = clean_handle
  WHERE id = p_user_id;

  IF change_reason = 'initial_claim' THEN
    INSERT INTO nctr_transactions (user_id, base_amount, final_amount, source, notes)
    VALUES (p_user_id, 250, 250, 'bounty', 'Claimed @' || clean_handle || ' handle');
  END IF;

  RETURN json_build_object(
    'success', true,
    'handle', clean_handle,
    'reason', change_reason,
    'message', CASE change_reason
      WHEN 'initial_claim' THEN 'You are now @' || clean_handle || '! +250 NCTR'
      WHEN 'tier_upgrade' THEN 'Handle updated to @' || clean_handle || '! Free change with your new ' || initcap(current_tier) || ' status'
      WHEN 'annual_change' THEN 'Handle updated to @' || clean_handle || '!'
      ELSE 'Handle updated to @' || clean_handle
    END
  );
END;
$$;
