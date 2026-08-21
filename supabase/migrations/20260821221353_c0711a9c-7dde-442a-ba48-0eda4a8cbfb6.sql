-- Regression fix: get_unified_profile_id() is referenced by 3 RLS policies, which are
-- evaluated as the calling role, so signed-in members must be able to execute it.
-- The earlier blanket revoke broke onboarding reads (42501 permission denied).
GRANT EXECUTE ON FUNCTION public.get_unified_profile_id(uuid) TO authenticated, service_role;