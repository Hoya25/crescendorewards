
-- Simplify INSERT policy for authenticated users
DROP POLICY IF EXISTS "Users can submit own content" ON content_submissions;
DROP POLICY IF EXISTS "Admins can insert any content" ON content_submissions;

CREATE POLICY "Authenticated users can insert content"
ON content_submissions FOR INSERT
TO authenticated
WITH CHECK (true);
