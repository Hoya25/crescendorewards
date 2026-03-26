CREATE OR REPLACE FUNCTION public.get_handle_by_email(
  lookup_email text
)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT handle 
  FROM unified_profiles 
  WHERE LOWER(email) = LOWER(lookup_email)
    AND handle IS NOT NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_handle_by_email(text) TO anon, authenticated;