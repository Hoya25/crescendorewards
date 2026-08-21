DO $$
DECLARE
  v_auth uuid;
  v_gold uuid;
  v_up uuid;
BEGIN
  SELECT id INTO v_auth FROM auth.users WHERE email = 'bellanderson+crescendo-test@gmail.com';
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'test auth user not found';
  END IF;

  SELECT id INTO v_gold FROM public.status_tiers WHERE tier_name = 'gold';
  SELECT id INTO v_up FROM public.unified_profiles
   WHERE auth_user_id = v_auth OR email = 'bellanderson+crescendo-test@gmail.com'
   ORDER BY (auth_user_id IS NOT NULL) DESC LIMIT 1;

  IF v_up IS NULL THEN
    INSERT INTO public.unified_profiles (
      auth_user_id, email, display_name, handle, current_tier_id, tier_calculated_at,
      nctr_locked_points, nctr_balance_points, nctr_earned_total,
      nctr_lock_duration_days, nctr_lock_expires_at,
      has_completed_onboarding, signup_bonus_awarded, leaderboard_opt_in,
      garden_data, crescendo_data, source_category
    ) VALUES (
      v_auth, 'bellanderson+crescendo-test@gmail.com', 'Crescendo QA Fixture', 'crescendo-qa',
      v_gold, now(), 15000, 2000, 15000, 360, now() + interval '360 days',
      true, true, false, '{}'::jsonb,
      jsonb_build_object('claims_balance', 100, 'level', 0, 'locked_nctr', 15000,
        'available_nctr', 2000, 'has_claimed_signup_bonus', true,
        'has_status_access_pass', true, 'is_test_fixture', true, 'synced_at', now()),
      'qa_fixture'
    ) RETURNING id INTO v_up;
  ELSE
    UPDATE public.unified_profiles
    SET auth_user_id = v_auth,
        email = 'bellanderson+crescendo-test@gmail.com',
        display_name = 'Crescendo QA Fixture',
        handle = COALESCE(handle, 'crescendo-qa'),
        current_tier_id = v_gold,
        tier_calculated_at = now(),
        nctr_locked_points = 15000,
        nctr_balance_points = 2000,
        nctr_earned_total = 15000,
        nctr_lock_duration_days = 360,
        nctr_lock_expires_at = now() + interval '360 days',
        has_completed_onboarding = true,
        signup_bonus_awarded = true,
        source_category = COALESCE(source_category, 'qa_fixture'),
        crescendo_data = COALESCE(crescendo_data, '{}'::jsonb) || jsonb_build_object(
          'claims_balance', 100, 'locked_nctr', 15000, 'available_nctr', 2000,
          'has_claimed_signup_bonus', true, 'has_status_access_pass', true,
          'is_test_fixture', true, 'synced_at', now())
    WHERE id = v_up;
  END IF;

  UPDATE public.profiles
  SET full_name = 'Crescendo QA Fixture',
      locked_nctr = 15000,
      total_locked_nctr = 15000,
      available_nctr = 2000,
      claim_balance = 100,
      has_claimed_signup_bonus = true,
      has_status_access_pass = true
  WHERE id = v_auth;

  PERFORM public.groundball_ensure_status(v_auth);
END $$;