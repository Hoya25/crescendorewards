REVOKE ALL ON public.profiles            FROM anon;
REVOKE ALL ON public.unified_profiles    FROM anon;
REVOKE ALL ON public.content_submissions FROM anon;
REVOKE ALL ON public.nctr_deposits       FROM anon;

REVOKE ALL    ON public.gear_vault_items FROM anon;
GRANT  SELECT ON public.gear_vault_items TO   anon;