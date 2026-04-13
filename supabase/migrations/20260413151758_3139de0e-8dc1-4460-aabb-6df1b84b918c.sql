-- Create the reward-assets public bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('reward-assets', 'reward-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for reward assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'reward-assets');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload reward assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reward-assets');

-- Allow authenticated users to update/replace
CREATE POLICY "Authenticated users can update reward assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'reward-assets');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete reward assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'reward-assets');