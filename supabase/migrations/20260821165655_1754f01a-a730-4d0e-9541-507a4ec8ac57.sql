-- 1. Drop the parameter-trusting versions
DROP FUNCTION IF EXISTS public.admin_credit_claims(uuid, uuid, integer, text, text);
DROP FUNCTION IF EXISTS public.send_gift_from_balance(uuid, text, integer, text);

-- Helper: resolve the calling member's unified profile id from auth.uid()
CREATE OR REPLACE FUNCTION public.current_unified_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.unified_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_unified_profile_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_unified_profile_id() TO authenticated, service_role;

-- 2. admin_credit_claims: actor derived from auth.uid(), admin verified server-side
CREATE OR REPLACE FUNCTION public.admin_credit_claims(
  p_recipient_id uuid,
  p_claims_amount integer,
  p_message text DEFAULT NULL,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid;
  v_is_service boolean := (coalesce(auth.role(), '') = 'service_role');
  v_is_admin boolean := false;
  v_auth_user_id uuid;
BEGIN
  IF p_claims_amount IS NULL OR p_claims_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;

  IF NOT v_is_service THEN
    IF auth.uid() IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    SELECT id INTO v_actor_id FROM unified_profiles WHERE auth_user_id = auth.uid() LIMIT 1;

    SELECT EXISTS (
      SELECT 1 FROM admin_users
      WHERE is_active = true
        AND (user_id = v_actor_id OR user_id = auth.uid())
    ) OR public.has_role(auth.uid(), 'admin') INTO v_is_admin;

    IF NOT v_is_admin THEN
      RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;
  END IF;

  SELECT auth_user_id INTO v_auth_user_id FROM unified_profiles WHERE id = p_recipient_id;
  IF v_auth_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recipient not found');
  END IF;

  INSERT INTO claim_gifts (
    sender_id, recipient_id, claims_amount, message, gift_code,
    status, is_admin_gift, admin_notes, claimed_at
  ) VALUES (
    v_actor_id, p_recipient_id, p_claims_amount, p_message, generate_gift_code(),
    'claimed', true, p_admin_notes, now()
  );

  UPDATE profiles
  SET claim_balance = claim_balance + p_claims_amount,
      updated_at = now()
  WHERE id = v_auth_user_id;

  RETURN jsonb_build_object('success', true, 'claims_credited', p_claims_amount, 'recipient_id', p_recipient_id);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_credit_claims(uuid, integer, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_credit_claims(uuid, integer, text, text) TO authenticated, service_role;

-- 3. send_gift_from_balance: sender derived from auth.uid()
CREATE OR REPLACE FUNCTION public.send_gift_from_balance(
  p_recipient_email text,
  p_claims_amount integer,
  p_message text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id uuid;
  v_sender_auth_id uuid := auth.uid();
  v_sender_balance integer;
  v_gift_code text;
  v_gift_id uuid;
  v_recipient_id uuid;
BEGIN
  IF v_sender_auth_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF p_claims_amount IS NULL OR p_claims_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;

  SELECT id INTO v_sender_id FROM unified_profiles WHERE auth_user_id = v_sender_auth_id LIMIT 1;

  SELECT claim_balance INTO v_sender_balance FROM profiles WHERE id = v_sender_auth_id;

  IF v_sender_balance IS NULL OR v_sender_balance < p_claims_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  SELECT id INTO v_recipient_id FROM unified_profiles WHERE lower(email) = lower(p_recipient_email);

  v_gift_code := generate_gift_code();

  UPDATE profiles
  SET claim_balance = claim_balance - p_claims_amount,
      updated_at = now()
  WHERE id = v_sender_auth_id;

  INSERT INTO claim_gifts (
    sender_id, recipient_id, recipient_email, claims_amount, message,
    gift_code, status, is_purchased, is_admin_gift
  ) VALUES (
    v_sender_id, v_recipient_id, p_recipient_email, p_claims_amount, p_message,
    v_gift_code, 'pending', false, false
  ) RETURNING id INTO v_gift_id;

  RETURN jsonb_build_object('success', true, 'gift_id', v_gift_id, 'gift_code', v_gift_code, 'claims_sent', p_claims_amount);
END;
$$;

REVOKE ALL ON FUNCTION public.send_gift_from_balance(text, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_gift_from_balance(text, integer, text) TO authenticated, service_role;