CREATE OR REPLACE FUNCTION public.award_onboarding_item(p_item text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  IF p_item = 'profile_completed' THEN
    SELECT COALESCE(profile_completed, false) INTO v_already
    FROM public.user_onboarding WHERE user_id = v_profile_id FOR UPDATE;
  ELSIF p_item = 'first_wishlist_item' THEN
    SELECT COALESCE(first_wishlist_item, false) INTO v_already
    FROM public.user_onboarding WHERE user_id = v_profile_id FOR UPDATE;
  ELSE
    SELECT COALESCE(first_referral, false) INTO v_already
    FROM public.user_onboarding WHERE user_id = v_profile_id FOR UPDATE;
  END IF;

  IF v_already THEN
    RETURN jsonb_build_object('success', true, 'awarded', false, 'reason', 'already_awarded');
  END IF;

  IF p_item = 'profile_completed' THEN
    UPDATE public.user_onboarding
       SET profile_completed = true, profile_completed_at = now(),
           onboarding_nctr_awarded = COALESCE(onboarding_nctr_awarded, 0) + v_amount,
           updated_at = now()
     WHERE user_id = v_profile_id;
  ELSIF p_item = 'first_wishlist_item' THEN
    UPDATE public.user_onboarding
       SET first_wishlist_item = true, first_wishlist_item_at = now(),
           onboarding_nctr_awarded = COALESCE(onboarding_nctr_awarded, 0) + v_amount,
           updated_at = now()
     WHERE user_id = v_profile_id;
  ELSE
    UPDATE public.user_onboarding
       SET first_referral = true, first_referral_at = now(),
           onboarding_nctr_awarded = COALESCE(onboarding_nctr_awarded, 0) + v_amount,
           updated_at = now()
     WHERE user_id = v_profile_id;
  END IF;

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
$function$;

REVOKE ALL ON FUNCTION public.award_onboarding_item(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_onboarding_item(text) TO authenticated, service_role;