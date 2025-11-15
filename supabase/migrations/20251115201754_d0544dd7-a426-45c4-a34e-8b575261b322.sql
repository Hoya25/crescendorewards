-- Create storage bucket for reward images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reward-images',
  'reward-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- Allow public read access to reward images
CREATE POLICY "Public can view reward images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'reward-images');

-- Allow admins to upload reward images
CREATE POLICY "Admins can upload reward images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'reward-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update reward images
CREATE POLICY "Admins can update reward images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'reward-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete reward images
CREATE POLICY "Admins can delete reward images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'reward-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);