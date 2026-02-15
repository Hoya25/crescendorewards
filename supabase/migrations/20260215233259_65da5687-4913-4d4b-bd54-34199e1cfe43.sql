
-- Add founding_111 tracking to unified_profiles
ALTER TABLE public.unified_profiles 
ADD COLUMN IF NOT EXISTS founding_111 boolean NOT NULL DEFAULT false;

ALTER TABLE public.unified_profiles 
ADD COLUMN IF NOT EXISTS founding_111_number integer;

-- Function to get current founding 111 count
CREATE OR REPLACE FUNCTION public.get_founding_111_count()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer FROM unified_profiles WHERE founding_111 = true;
$$;

-- Function to assign founding 111 status on signup
CREATE OR REPLACE FUNCTION public.assign_founding_111(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_count integer;
  v_founding_number integer;
BEGIN
  -- Get current count with lock to prevent race conditions
  SELECT COUNT(*) INTO v_current_count
  FROM unified_profiles
  WHERE founding_111 = true;

  IF v_current_count >= 111 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'full', 'count', v_current_count);
  END IF;

  v_founding_number := v_current_count + 1;

  UPDATE unified_profiles
  SET founding_111 = true,
      founding_111_number = v_founding_number,
      updated_at = now()
  WHERE id = p_user_id
    AND founding_111 = false;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_assigned_or_not_found');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'founding_number', v_founding_number,
    'count', v_founding_number
  );
END;
$$;
