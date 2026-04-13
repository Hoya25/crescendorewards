-- Security definer function to get the unified_profile id for the current auth user
CREATE OR REPLACE FUNCTION public.get_unified_profile_id(_auth_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.unified_profiles WHERE auth_user_id = _auth_id LIMIT 1;
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own onboarding" ON user_onboarding;
DROP POLICY IF EXISTS "Users can view own onboarding" ON user_onboarding;
DROP POLICY IF EXISTS "Users can read own onboarding" ON user_onboarding;
DROP POLICY IF EXISTS "Users can update own onboarding" ON user_onboarding;

-- Recreate with correct lookup
CREATE POLICY "Users can insert own onboarding"
ON user_onboarding
FOR INSERT
TO authenticated
WITH CHECK (user_id = public.get_unified_profile_id(auth.uid()));

CREATE POLICY "Users can read own onboarding"
ON user_onboarding
FOR SELECT
TO authenticated
USING (user_id = public.get_unified_profile_id(auth.uid()));

CREATE POLICY "Users can update own onboarding"
ON user_onboarding
FOR UPDATE
TO authenticated
USING (user_id = public.get_unified_profile_id(auth.uid()))
WITH CHECK (user_id = public.get_unified_profile_id(auth.uid()));