-- Fix: Restrict admin_users table access to admins only (not moderators)
-- Moderators don't need to see the admin user list, which could expose privileged account IDs

-- Drop the existing policy that allows moderators to view
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;

-- Create a new policy that only allows admins (not moderators) to view
CREATE POLICY "Only admins can view admin users"
ON public.admin_users
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add a policy that allows users to see their own admin record (for UI purposes)
CREATE POLICY "Users can view own admin record"
ON public.admin_users
FOR SELECT
USING (user_id IN (
  SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
));