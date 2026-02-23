
-- Add handle column to unified_profiles
ALTER TABLE public.unified_profiles ADD COLUMN IF NOT EXISTS handle text;

-- Create unique index (only on non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unified_profiles_handle ON public.unified_profiles(handle) WHERE handle IS NOT NULL;

-- RPC to claim a handle with validation
CREATE OR REPLACE FUNCTION public.claim_handle(p_user_id uuid, p_handle text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_clean_handle text;
  v_existing uuid;
  v_blocked text[] := ARRAY[
    'admin', 'nctr', 'crescendo', 'garden', 'butterfly', 'support', 'help',
    'mod', 'moderator', 'system', 'official', 'anderson', 'throttle',
    'groundball', 'stardust', 'sweat', 'sisu', 'inspiration', 'shift', 'nctralliance'
  ];
BEGIN
  -- Normalize
  v_clean_handle := lower(trim(p_handle));

  -- Check if user already has a handle
  IF EXISTS (SELECT 1 FROM unified_profiles WHERE id = p_user_id AND handle IS NOT NULL) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You already have a handle');
  END IF;

  -- Validate format: 3-20 chars, letters/numbers/underscores, cannot start with number
  IF v_clean_handle !~ '^[a-z_][a-z0-9_]{2,19}$' THEN
    RETURN jsonb_build_object('success', false, 'error', '3-20 characters, letters/numbers/underscores only. Cannot start with a number.');
  END IF;

  -- Check blocked list
  IF v_clean_handle = ANY(v_blocked) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This handle is reserved');
  END IF;

  -- Check availability
  SELECT id INTO v_existing FROM unified_profiles WHERE handle = v_clean_handle;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already taken');
  END IF;

  -- Claim it
  UPDATE unified_profiles SET handle = v_clean_handle, updated_at = now() WHERE id = p_user_id;

  -- Award 250 NCTR bounty
  INSERT INTO nctr_transactions (user_id, base_amount, final_amount, source, notes, status_multiplier, merch_lock_multiplier)
  VALUES (p_user_id, 250, 250, 'bounty', 'Claimed @' || v_clean_handle || ' handle', 1, 1);

  -- Update locked NCTR in profiles
  UPDATE profiles SET locked_nctr = locked_nctr + 250
  WHERE id = (SELECT auth_user_id FROM unified_profiles WHERE id = p_user_id);

  -- Add notification
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    (SELECT auth_user_id FROM unified_profiles WHERE id = p_user_id),
    'bounty_claimed',
    '🎉 Handle Claimed!',
    'You are now @' || v_clean_handle || ' on Crescendo! +250 NCTR (360LOCK)'
  );

  RETURN jsonb_build_object('success', true, 'handle', v_clean_handle, 'nctr_awarded', 250);
END;
$$;

-- RPC to check handle availability
CREATE OR REPLACE FUNCTION public.check_handle_available(p_handle text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_clean text;
  v_blocked text[] := ARRAY[
    'admin', 'nctr', 'crescendo', 'garden', 'butterfly', 'support', 'help',
    'mod', 'moderator', 'system', 'official', 'anderson', 'throttle',
    'groundball', 'stardust', 'sweat', 'sisu', 'inspiration', 'shift', 'nctralliance'
  ];
BEGIN
  v_clean := lower(trim(p_handle));

  IF v_clean !~ '^[a-z_][a-z0-9_]{2,19}$' THEN
    RETURN jsonb_build_object('available', false, 'reason', 'invalid_format');
  END IF;

  IF v_clean = ANY(v_blocked) THEN
    RETURN jsonb_build_object('available', false, 'reason', 'reserved');
  END IF;

  IF EXISTS (SELECT 1 FROM unified_profiles WHERE handle = v_clean) THEN
    RETURN jsonb_build_object('available', false, 'reason', 'taken');
  END IF;

  RETURN jsonb_build_object('available', true);
END;
$$;

-- RPC to look up a user by handle (for referral routing)
CREATE OR REPLACE FUNCTION public.get_referral_code_by_handle(p_handle text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral_code text;
  v_referral_slug text;
BEGIN
  SELECT 
    cd->>'referral_code',
    up.referral_slug
  INTO v_referral_code, v_referral_slug
  FROM unified_profiles up,
  LATERAL (SELECT COALESCE(up.crescendo_data, '{}'::jsonb) as cd) sub
  WHERE up.handle = lower(trim(p_handle));

  IF v_referral_code IS NULL AND v_referral_slug IS NULL THEN
    -- Try profiles table
    SELECT p.referral_code INTO v_referral_code
    FROM profiles p
    JOIN unified_profiles up ON up.auth_user_id = p.id
    WHERE up.handle = lower(trim(p_handle));
  END IF;

  IF v_referral_code IS NULL AND v_referral_slug IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Handle not found');
  END IF;

  RETURN jsonb_build_object('success', true, 'referral_code', COALESCE(v_referral_slug, v_referral_code));
END;
$$;
