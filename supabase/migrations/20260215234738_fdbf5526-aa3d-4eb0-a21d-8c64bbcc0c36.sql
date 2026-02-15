
-- Add founding 111 vetting columns to unified_profiles
-- (founding_111 and founding_111_number already exist from prior migration)
ALTER TABLE public.unified_profiles
  ADD COLUMN IF NOT EXISTS founding_111_candidate boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS founding_111_qualified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS founding_111_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS founding_111_qualified_at timestamptz,
  ADD COLUMN IF NOT EXISTS founding_111_approved_at timestamptz;

-- Drop old functions that used the simpler auto-assign model
DROP FUNCTION IF EXISTS public.assign_founding_111(uuid);
DROP FUNCTION IF EXISTS public.get_founding_111_count();

-- Get count of approved founding 111 members
CREATE OR REPLACE FUNCTION public.get_founding_111_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM unified_profiles WHERE founding_111_approved = true;
$$;

-- Check if a user qualifies for Founding 111
-- Qualification: at least 1 purchase AND at least 1 referral who has made a purchase
CREATE OR REPLACE FUNCTION public.check_founding_111_qualification(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id uuid;
  v_is_candidate boolean;
  v_already_qualified boolean;
  v_purchase_count integer;
  v_referral_purchase_count integer;
  v_display_name text;
  v_email text;
BEGIN
  -- Get profile info
  SELECT auth_user_id, founding_111_candidate, founding_111_qualified, display_name, email
  INTO v_auth_user_id, v_is_candidate, v_already_qualified, v_display_name, v_email
  FROM unified_profiles
  WHERE id = p_user_id;

  -- Must be a candidate and not already qualified
  IF NOT v_is_candidate OR v_already_qualified THEN
    RETURN jsonb_build_object(
      'qualified', COALESCE(v_already_qualified, false),
      'is_candidate', COALESCE(v_is_candidate, false),
      'purchase_count', 0,
      'referral_purchase_count', 0
    );
  END IF;

  -- Count user's purchases (from shop_transactions or purchases table)
  SELECT COUNT(*) INTO v_purchase_count
  FROM purchases
  WHERE user_id = v_auth_user_id AND status = 'completed';

  -- Count referrals who have made purchases
  SELECT COUNT(DISTINCT r.referred_id) INTO v_referral_purchase_count
  FROM referrals r
  JOIN purchases p ON p.user_id = r.referred_id AND p.status = 'completed'
  WHERE r.referrer_id = v_auth_user_id;

  -- Check qualification
  IF v_purchase_count >= 1 AND v_referral_purchase_count >= 1 THEN
    UPDATE unified_profiles
    SET founding_111_qualified = true,
        founding_111_qualified_at = now(),
        updated_at = now()
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
      'qualified', true,
      'newly_qualified', true,
      'is_candidate', true,
      'purchase_count', v_purchase_count,
      'referral_purchase_count', v_referral_purchase_count,
      'display_name', v_display_name,
      'email', v_email,
      'user_id', p_user_id
    );
  END IF;

  RETURN jsonb_build_object(
    'qualified', false,
    'is_candidate', true,
    'purchase_count', v_purchase_count,
    'referral_purchase_count', v_referral_purchase_count
  );
END;
$$;

-- Admin function to approve a founding 111 member
CREATE OR REPLACE FUNCTION public.approve_founding_111(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
  v_current_count integer;
  v_next_number integer;
  v_is_qualified boolean;
  v_already_approved boolean;
BEGIN
  v_admin_id := auth.uid();

  -- Check admin
  IF NOT has_role(v_admin_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT founding_111_qualified, founding_111_approved
  INTO v_is_qualified, v_already_approved
  FROM unified_profiles WHERE id = p_user_id;

  IF v_already_approved THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already approved');
  END IF;

  IF NOT v_is_qualified THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not qualified');
  END IF;

  -- Get next number atomically
  SELECT COUNT(*) INTO v_current_count FROM unified_profiles WHERE founding_111_approved = true;
  
  IF v_current_count >= 111 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Founding 111 is full');
  END IF;

  v_next_number := v_current_count + 1;

  UPDATE unified_profiles
  SET founding_111 = true,
      founding_111_approved = true,
      founding_111_approved_at = now(),
      founding_111_number = v_next_number,
      updated_at = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'founding_number', v_next_number
  );
END;
$$;

-- Admin function to reject a founding 111 candidate
CREATE OR REPLACE FUNCTION public.reject_founding_111(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  v_admin_id := auth.uid();

  IF NOT has_role(v_admin_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  UPDATE unified_profiles
  SET founding_111_qualified = false,
      founding_111_candidate = false,
      updated_at = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Get founding 111 candidates for admin review
CREATE OR REPLACE FUNCTION public.get_founding_111_candidates()
RETURNS TABLE(
  id uuid,
  auth_user_id uuid,
  display_name text,
  email text,
  created_at timestamptz,
  founding_111_candidate boolean,
  founding_111_qualified boolean,
  founding_111_approved boolean,
  founding_111_number integer,
  founding_111_qualified_at timestamptz,
  founding_111_approved_at timestamptz,
  purchase_count bigint,
  total_spend bigint,
  referral_count bigint,
  referral_purchases bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  v_admin_id := auth.uid();

  IF NOT has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    up.id,
    up.auth_user_id,
    up.display_name,
    up.email,
    up.created_at,
    up.founding_111_candidate,
    up.founding_111_qualified,
    up.founding_111_approved,
    up.founding_111_number,
    up.founding_111_qualified_at,
    up.founding_111_approved_at,
    COALESCE((SELECT COUNT(*) FROM purchases p WHERE p.user_id = up.auth_user_id AND p.status = 'completed'), 0) as purchase_count,
    COALESCE((SELECT SUM(p.amount_paid) FROM purchases p WHERE p.user_id = up.auth_user_id AND p.status = 'completed'), 0) as total_spend,
    COALESCE((SELECT COUNT(*) FROM referrals r WHERE r.referrer_id = up.auth_user_id), 0) as referral_count,
    COALESCE((
      SELECT COUNT(DISTINCT r.referred_id) 
      FROM referrals r 
      JOIN purchases p ON p.user_id = r.referred_id AND p.status = 'completed'
      WHERE r.referrer_id = up.auth_user_id
    ), 0) as referral_purchases
  FROM unified_profiles up
  WHERE up.founding_111_candidate = true
     OR up.founding_111_qualified = true
     OR up.founding_111_approved = true
  ORDER BY 
    up.founding_111_approved DESC,
    up.founding_111_qualified DESC,
    up.founding_111_qualified_at ASC,
    up.created_at ASC;
END;
$$;

-- Get founding 111 status for current user
CREATE OR REPLACE FUNCTION public.get_my_founding_111_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_purchase_count integer;
  v_referral_purchase_count integer;
  v_approved_count integer;
BEGIN
  SELECT * INTO v_profile FROM unified_profiles WHERE id = p_user_id;
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  SELECT COUNT(*) INTO v_approved_count FROM unified_profiles WHERE founding_111_approved = true;

  -- If approved
  IF v_profile.founding_111_approved THEN
    RETURN jsonb_build_object(
      'status', 'approved',
      'founding_number', v_profile.founding_111_number,
      'approved_count', v_approved_count
    );
  END IF;

  -- If full
  IF v_approved_count >= 111 THEN
    RETURN jsonb_build_object('status', 'closed', 'approved_count', v_approved_count);
  END IF;

  -- If qualified, pending review
  IF v_profile.founding_111_qualified THEN
    RETURN jsonb_build_object(
      'status', 'qualified_pending',
      'approved_count', v_approved_count
    );
  END IF;

  -- If candidate
  IF v_profile.founding_111_candidate THEN
    -- Get progress
    SELECT COUNT(*) INTO v_purchase_count
    FROM purchases WHERE user_id = v_profile.auth_user_id AND status = 'completed';

    SELECT COUNT(DISTINCT r.referred_id) INTO v_referral_purchase_count
    FROM referrals r
    JOIN purchases p ON p.user_id = r.referred_id AND p.status = 'completed'
    WHERE r.referrer_id = v_profile.auth_user_id;

    RETURN jsonb_build_object(
      'status', 'candidate',
      'has_purchase', v_purchase_count > 0,
      'has_referral_purchase', v_referral_purchase_count > 0,
      'approved_count', v_approved_count
    );
  END IF;

  -- Not a candidate
  RETURN jsonb_build_object(
    'status', 'not_candidate',
    'approved_count', v_approved_count
  );
END;
$$;

-- Assign candidate status to new signups (call during profile creation)
-- Sets founding_111_candidate = true for first 200 users
CREATE OR REPLACE FUNCTION public.assign_founding_111_candidate(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_users integer;
BEGIN
  SELECT COUNT(*) INTO v_total_users FROM unified_profiles;
  
  IF v_total_users <= 200 THEN
    UPDATE unified_profiles
    SET founding_111_candidate = true
    WHERE id = p_user_id;
    
    RETURN jsonb_build_object('is_candidate', true, 'user_number', v_total_users);
  END IF;

  RETURN jsonb_build_object('is_candidate', false, 'user_number', v_total_users);
END;
$$;
