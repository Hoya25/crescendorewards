-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload reward assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update reward assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete reward assets" ON storage.objects;

-- Recreate with admin-only access
CREATE POLICY "Admins can upload reward assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reward-assets'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update reward assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'reward-assets'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete reward assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'reward-assets'
  AND public.has_role(auth.uid(), 'admin')
);