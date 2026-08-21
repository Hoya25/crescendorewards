-- Admin-only reporting: never reachable without a session.
REVOKE ALL ON FUNCTION public.get_admin_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_admin_dashboard_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_recent_admin_activity(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_tier_user_counts() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_sponsor_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_recent_admin_activity(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_tier_user_counts() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_sponsor_stats(uuid) TO authenticated, service_role;

-- Per-member reads: signed-in only (each already scopes the subject server-side).
REVOKE ALL ON FUNCTION public.check_merch_milestones(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.check_purchase_milestones(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.check_referral_milestones(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_bounty_earnings_history(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_checkin_streak(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_merch_milestones(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_purchase_milestones(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_share_status(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_with_tier(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_task_progress() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_share_analytics() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_reward_watch_count(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_member_reward_price(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.check_handle_available(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.check_slug_availability(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_merch_milestones(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_purchase_milestones(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_referral_milestones(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_bounty_earnings_history(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_checkin_streak(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_merch_milestones(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_purchase_milestones(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_share_status(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_with_tier(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_task_progress() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_share_analytics() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_reward_watch_count(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_member_reward_price(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_handle_available(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_slug_availability(text, uuid) TO authenticated, service_role;

-- Value-bearing writes: signed-in only.
REVOKE ALL ON FUNCTION public.claim_reward(uuid, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.gear_vault_claim_item(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.groundball_select_reward(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.groundball_swap_reward(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.groundball_redeem_selection(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.groundball_purchase_bonus_slot() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_reward_version(uuid, text, text, text, text, text, text, integer, integer, integer, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_reward(uuid, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.gear_vault_claim_item(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.groundball_select_reward(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.groundball_swap_reward(uuid, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.groundball_redeem_selection(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.groundball_purchase_bonus_slot() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_reward_version(uuid, text, text, text, text, text, text, integer, integer, integer, text, text) TO authenticated, service_role;

-- Internal helpers: no client access at all.
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_admin_permission(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_unified_profile_id(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.track_reward_conversion(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_admin_permission(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_unified_profile_id(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO service_role;
GRANT EXECUTE ON FUNCTION public.track_reward_conversion(text, uuid) TO authenticated, service_role;

-- Intentionally still reachable without signing in:
--   get_public_stats()                  aggregate, non-identifying landing stats
--   get_referral_code_by_handle(text)   public /r/<handle> redirect
--   get_referral_code_by_slug(text)     public /r/<slug> redirect