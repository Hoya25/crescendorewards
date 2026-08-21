-- Remove the unsafe caller-identity signatures and their PUBLIC/anon grants.
DROP FUNCTION IF EXISTS public.perform_daily_checkin(uuid);
DROP FUNCTION IF EXISTS public.process_referral(text, uuid);
DROP FUNCTION IF EXISTS public.validate_and_claim_bounty(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.claim_gift(text, uuid);
DROP FUNCTION IF EXISTS public.calculate_nctr_reward(uuid, numeric, boolean);

CREATE FUNCTION public.perform_daily_checkin()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today date := current_date;
  v_already_checked_in boolean;
  v_streak integer := 0;
  v_check_date date;
  v_reward_amount integer := 1500;
  v_streak_completed boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.check_ins
    WHERE user_id = v_user_id AND checked_in_at = v_today
  ) INTO v_already_checked_in;

  IF v_already_checked_in THEN
    v_check_date := v_today;
    LOOP
      IF EXISTS (SELECT 1 FROM public.check_ins WHERE user_id = v_user_id AND checked_in_at = v_check_date) THEN
        v_streak := v_streak + 1;
        v_check_date := v_check_date - 1;
      ELSE
        EXIT;
      END IF;
      IF v_streak >= 7 THEN EXIT; END IF;
    END LOOP;

    RETURN jsonb_build_object(
      'success', true,
      'already_checked_in', true,
      'streak', v_streak,
      'streak_completed', false,
      'message', 'Already checked in today'
    );
  END IF;

  INSERT INTO public.check_ins (user_id, checked_in_at)
  VALUES (v_user_id, v_today);

  v_check_date := v_today;
  LOOP
    IF EXISTS (SELECT 1 FROM public.check_ins WHERE user_id = v_user_id AND checked_in_at = v_check_date) THEN
      v_streak := v_streak + 1;
      v_check_date := v_check_date - 1;
    ELSE
      EXIT;
    END IF;
    IF v_streak >= 7 THEN EXIT; END IF;
  END LOOP;

  IF v_streak >= 7 THEN
    v_streak_completed := true;

    UPDATE public.profiles
    SET locked_nctr = COALESCE(locked_nctr, 0) + v_reward_amount,
        updated_at = now()
    WHERE id = v_user_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Member profile not found' USING ERRCODE = 'P0002';
    END IF;

    DELETE FROM public.check_ins
    WHERE user_id = v_user_id
      AND checked_in_at BETWEEN (v_today - 6) AND v_today;

    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      v_user_id,
      'streak_reward',
      '🔥 7-Day Streak Complete!',
      'You earned ' || v_reward_amount || ' NCTR in 360LOCK for your weekly check-in streak!',
      jsonb_build_object('reward', v_reward_amount, 'streak_days', 7)
    );

    v_streak := 0;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'already_checked_in', false,
    'streak', v_streak,
    'streak_completed', v_streak_completed,
    'reward', CASE WHEN v_streak_completed THEN v_reward_amount ELSE 0 END,
    'message', CASE WHEN v_streak_completed
      THEN '🔥 7-day streak complete! ' || v_reward_amount || ' NCTR earned!'
      ELSE 'Checked in! Day ' || v_streak || ' of 7'
    END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.perform_daily_checkin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.perform_daily_checkin() TO authenticated, service_role;

CREATE FUNCTION public.process_referral(p_referrer_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referred_id uuid := auth.uid();
  v_referrer_id uuid;
  v_referral_bonus integer := 500;
  v_existing_referral uuid;
BEGIN
  IF v_referred_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = trim(p_referrer_code);

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;

  IF v_referrer_id = v_referred_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot refer yourself');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_referred_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member profile not found');
  END IF;

  SELECT id INTO v_existing_referral
  FROM public.referrals
  WHERE referred_id = v_referred_id;

  IF v_existing_referral IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already referred');
  END IF;

  INSERT INTO public.referrals (referrer_id, referred_id, referral_bonus, is_paid)
  VALUES (v_referrer_id, v_referred_id, v_referral_bonus, true);

  UPDATE public.profiles SET referred_by = v_referrer_id WHERE id = v_referred_id;
  UPDATE public.profiles SET locked_nctr = COALESCE(locked_nctr, 0) + v_referral_bonus WHERE id = v_referrer_id;
  UPDATE public.profiles SET locked_nctr = COALESCE(locked_nctr, 0) + v_referral_bonus WHERE id = v_referred_id;

  PERFORM public.check_referral_milestones(v_referrer_id);

  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    v_referrer_id,
    'referral_success',
    '🎉 New Referral!',
    'Someone joined using your link! You both earned ' || v_referral_bonus || ' NCTR in 360LOCK.',
    jsonb_build_object('referred_id', v_referred_id, 'bonus', v_referral_bonus)
  );

  RETURN jsonb_build_object('success', true, 'referrer_id', v_referrer_id, 'bonus', v_referral_bonus);
END;
$$;

REVOKE ALL ON FUNCTION public.process_referral(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_referral(text) TO authenticated, service_role;

CREATE FUNCTION public.validate_and_claim_bounty(
  p_bounty_id text,
  p_submission_url text DEFAULT NULL,
  p_submission_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id uuid := auth.uid();
  v_profile_id uuid;
  v_purchase_count integer;
  v_merch_count integer;
  v_referral_count integer;
  v_existing_claim uuid;
  v_is_recurring boolean;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_profile_id
  FROM public.unified_profiles
  WHERE auth_user_id = v_auth_user_id;

  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'status', 'error', 'message', 'User not found');
  END IF;

  IF p_bounty_id = 'signup-bonus' THEN
    SELECT has_claimed_signup_bonus INTO v_is_recurring FROM public.profiles WHERE id = v_auth_user_id;
    IF v_is_recurring THEN
      RETURN jsonb_build_object('success', false, 'status', 'already_claimed', 'message', 'Sign-up bonus already claimed');
    END IF;
    RETURN jsonb_build_object('success', true, 'status', 'auto_applied', 'message', 'Sign-up bonus was auto-applied when you joined');
  END IF;

  IF p_bounty_id = 'early-adopter' THEN
    IF EXISTS (SELECT 1 FROM public.unified_profiles WHERE id = v_profile_id AND created_at < '2026-06-01'::timestamptz) THEN
      RETURN jsonb_build_object('success', true, 'status', 'auto_applied', 'message', 'Early Adopter bonus auto-applied — you joined during launch!');
    END IF;
    RETURN jsonb_build_object('success', false, 'status', 'not_eligible', 'message', 'Early Adopter bonus is for users who joined during the launch period');
  END IF;

  SELECT count(*) INTO v_purchase_count FROM public.shop_transactions WHERE user_id = v_profile_id;
  SELECT count(*) INTO v_merch_count FROM public.shop_transactions WHERE user_id = v_profile_id AND is_merch = true;

  IF p_bounty_id = 'first-purchase' THEN
    IF v_purchase_count = 0 THEN
      RETURN jsonb_build_object('success', false, 'status', 'not_eligible', 'message', 'Make your first purchase at The Garden to unlock this bounty');
    END IF;
    SELECT id INTO v_existing_claim FROM public.bounty_claims
    WHERE user_id IN (v_profile_id, v_auth_user_id)
      AND bounty_id IN (SELECT id FROM public.bounties WHERE title = 'First Purchase')
      AND status IN ('approved', 'completed') LIMIT 1;
    IF v_existing_claim IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'status', 'already_claimed', 'message', 'First Purchase bounty already claimed');
    END IF;
    RETURN jsonb_build_object('success', true, 'status', 'eligible', 'message', 'You qualify! First purchase verified.', 'purchases', v_purchase_count);
  END IF;

  IF p_bounty_id = 'every-purchase' THEN
    RETURN jsonb_build_object('success', true, 'status', 'auto_drip', 'message', 'NCTR is auto-awarded on each purchase via webhook', 'purchases', v_purchase_count);
  END IF;

  IF p_bounty_id IN ('5th-purchase', '10th-purchase', '25th-purchase') THEN
    DECLARE v_required integer;
    BEGIN
      v_required := CASE p_bounty_id WHEN '5th-purchase' THEN 5 WHEN '10th-purchase' THEN 10 ELSE 25 END;
      IF v_purchase_count < v_required THEN
        RETURN jsonb_build_object('success', false, 'status', 'not_eligible', 'message', format('You need %s more purchase(s) to unlock this milestone', v_required - v_purchase_count), 'progress', v_purchase_count, 'required', v_required);
      END IF;
      SELECT id INTO v_existing_claim FROM public.merch_milestones WHERE user_id = v_profile_id AND milestone_key = p_bounty_id LIMIT 1;
      IF v_existing_claim IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'status', 'already_claimed', 'message', 'Milestone already claimed');
      END IF;
      RETURN jsonb_build_object('success', true, 'status', 'eligible', 'message', format('Milestone reached! %s/%s purchases', v_purchase_count, v_required), 'progress', v_purchase_count, 'required', v_required);
    END;
  END IF;

  IF p_bounty_id = 'first-merch' THEN
    IF v_merch_count = 0 THEN
      RETURN jsonb_build_object('success', false, 'status', 'not_eligible', 'message', 'Buy NCTR merch to unlock this bounty');
    END IF;
    SELECT id INTO v_existing_claim FROM public.merch_milestones WHERE user_id = v_profile_id AND milestone_key = 'first-merch' LIMIT 1;
    IF v_existing_claim IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'status', 'already_claimed', 'message', 'First Merch bounty already claimed');
    END IF;
    RETURN jsonb_build_object('success', true, 'status', 'eligible', 'message', 'Merch purchase verified!', 'merch_purchases', v_merch_count);
  END IF;

  IF p_bounty_id = 'every-merch' THEN
    RETURN jsonb_build_object('success', true, 'status', 'auto_drip', 'message', 'NCTR auto-awarded on each merch purchase', 'merch_purchases', v_merch_count);
  END IF;

  SELECT count(*) INTO v_referral_count FROM public.referrals WHERE referrer_id = v_auth_user_id;

  IF p_bounty_id IN ('referral-signup', 'referral-first-purchase', 'referral-every-purchase') THEN
    RETURN jsonb_build_object('success', true, 'status', 'auto_drip', 'message', 'Referral rewards are auto-awarded when your referrals take action', 'referrals', v_referral_count);
  END IF;

  IF p_bounty_id IN ('referral-5-purchases', 'referral-10-purchases') THEN
    DECLARE v_ref_required integer; v_max_ref_purchases integer;
    BEGIN
      v_ref_required := CASE p_bounty_id WHEN 'referral-5-purchases' THEN 5 ELSE 10 END;
      SELECT COALESCE(max(purchase_count), 0) INTO v_max_ref_purchases
      FROM (
        SELECT count(*) AS purchase_count
        FROM public.shop_transactions st
        JOIN public.referrals r ON st.user_id = r.referred_id::text
        WHERE r.referrer_id = v_auth_user_id
        GROUP BY st.user_id
      ) sub;
      IF v_max_ref_purchases < v_ref_required THEN
        RETURN jsonb_build_object('success', false, 'status', 'not_eligible', 'message', format('Best referral has %s/%s purchases', v_max_ref_purchases, v_ref_required), 'progress', v_max_ref_purchases, 'required', v_ref_required);
      END IF;
      RETURN jsonb_build_object('success', true, 'status', 'eligible', 'message', format('Referral milestone reached! %s+ purchases', v_ref_required));
    END;
  END IF;

  IF p_bounty_id = 'content-creation' THEN
    IF p_submission_url IS NULL OR length(trim(p_submission_url)) = 0 THEN
      RETURN jsonb_build_object('success', false, 'status', 'error', 'message', 'Please provide a link to your content');
    END IF;

    INSERT INTO public.content_submissions (source_id, source_type, source_name, title, description, media_url, status)
    VALUES (
      v_auth_user_id::text,
      'user',
      (SELECT COALESCE(display_name, email) FROM public.unified_profiles WHERE id = v_profile_id),
      'Content Submission',
      COALESCE(p_submission_notes, ''),
      p_submission_url,
      'pending'
    );

    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (v_auth_user_id, 'bounty_pending', 'Content Submitted', 'Your content submission is pending review. We''ll notify you when it''s approved.');

    RETURN jsonb_build_object('success', true, 'status', 'pending', 'message', 'Content submitted for review! We''ll notify you when approved.');
  END IF;

  RETURN jsonb_build_object('success', false, 'status', 'error', 'message', 'Unknown bounty type');
END;
$$;

REVOKE ALL ON FUNCTION public.validate_and_claim_bounty(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_and_claim_bounty(text, text, text) TO authenticated, service_role;

CREATE FUNCTION public.claim_gift(p_gift_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id uuid := auth.uid();
  v_profile_id uuid;
  v_user_email text;
  v_gift public.claim_gifts%ROWTYPE;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT id, email INTO v_profile_id, v_user_email
  FROM public.unified_profiles
  WHERE auth_user_id = v_auth_user_id;

  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member profile not found');
  END IF;

  SELECT * INTO v_gift
  FROM public.claim_gifts
  WHERE gift_code = trim(p_gift_code)
    AND status = 'pending'
    AND expires_at > now()
  FOR UPDATE;

  IF v_gift.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gift not found, already claimed, or expired');
  END IF;

  IF v_gift.recipient_id IS NOT NULL AND v_gift.recipient_id <> v_profile_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'This gift is for someone else');
  END IF;

  IF v_gift.recipient_email IS NOT NULL AND lower(v_gift.recipient_email) <> lower(v_user_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This gift is for a different email address');
  END IF;

  UPDATE public.claim_gifts
  SET status = 'claimed', recipient_id = v_profile_id, claimed_at = now()
  WHERE id = v_gift.id;

  UPDATE public.profiles
  SET claim_balance = COALESCE(claim_balance, 0) + v_gift.claims_amount,
      updated_at = now()
  WHERE id = v_auth_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member profile not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'claims_received', v_gift.claims_amount,
    'message', v_gift.message,
    'is_admin_gift', v_gift.is_admin_gift
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_gift(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_gift(text) TO authenticated, service_role;

-- Benefits are coupled lifecycle records. Members may read them, but all writes
-- now pass through the two server-validated functions below.
REVOKE INSERT, UPDATE, DELETE ON public.member_active_benefits FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.benefit_activation_history FROM anon, authenticated;
GRANT SELECT ON public.member_active_benefits TO authenticated;
GRANT SELECT ON public.benefit_activation_history TO authenticated;
GRANT ALL ON public.member_active_benefits TO service_role;
GRANT ALL ON public.benefit_activation_history TO service_role;

DROP POLICY IF EXISTS "Users can insert their own active benefits" ON public.member_active_benefits;
DROP POLICY IF EXISTS "Users can update their own active benefits" ON public.member_active_benefits;
DROP POLICY IF EXISTS "Users can delete their own active benefits" ON public.member_active_benefits;

CREATE FUNCTION public.activate_member_benefit(
  p_partner_id uuid,
  p_selected_creator_name text DEFAULT NULL,
  p_selected_creator_url text DEFAULT NULL,
  p_selected_creator_platform text DEFAULT NULL
)
RETURNS public.member_active_benefits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id uuid := auth.uid();
  v_profile public.unified_profiles%ROWTYPE;
  v_partner public.alliance_partners%ROWTYPE;
  v_tier_name text;
  v_tier_slots integer;
  v_used_slots integer;
  v_slot_cost integer;
  v_status text;
  v_benefit public.member_active_benefits%ROWTYPE;
  v_tier_rank integer;
  v_required_rank integer;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_profile FROM public.unified_profiles WHERE auth_user_id = v_auth_user_id;
  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'Member profile not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_partner FROM public.alliance_partners WHERE id = p_partner_id AND is_active = true;
  IF v_partner.id IS NULL THEN
    RAISE EXCEPTION 'Benefit is unavailable' USING ERRCODE = 'P0002';
  END IF;

  SELECT tier_name, COALESCE(benefit_slots, 1)
  INTO v_tier_name, v_tier_slots
  FROM public.status_tiers
  WHERE id = v_profile.current_tier_id;

  v_tier_name := COALESCE(lower(v_tier_name), 'bronze');
  v_tier_rank := array_position(ARRAY['bronze','silver','gold','platinum','diamond'], v_tier_name);
  v_required_rank := array_position(ARRAY['bronze','silver','gold','platinum','diamond'], lower(COALESCE(v_partner.min_tier, 'bronze')));

  IF COALESCE(v_tier_rank, 0) < COALESCE(v_required_rank, 1) THEN
    RAISE EXCEPTION 'Your current status does not unlock this benefit' USING ERRCODE = '42501';
  END IF;

  v_slot_cost := GREATEST(COALESCE(v_partner.slot_cost, 1), 1);
  SELECT COALESCE(sum(COALESCE(slots_used, 1)), 0)
  INTO v_used_slots
  FROM public.member_active_benefits
  WHERE user_id = v_profile.id AND status IN ('active', 'pending');

  IF v_used_slots + v_slot_cost > COALESCE(v_tier_slots, 1) THEN
    RAISE EXCEPTION 'Not enough benefit slots available' USING ERRCODE = '23514';
  END IF;

  IF COALESCE(v_partner.is_creator_subscription, false) THEN
    IF nullif(trim(p_selected_creator_name), '') IS NULL OR nullif(trim(p_selected_creator_url), '') IS NULL THEN
      RAISE EXCEPTION 'Creator name and URL are required' USING ERRCODE = '22023';
    END IF;
  END IF;

  v_status := CASE WHEN v_partner.activation_type = 'code' THEN 'active' ELSE 'pending' END;

  INSERT INTO public.member_active_benefits (
    user_id, partner_id, status, activated_at, expires_at, redemption_code,
    can_swap_after, slots_used, selected_creator_name, selected_creator_url,
    selected_creator_platform
  ) VALUES (
    v_profile.id, v_partner.id, v_status, now(), NULL, NULL,
    now() + interval '30 days', v_slot_cost,
    CASE WHEN v_partner.is_creator_subscription THEN nullif(trim(p_selected_creator_name), '') ELSE NULL END,
    CASE WHEN v_partner.is_creator_subscription THEN nullif(trim(p_selected_creator_url), '') ELSE NULL END,
    CASE WHEN v_partner.is_creator_subscription THEN nullif(trim(p_selected_creator_platform), '') ELSE NULL END
  )
  RETURNING * INTO v_benefit;

  INSERT INTO public.benefit_activation_history (user_id, partner_id, action)
  VALUES (v_profile.id, v_partner.id, 'activated');

  UPDATE public.alliance_partners
  SET total_activations = COALESCE(total_activations, 0) + 1
  WHERE id = v_partner.id;

  RETURN v_benefit;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_member_benefit(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_member_benefit(uuid, text, text, text) TO authenticated, service_role;

CREATE FUNCTION public.deactivate_member_benefit(p_benefit_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id uuid := auth.uid();
  v_profile_id uuid;
  v_partner_id uuid;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_profile_id FROM public.unified_profiles WHERE auth_user_id = v_auth_user_id;
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Member profile not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.member_active_benefits
  SET status = 'cancelled'
  WHERE id = p_benefit_id
    AND user_id = v_profile_id
    AND status IN ('active', 'pending')
  RETURNING partner_id INTO v_partner_id;

  IF v_partner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Active benefit not found');
  END IF;

  INSERT INTO public.benefit_activation_history (user_id, partner_id, action)
  VALUES (v_profile_id, v_partner_id, 'deactivated');

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.deactivate_member_benefit(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deactivate_member_benefit(uuid) TO authenticated, service_role;