
-- Add validation columns to bounties table
ALTER TABLE public.bounties 
ADD COLUMN IF NOT EXISTS validation_type TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS validation_config JSONB NOT NULL DEFAULT '{}';

-- Create validate_and_claim_bounty RPC
CREATE OR REPLACE FUNCTION public.validate_and_claim_bounty(
  p_user_id UUID,
  p_bounty_id TEXT,
  p_submission_url TEXT DEFAULT NULL,
  p_submission_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_auth_user_id UUID;
  v_purchase_count INT;
  v_merch_count INT;
  v_referral_count INT;
  v_existing_claim UUID;
  v_bounty_title TEXT;
  v_nctr_amount INT;
  v_claim_id UUID;
  v_is_recurring BOOLEAN;
  v_streak_data JSONB;
BEGIN
  -- Get auth_user_id from unified profile
  SELECT auth_user_id INTO v_auth_user_id
  FROM unified_profiles WHERE id = p_user_id;

  IF v_auth_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'status', 'error', 'message', 'User not found');
  END IF;

  -- ═══════════════════════════════════════════════════
  -- SIGN-UP BONUS (auto-applied)
  -- ═══════════════════════════════════════════════════
  IF p_bounty_id = 'signup-bonus' THEN
    -- Check if already claimed
    SELECT has_claimed_signup_bonus INTO v_is_recurring FROM profiles WHERE id = v_auth_user_id;
    IF v_is_recurring THEN
      RETURN jsonb_build_object('success', false, 'status', 'already_claimed', 'message', 'Sign-up bonus already claimed');
    END IF;
    RETURN jsonb_build_object('success', true, 'status', 'auto_applied', 'message', 'Sign-up bonus was auto-applied when you joined');
  END IF;

  -- ═══════════════════════════════════════════════════
  -- EARLY ADOPTER (auto-applied, check signup date)
  -- ═══════════════════════════════════════════════════
  IF p_bounty_id = 'early-adopter' THEN
    -- Check if user signed up before cutoff (e.g. 2026-06-01)
    IF EXISTS (SELECT 1 FROM unified_profiles WHERE id = p_user_id AND created_at < '2026-06-01'::timestamptz) THEN
      RETURN jsonb_build_object('success', true, 'status', 'auto_applied', 'message', 'Early Adopter bonus auto-applied — you joined during launch!');
    ELSE
      RETURN jsonb_build_object('success', false, 'status', 'not_eligible', 'message', 'Early Adopter bonus is for users who joined during the launch period');
    END IF;
  END IF;

  -- ═══════════════════════════════════════════════════
  -- PURCHASE-VALIDATED BOUNTIES
  -- ═══════════════════════════════════════════════════
  -- Get purchase counts
  SELECT COUNT(*) INTO v_purchase_count
  FROM shop_transactions WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_merch_count
  FROM shop_transactions WHERE user_id = p_user_id AND is_merch = true;

  IF p_bounty_id = 'first-purchase' THEN
    IF v_purchase_count = 0 THEN
      RETURN jsonb_build_object('success', false, 'status', 'not_eligible', 'message', 'Make your first purchase at The Garden to unlock this bounty');
    END IF;
    -- Check if already claimed
    SELECT id INTO v_existing_claim FROM bounty_claims
    WHERE user_id = v_auth_user_id AND bounty_id IN (SELECT id FROM bounties WHERE title = 'First Purchase') AND status = 'approved' LIMIT 1;
    IF v_existing_claim IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'status', 'already_claimed', 'message', 'First Purchase bounty already claimed');
    END IF;
    RETURN jsonb_build_object('success', true, 'status', 'eligible', 'message', 'You qualify! First purchase verified.', 'purchases', v_purchase_count);
  END IF;

  IF p_bounty_id = 'every-purchase' THEN
    RETURN jsonb_build_object('success', true, 'status', 'auto_drip', 'message', 'NCTR is auto-awarded on each purchase via webhook', 'purchases', v_purchase_count);
  END IF;

  IF p_bounty_id IN ('5th-purchase', '10th-purchase', '25th-purchase') THEN
    DECLARE v_required INT;
    BEGIN
      v_required := CASE p_bounty_id
        WHEN '5th-purchase' THEN 5
        WHEN '10th-purchase' THEN 10
        WHEN '25th-purchase' THEN 25
      END;

      IF v_purchase_count < v_required THEN
        RETURN jsonb_build_object(
          'success', false, 'status', 'not_eligible',
          'message', format('You need %s more purchase(s) to unlock this milestone', v_required - v_purchase_count),
          'progress', v_purchase_count, 'required', v_required
        );
      END IF;

      -- Check already claimed
      SELECT id INTO v_existing_claim FROM merch_milestones
      WHERE user_id = p_user_id AND milestone_key = p_bounty_id LIMIT 1;
      IF v_existing_claim IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'status', 'already_claimed', 'message', 'Milestone already claimed');
      END IF;

      RETURN jsonb_build_object('success', true, 'status', 'eligible', 'message', format('Milestone reached! %s/%s purchases', v_purchase_count, v_required), 'progress', v_purchase_count, 'required', v_required);
    END;
  END IF;

  -- ═══════════════════════════════════════════════════
  -- MERCH-VALIDATED
  -- ═══════════════════════════════════════════════════
  IF p_bounty_id = 'first-merch' THEN
    IF v_merch_count = 0 THEN
      RETURN jsonb_build_object('success', false, 'status', 'not_eligible', 'message', 'Buy NCTR merch to unlock this bounty');
    END IF;
    SELECT id INTO v_existing_claim FROM merch_milestones
    WHERE user_id = p_user_id AND milestone_key = 'first-merch' LIMIT 1;
    IF v_existing_claim IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'status', 'already_claimed', 'message', 'First Merch bounty already claimed');
    END IF;
    RETURN jsonb_build_object('success', true, 'status', 'eligible', 'message', 'Merch purchase verified!', 'merch_purchases', v_merch_count);
  END IF;

  IF p_bounty_id = 'every-merch' THEN
    RETURN jsonb_build_object('success', true, 'status', 'auto_drip', 'message', 'NCTR auto-awarded on each merch purchase', 'merch_purchases', v_merch_count);
  END IF;

  -- ═══════════════════════════════════════════════════
  -- REFERRAL-VALIDATED
  -- ═══════════════════════════════════════════════════
  SELECT COUNT(*) INTO v_referral_count FROM referrals WHERE referrer_id = v_auth_user_id;

  IF p_bounty_id IN ('referral-signup', 'referral-first-purchase', 'referral-every-purchase') THEN
    RETURN jsonb_build_object('success', true, 'status', 'auto_drip', 'message', 'Referral rewards are auto-awarded when your referrals take action', 'referrals', v_referral_count);
  END IF;

  IF p_bounty_id IN ('referral-5-purchases', 'referral-10-purchases') THEN
    DECLARE v_ref_required INT; v_max_ref_purchases INT;
    BEGIN
      v_ref_required := CASE p_bounty_id WHEN 'referral-5-purchases' THEN 5 ELSE 10 END;
      
      -- Get max purchases from any single referral
      SELECT COALESCE(MAX(purchase_count), 0) INTO v_max_ref_purchases
      FROM (
        SELECT COUNT(*) as purchase_count
        FROM shop_transactions st
        JOIN referrals r ON st.user_id = r.referred_id::text
        WHERE r.referrer_id = v_auth_user_id
        GROUP BY st.user_id
      ) sub;

      IF v_max_ref_purchases < v_ref_required THEN
        RETURN jsonb_build_object(
          'success', false, 'status', 'not_eligible',
          'message', format('Best referral has %s/%s purchases', v_max_ref_purchases, v_ref_required),
          'progress', v_max_ref_purchases, 'required', v_ref_required
        );
      END IF;

      RETURN jsonb_build_object('success', true, 'status', 'eligible', 'message', format('Referral milestone reached! %s+ purchases', v_ref_required));
    END;
  END IF;

  -- ═══════════════════════════════════════════════════
  -- CONTENT CREATION (manual review)
  -- ═══════════════════════════════════════════════════
  IF p_bounty_id = 'content-creation' THEN
    IF p_submission_url IS NULL OR length(trim(p_submission_url)) = 0 THEN
      RETURN jsonb_build_object('success', false, 'status', 'error', 'message', 'Please provide a link to your content');
    END IF;
    
    -- Insert into content_submissions
    INSERT INTO content_submissions (
      source_id, source_type, source_name, title, description, media_url, status
    ) VALUES (
      v_auth_user_id::text, 'user', 
      (SELECT COALESCE(display_name, email) FROM unified_profiles WHERE id = p_user_id),
      'Content Submission', 
      COALESCE(p_submission_notes, ''),
      p_submission_url, 
      'pending'
    );

    -- Insert notification
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (v_auth_user_id, 'bounty_pending', 'Content Submitted', 'Your content submission is pending review. We''ll notify you when it''s approved.');

    RETURN jsonb_build_object('success', true, 'status', 'pending', 'message', 'Content submitted for review! We''ll notify you when approved.');
  END IF;

  -- Default fallback
  RETURN jsonb_build_object('success', false, 'status', 'error', 'message', 'Unknown bounty type');
END;
$$;

-- Create get_bounty_earnings_history RPC
CREATE OR REPLACE FUNCTION public.get_bounty_earnings_history(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  source TEXT,
  title TEXT,
  amount NUMERIC,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_auth_user_id UUID;
BEGIN
  SELECT auth_user_id INTO v_auth_user_id
  FROM unified_profiles WHERE id = p_user_id;

  RETURN QUERY
  -- Bounty claims
  SELECT
    bc.id,
    'bounty'::TEXT as source,
    b.title,
    bc.nctr_earned::NUMERIC as amount,
    bc.status,
    bc.created_at
  FROM bounty_claims bc
  JOIN bounties b ON bc.bounty_id = b.id
  WHERE bc.user_id = v_auth_user_id

  UNION ALL

  -- Shop transactions (purchases)
  SELECT
    st.id,
    CASE WHEN st.is_merch THEN 'merch'::TEXT ELSE 'purchase'::TEXT END as source,
    COALESCE(st.customer_name, 'Purchase') as title,
    st.nctr_earned::NUMERIC as amount,
    'approved'::TEXT as status,
    st.created_at
  FROM shop_transactions st
  WHERE st.user_id = p_user_id

  UNION ALL

  -- NCTR transactions (referrals, signup bonus, etc)
  SELECT
    nt.id,
    nt.source,
    COALESCE(nt.notes, nt.source) as title,
    nt.final_amount::NUMERIC as amount,
    'approved'::TEXT as status,
    nt.created_at
  FROM nctr_transactions nt
  WHERE nt.user_id = p_user_id

  ORDER BY created_at DESC
  LIMIT 50;
END;
$$;
