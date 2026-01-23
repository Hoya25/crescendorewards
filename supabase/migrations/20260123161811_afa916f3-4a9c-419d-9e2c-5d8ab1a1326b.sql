-- Allow admin team members to search/view unified user profiles (needed for Invite Admin search)
-- Note: unified_profiles contains PII (email), so restrict to privileged roles only.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'unified_profiles'
      AND policyname = 'Admins can read all unified profiles'
  ) THEN
    CREATE POLICY "Admins can read all unified profiles"
    ON public.unified_profiles
    FOR SELECT
    USING (
      public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'moderator')
    );
  END IF;
END $$;