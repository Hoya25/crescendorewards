
-- Create handle_audit_log table for admin actions
CREATE TABLE IF NOT EXISTS public.handle_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid REFERENCES unified_profiles(id),
  action text NOT NULL,
  target_handle text NOT NULL,
  target_user_id uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE handle_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log"
  ON handle_audit_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert audit log"
  ON handle_audit_log FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_handle_audit_log_handle ON handle_audit_log(target_handle);
CREATE INDEX idx_handle_audit_log_created ON handle_audit_log(created_at DESC);

-- Replace claim_handle to require Bronze status
CREATE OR REPLACE FUNCTION public.claim_handle(p_user_id uuid, p_handle text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  clean_handle text;
  availability jsonb;
  user_profile record;
  v_locked_nctr numeric;
BEGIN
  clean_handle := lower(trim(p_handle));

  -- Check availability first
  availability := check_handle_available(clean_handle);
  IF NOT (availability->>'available')::boolean THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', COALESCE(availability->>'message', 'Handle not available')
    );
  END IF;

  -- Get user profile
  SELECT * INTO user_profile
  FROM unified_profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Check if user already has a handle
  IF user_profile.handle IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You already have a handle: @' || user_profile.handle);
  END IF;

  -- Check Bronze status: need 100+ NCTR locked
  SELECT COALESCE(SUM(COALESCE(nctr_360_locked, 0) + COALESCE(nctr_90_locked, 0)), 0)
  INTO v_locked_nctr
  FROM wallet_portfolio
  WHERE user_id = p_user_id;

  -- Fallback to crescendo_data
  IF v_locked_nctr = 0 THEN
    v_locked_nctr := COALESCE((user_profile.crescendo_data->>'locked_nctr')::numeric, 0);
  END IF;

  IF v_locked_nctr < 100 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Bronze status required (100+ NCTR locked). You have ' || v_locked_nctr::text || ' locked.',
      'locked_nctr', v_locked_nctr,
      'required', 100
    );
  END IF;

  -- Claim the handle
  UPDATE unified_profiles
  SET handle = clean_handle, updated_at = now()
  WHERE id = p_user_id;

  -- Award 250 NCTR bounty for claiming handle
  INSERT INTO nctr_transactions (user_id, base_amount, final_amount, source, notes, status_multiplier, merch_lock_multiplier)
  VALUES (p_user_id, 250, 250, 'bounty', 'Claimed @' || clean_handle || ' handle', 1.0, 1.0);

  RETURN jsonb_build_object(
    'success', true,
    'handle', clean_handle
  );
END;
$$;
