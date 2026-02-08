
DROP POLICY IF EXISTS "Anyone can view published content" ON content_submissions;
DROP POLICY IF EXISTS "Users can view own content" ON content_submissions;
DROP POLICY IF EXISTS "Admins can view all content" ON content_submissions;
DROP POLICY IF EXISTS "Admins have full access to content" ON content_submissions;

CREATE POLICY "Authenticated users can view all content"
ON content_submissions FOR SELECT
TO authenticated
USING (true);
