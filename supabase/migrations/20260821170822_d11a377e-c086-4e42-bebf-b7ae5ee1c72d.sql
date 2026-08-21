DROP POLICY IF EXISTS "Authenticated users can upload review images" ON storage.objects;

CREATE POLICY "Review image uploads scoped to uploader"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'review-images'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (storage.foldername(name))[1] = public.current_unified_profile_id()::text
  )
);