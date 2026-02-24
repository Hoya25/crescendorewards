CREATE OR REPLACE FUNCTION public.check_handle_available(p_handle text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_clean text;
  v_blocked text[] := ARRAY[
    'admin', 'nctr', 'crescendo', 'garden', 'butterfly', 'support', 'help',
    'mod', 'moderator', 'system', 'official', 'throttle',
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