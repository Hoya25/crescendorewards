CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select coalesce(auth.role(), '') <> 'anon'
     and exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

CREATE OR REPLACE FUNCTION public.has_admin_permission(check_user_id uuid, required_permission text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(), '') = 'anon' THEN RETURN false; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = check_user_id AND is_active = true
      AND (role = 'super_admin' OR permissions ? required_permission)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon;
GRANT EXECUTE ON FUNCTION public.has_admin_permission(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_self_or_admin(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.current_unified_profile_id() TO anon;

ALTER POLICY "Admins can view activity log" ON public.admin_activity_log TO authenticated;
ALTER POLICY "Admins can manage templates" ON public.admin_adjustment_templates TO authenticated;
ALTER POLICY "Admins can view NCTR adjustments" ON public.admin_nctr_adjustments TO authenticated;
ALTER POLICY "Users can view own NCTR adjustments" ON public.admin_nctr_adjustments TO authenticated;
ALTER POLICY "Admins can view all user notifications" ON public.admin_user_notifications TO authenticated;
ALTER POLICY "Users can view own notifications" ON public.admin_user_notifications TO authenticated;
ALTER POLICY "Users can view own admin record" ON public.admin_users TO authenticated;
ALTER POLICY "Users can view their own benefit history" ON public.benefit_activation_history TO authenticated;
ALTER POLICY "Admins can view all gifts" ON public.claim_gifts TO authenticated;
ALTER POLICY "Users can view gifts sent to them" ON public.claim_gifts TO authenticated;
ALTER POLICY "Users can view gifts they sent" ON public.claim_gifts TO authenticated;
ALTER POLICY "Users read own cross platform activity" ON public.cross_platform_activity_log TO authenticated;
ALTER POLICY "Admins can view all handle history" ON public.handle_history TO authenticated;
ALTER POLICY "Users can view own handle history" ON public.handle_history TO authenticated;
ALTER POLICY "Users can view their own active benefits" ON public.member_active_benefits TO authenticated;
ALTER POLICY "Users can read own merch milestones" ON public.merch_milestones TO authenticated;
ALTER POLICY "Users can view own notification settings" ON public.notification_settings TO authenticated;
ALTER POLICY "Users can read own milestones" ON public.purchase_milestones TO authenticated;
ALTER POLICY "Admins can view all shop transactions" ON public.shop_transactions TO authenticated;
ALTER POLICY "Users can view own shop transactions" ON public.shop_transactions TO authenticated;
ALTER POLICY "Admins can manage sponsor applications" ON public.sponsor_applications TO authenticated;
ALTER POLICY "Users can view own applications" ON public.sponsor_applications TO authenticated;
ALTER POLICY "Admins can manage sponsorship campaigns" ON public.sponsorship_campaigns TO authenticated;
ALTER POLICY "Sponsors can view own campaigns" ON public.sponsorship_campaigns TO authenticated;
ALTER POLICY "Admins can view all sponsorship transactions" ON public.sponsorship_transactions TO authenticated;
ALTER POLICY "Sponsors can view own transactions" ON public.sponsorship_transactions TO authenticated;
ALTER POLICY "Admins can read all activity" ON public.user_activity TO authenticated;
ALTER POLICY "Users can read own activity" ON public.user_activity TO authenticated;
ALTER POLICY "Admins can read all sessions" ON public.user_sessions TO authenticated;
ALTER POLICY "Users can read own sessions" ON public.user_sessions TO authenticated;
ALTER POLICY "Users read own portfolio" ON public.wallet_portfolio TO authenticated;

ALTER POLICY "Reward images visible for live rewards, own uploads or admins" ON public.reward_images TO authenticated;
CREATE POLICY "Signed-out visitors see images of live rewards" ON public.reward_images
  FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.rewards r WHERE r.id = reward_images.reward_id AND r.is_active = true));

GRANT SELECT (id, title, description, content_type, media_url, thumbnail_url, source_type, source_name,
              source_avatar_url, reward_id, status, view_count, is_featured, rating, helpful_count,
              submitted_at, created_at, updated_at)
  ON public.content_submissions TO anon;
CREATE POLICY "Signed-out visitors read published community content" ON public.content_submissions
  FOR SELECT TO anon
  USING (status IN ('published', 'featured'));

GRANT EXECUTE ON FUNCTION public.get_reward_watch_count(uuid) TO anon;