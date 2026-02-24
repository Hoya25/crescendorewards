
CREATE OR REPLACE FUNCTION public.check_handle_available(p_handle text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  clean_handle text;
  reservation record;
BEGIN
  clean_handle := lower(trim(p_handle));

  -- Validate format: 3-30 chars, alphanumeric + underscores only
  IF clean_handle !~ '^[a-z0-9_]{3,30}$' THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'invalid_format',
      'message', 'Handle must be 3-30 characters, letters, numbers, and underscores only'
    );
  END IF;

  -- Cannot start or end with underscore
  IF clean_handle LIKE E'\\_%' OR clean_handle LIKE E'%\\_' THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'invalid_format',
      'message', 'Handle cannot start or end with an underscore'
    );
  END IF;

  -- Check reserved_handles table (skip expired VIP holds)
  SELECT * INTO reservation
  FROM reserved_handles
  WHERE handle = clean_handle
    AND (expires_at IS NULL OR expires_at > now());

  IF FOUND THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'reserved',
      'category', reservation.category,
      'message', CASE reservation.category
        WHEN 'brand' THEN 'This handle is reserved (brand name)'
        WHEN 'engine' THEN 'This handle is reserved (Impact Engine)'
        WHEN 'system' THEN 'This handle is reserved (system term)'
        WHEN 'vip' THEN 'This handle is temporarily reserved'
        WHEN 'offensive' THEN 'This handle is not available'
        WHEN 'squatting' THEN 'This handle is reserved'
        ELSE 'This handle is reserved'
      END
    );
  END IF;

  -- Check if already claimed by another user
  IF EXISTS (SELECT 1 FROM unified_profiles WHERE handle = clean_handle) THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'taken',
      'message', 'This handle is already claimed'
    );
  END IF;

  -- Available!
  RETURN jsonb_build_object(
    'available', true,
    'reason', 'available',
    'message', 'Handle is available'
  );
END;
$$;
