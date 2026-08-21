DROP POLICY IF EXISTS "Authenticated users can upload reward images" ON storage.objects;

CREATE POLICY "Reward image uploads scoped to uploader"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'reward-images'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (storage.foldername(name))[1] = auth.uid()::text
    OR (storage.foldername(name))[1] = public.current_unified_profile_id()::text
  )
);

CREATE POLICY "Users can update their own reward images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'reward-images'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (storage.foldername(name))[1] = public.current_unified_profile_id()::text
  )
);

CREATE POLICY "Users can delete their own reward images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'reward-images'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (storage.foldername(name))[1] = public.current_unified_profile_id()::text
  )
);

DROP POLICY IF EXISTS "Anyone can view feedback screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload feedback screenshots" ON storage.objects;

CREATE POLICY "Owners and admins can view feedback screenshots"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'feedback-screenshots'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (storage.foldername(name))[1] = auth.uid()::text
    OR (storage.foldername(name))[1] = public.current_unified_profile_id()::text
  )
);

CREATE POLICY "Feedback screenshot uploads scoped to uploader"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'feedback-screenshots'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (storage.foldername(name))[1] = public.current_unified_profile_id()::text
  )
);

DROP POLICY IF EXISTS "Authenticated users can view all content" ON public.content_submissions;

CREATE POLICY "Members view live content, own submissions, admins all"
ON public.content_submissions FOR SELECT TO authenticated
USING (
  status IN ('published', 'featured')
  OR source_id = auth.uid()
  OR source_id = public.current_unified_profile_id()
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

DROP FUNCTION IF EXISTS public.get_handle_by_email(text);