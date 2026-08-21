CREATE OR REPLACE FUNCTION public.groundball_slots_for_tier(p_tier text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE p_tier
           WHEN 'gold'   THEN 7
           WHEN 'silver' THEN 4
           WHEN 'bronze' THEN 2
           ELSE 0
         END
$$;

REVOKE ALL ON FUNCTION public.groundball_slots_for_tier(text) FROM PUBLIC, anon, authenticated;