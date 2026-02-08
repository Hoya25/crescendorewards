
-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Users can submit content" ON content_submissions;

-- Users can only insert their own content
CREATE POLICY "Users can submit own content"
ON content_submissions FOR INSERT
TO authenticated
WITH CHECK (source_id = auth.uid());

-- Admins can insert with any source_id (the existing FOR ALL policy covers this,
-- but an explicit INSERT policy ensures clarity)
CREATE POLICY "Admins can insert any content"
ON content_submissions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);
