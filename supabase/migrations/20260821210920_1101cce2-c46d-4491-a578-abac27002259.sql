REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_reward_from_submission() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trigger_recalculate_tier() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_unified_to_profiles() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_watchers_on_restock() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.groundball_ensure_status(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_expired_nonces() FROM PUBLIC, anon, authenticated;

-- calculate_user_tier is invoked by admin tooling and the portfolio sync path.
REVOKE ALL ON FUNCTION public.calculate_user_tier(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.calculate_user_tier(uuid) TO authenticated, service_role;