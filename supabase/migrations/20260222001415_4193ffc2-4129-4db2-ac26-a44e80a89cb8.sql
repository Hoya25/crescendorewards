
-- Table for multiple images per reward
CREATE TABLE public.reward_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT,
  uploaded_by UUID REFERENCES public.unified_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_reward_images_reward_id ON public.reward_images(reward_id);
CREATE INDEX idx_reward_images_order ON public.reward_images(reward_id, display_order);

-- Enable RLS
ALTER TABLE public.reward_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view reward images (rewards are public)
CREATE POLICY "Anyone can view reward images"
  ON public.reward_images FOR SELECT
  USING (true);

-- Authenticated users can insert images (for contributed rewards they own)
CREATE POLICY "Authenticated users can insert reward images"
  ON public.reward_images FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid())
  );

-- Users can update their own images, admins can update any
CREATE POLICY "Users can update own reward images"
  ON public.reward_images FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Users can delete their own images, admins can delete any
CREATE POLICY "Users can delete own reward images"
  ON public.reward_images FOR DELETE
  TO authenticated
  USING (
    uploaded_by = (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
