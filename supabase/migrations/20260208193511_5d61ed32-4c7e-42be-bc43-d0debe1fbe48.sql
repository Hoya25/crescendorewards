
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage content submissions" ON content_submissions;
DROP POLICY IF EXISTS "Admins can view all content submissions" ON content_submissions;
DROP POLICY IF EXISTS "Users can submit content" ON content_submissions;
DROP POLICY IF EXISTS "Users can view published content" ON content_submissions;
DROP POLICY IF EXISTS "Anyone can view published content" ON content_submissions;
DROP POLICY IF EXISTS "Users can view own content" ON content_submissions;
DROP POLICY IF EXISTS "Users can update own pending content" ON content_submissions;
DROP POLICY IF EXISTS "Admins have full access to content" ON content_submissions;

-- Allow anyone to read published/featured content
CREATE POLICY "Anyone can view published content"
ON content_submissions FOR SELECT
USING (status IN ('published', 'featured'));

-- Allow authenticated users to read their own content (any status)
CREATE POLICY "Users can view own content"
ON content_submissions FOR SELECT
TO authenticated
USING (source_id = auth.uid());

-- Allow authenticated users to insert their own content
CREATE POLICY "Users can submit content"
ON content_submissions FOR INSERT
TO authenticated
WITH CHECK (source_id = auth.uid());

-- Allow authenticated users to update their own pending content
CREATE POLICY "Users can update own pending content"
ON content_submissions FOR UPDATE
TO authenticated
USING (source_id = auth.uid() AND status = 'pending');

-- Allow admins full access
CREATE POLICY "Admins have full access to content"
ON content_submissions FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);
