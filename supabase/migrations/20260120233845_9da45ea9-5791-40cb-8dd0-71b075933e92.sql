-- Fix overly permissive RLS policies that use USING (true) or WITH CHECK (true)

-- =====================================================
-- REWARD_SHARES TABLE - Fix "System can update reward shares" policy
-- =====================================================
DROP POLICY IF EXISTS "System can update reward shares" ON public.reward_shares;
-- Replace with service_role only access (for database functions)
CREATE POLICY "Service role can update reward shares"
ON public.reward_shares
FOR UPDATE
USING (auth.role() = 'service_role');

-- =====================================================
-- REWARD_WATCHLIST TABLE - Fix "System can update watchlist" policy
-- =====================================================
DROP POLICY IF EXISTS "System can update watchlist" ON public.reward_watchlist;
-- Replace with service_role only access (for triggers/functions)
CREATE POLICY "Service role can update watchlist"
ON public.reward_watchlist
FOR UPDATE
USING (auth.role() = 'service_role');

-- =====================================================
-- REFERRALS TABLE - Fix "System can insert referrals" policy
-- =====================================================
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;
-- Replace with service_role only access (for database functions)
CREATE POLICY "Service role can insert referrals"
ON public.referrals
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- NOTIFICATIONS TABLE - Fix "System can insert notifications" policy
-- =====================================================
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
-- Replace with service_role only access (for triggers/functions)
CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- REWARD_SUBMISSION_CHANGES TABLE - Fix "System can insert submission changes" policy
-- =====================================================
DROP POLICY IF EXISTS "System can insert submission changes" ON public.reward_submission_changes;
-- Replace with service_role only access (for database functions)
CREATE POLICY "Service role can insert submission changes"
ON public.reward_submission_changes
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- CROSS_PLATFORM_ACTIVITY_LOG TABLE - Fix "System insert cross platform activity" policy
-- =====================================================
DROP POLICY IF EXISTS "System insert cross platform activity" ON public.cross_platform_activity_log;
-- Replace with service_role only access (for database functions)
CREATE POLICY "Service role can insert cross platform activity"
ON public.cross_platform_activity_log
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- MEMBERSHIP_HISTORY TABLE - Fix permissive insert policy if exists
-- =====================================================
-- The current policy allows auth.uid() = user_id which is correct, no change needed