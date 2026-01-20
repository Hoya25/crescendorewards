-- Strengthen RLS policies for profiles and rewards_claims tables

-- =====================================================
-- PROFILES TABLE - Add secure admin access policies
-- =====================================================

-- Add policy for admins to view all profiles (for admin panel operations)
-- Uses has_role() security definer function to prevent recursion
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add policy for admins to update profiles (for support operations like adjusting balances)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- REWARDS_CLAIMS TABLE - Policies already use has_role, verify they're correct
-- Current policies are secure. Adding explicit INSERT policy for admins
-- =====================================================

-- Allow admins to create claims on behalf of users (for gifting/support)
CREATE POLICY "Admins can create claims"
ON public.rewards_claims
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- Additional security: Add index to improve RLS query performance
-- =====================================================

-- Index on profiles.id for faster RLS checks (should exist but ensuring)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- Index on rewards_claims.user_id for faster RLS checks
CREATE INDEX IF NOT EXISTS idx_rewards_claims_user_id ON public.rewards_claims(user_id);

-- Index on user_roles for faster has_role() lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles(user_id, role);