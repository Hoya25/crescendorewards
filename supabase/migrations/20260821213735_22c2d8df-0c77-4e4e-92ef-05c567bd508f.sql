DROP POLICY IF EXISTS "Anyone can view reward images" ON public.reward_images;
DROP POLICY IF EXISTS "Reward images are viewable by everyone" ON public.reward_images;
DROP POLICY IF EXISTS "Public can view reward images" ON public.reward_images;

CREATE POLICY "Reward images visible for live rewards, own uploads or admins"
ON public.reward_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rewards r
    WHERE r.id = reward_images.reward_id
      AND r.is_active = true
  )
  OR public.is_current_user_admin()
  OR uploaded_by = public.current_unified_profile_id()
);