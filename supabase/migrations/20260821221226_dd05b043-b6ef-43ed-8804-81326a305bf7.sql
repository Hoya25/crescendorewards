-- 1. Close the residual default PUBLIC EXECUTE grants.

-- Trigger-only functions: never called directly by any client.
REVOKE ALL ON FUNCTION public.block_client_financial_writes() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.block_deposit_client_writes() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.block_gear_vault_client_writes() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.block_groundball_counter_writes() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_unlocks_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_reward_tier_gate() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_admin_users_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_delivery_profile_updated_at() FROM PUBLIC, anon, authenticated;

-- Internal helper: gift codes are minted only inside definer functions.
REVOKE ALL ON FUNCTION public.generate_gift_code() FROM PUBLIC, anon, authenticated;

-- Pure predicates (no data access): keep reachable but make the grant explicit.
REVOKE ALL ON FUNCTION public.is_reserved_slug(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_valid_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_reserved_slug(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_valid_slug(text) TO anon, authenticated, service_role;

-- Intentionally anonymous surfaces (landing stats, invite redirects):
-- replace the implicit PUBLIC default with explicit role grants.
REVOKE ALL ON FUNCTION public.get_public_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_referral_code_by_handle(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_referral_code_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_referral_code_by_handle(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_referral_code_by_slug(text) TO anon, authenticated, service_role;

-- 2. Remove the dead task-progress surface: it queries earn_tasks /
-- user_task_completions, which do not exist and never did, and nothing calls it.
DROP FUNCTION IF EXISTS public.get_user_task_progress();