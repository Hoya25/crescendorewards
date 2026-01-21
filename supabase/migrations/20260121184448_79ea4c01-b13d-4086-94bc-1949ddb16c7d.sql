-- Create dedicated bucket for feedback screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-screenshots', 'feedback-screenshots', true);

-- Allow any authenticated user to upload feedback screenshots
CREATE POLICY "Authenticated users can upload feedback screenshots"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'feedback-screenshots');

-- Allow public read access to feedback screenshots
CREATE POLICY "Anyone can view feedback screenshots"
ON storage.objects
FOR SELECT
USING (bucket_id = 'feedback-screenshots');

-- Allow admins to delete feedback screenshots
CREATE POLICY "Admins can delete feedback screenshots"
ON storage.objects
FOR DELETE
USING (bucket_id = 'feedback-screenshots' AND has_role(auth.uid(), 'admin'::app_role));