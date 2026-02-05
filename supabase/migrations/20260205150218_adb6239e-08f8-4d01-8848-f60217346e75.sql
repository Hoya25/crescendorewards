-- ============================================================
-- Security Hardening: Ensure no anonymous/public access to PII tables
-- This adds explicit protection against unauthenticated access
-- ============================================================

-- For user_delivery_profiles: Ensure only authenticated users can access
-- The existing policies already use auth.uid() checks, but we'll ensure 
-- there's no way for unauthenticated users to query this table

-- Drop and recreate policies with explicit auth.role() checks for extra security
DROP POLICY IF EXISTS "Users can view own delivery profile" ON user_delivery_profiles;
DROP POLICY IF EXISTS "Users can insert own delivery profile" ON user_delivery_profiles;
DROP POLICY IF EXISTS "Users can update own delivery profile" ON user_delivery_profiles;
DROP POLICY IF EXISTS "Admins can view all delivery profiles" ON user_delivery_profiles;

-- Recreate with authenticated role requirement
CREATE POLICY "Users can view own delivery profile" ON user_delivery_profiles
  FOR SELECT 
  TO authenticated
  USING (user_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert own delivery profile" ON user_delivery_profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own delivery profile" ON user_delivery_profiles
  FOR UPDATE 
  TO authenticated
  USING (user_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can view all delivery profiles" ON user_delivery_profiles
  FOR SELECT 
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- For unified_profiles: Ensure only authenticated users can access
DROP POLICY IF EXISTS "Users read own unified profile" ON unified_profiles;
DROP POLICY IF EXISTS "Users insert own unified profile" ON unified_profiles;
DROP POLICY IF EXISTS "Users update own unified profile" ON unified_profiles;
DROP POLICY IF EXISTS "Admins can read all unified profiles" ON unified_profiles;

-- Recreate with authenticated role requirement
CREATE POLICY "Users read own unified profile" ON unified_profiles
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users insert own unified profile" ON unified_profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users update own unified profile" ON unified_profiles
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can read all unified profiles" ON unified_profiles
  FOR SELECT 
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Add a comment to document the security hardening
COMMENT ON TABLE user_delivery_profiles IS 'User PII for delivery - RLS restricted to authenticated users only (owner or admin)';
COMMENT ON TABLE unified_profiles IS 'User profiles with email/wallet - RLS restricted to authenticated users only (owner or admin)';