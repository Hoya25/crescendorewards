
-- Create content_submissions table for community content library
CREATE TABLE public.content_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL DEFAULT 'video' CHECK (content_type IN ('video', 'image', 'review', 'tutorial', 'testimonial', 'unboxing', 'tip')),
  media_url TEXT,
  thumbnail_url TEXT,
  source_type TEXT NOT NULL DEFAULT 'member' CHECK (source_type IN ('sponsor', 'contributor', 'member')),
  source_id UUID,
  source_name TEXT,
  reward_id UUID REFERENCES public.rewards(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected', 'featured')),
  view_count INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_submissions ENABLE ROW LEVEL SECURITY;

-- Admin can view all content
CREATE POLICY "Admins can view all content submissions"
  ON public.content_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
    )
  );

-- Admin can insert/update/delete
CREATE POLICY "Admins can manage content submissions"
  ON public.content_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
    )
  );

-- Users can view published content
CREATE POLICY "Users can view published content"
  ON public.content_submissions FOR SELECT
  USING (status IN ('published', 'featured'));

-- Users can submit their own content
CREATE POLICY "Users can submit content"
  ON public.content_submissions FOR INSERT
  WITH CHECK (auth.uid() = source_id AND source_type = 'member');

-- Indexes
CREATE INDEX idx_content_submissions_status ON public.content_submissions(status);
CREATE INDEX idx_content_submissions_source_type ON public.content_submissions(source_type);
CREATE INDEX idx_content_submissions_content_type ON public.content_submissions(content_type);
CREATE INDEX idx_content_submissions_is_featured ON public.content_submissions(is_featured);
