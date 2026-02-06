-- Create featured_creators table
CREATE TABLE public.featured_creators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  handle TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('twitch', 'youtube', 'spotify', 'patreon', 'instagram', 'tiktok', 'twitter', 'other')),
  profile_url TEXT,
  image_url TEXT NOT NULL,
  category TEXT CHECK (category IN ('gaming', 'music', 'fitness', 'recovery', 'education', 'entertainment', 'lifestyle', 'tech', 'other')),
  bio TEXT,
  follower_count INTEGER,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create junction table for reward-creator relationships
CREATE TABLE public.reward_featured_creators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.featured_creators(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reward_id, creator_id)
);

-- Add new columns to rewards table
ALTER TABLE public.rewards
ADD COLUMN showcase_mode TEXT DEFAULT 'default' CHECK (showcase_mode IN ('default', 'single', 'collage', 'carousel')),
ADD COLUMN image_quality_approved BOOLEAN DEFAULT false,
ADD COLUMN image_source_url TEXT;

-- Enable RLS on featured_creators
ALTER TABLE public.featured_creators ENABLE ROW LEVEL SECURITY;

-- Anyone can view active featured creators
CREATE POLICY "Anyone can view active featured creators"
ON public.featured_creators
FOR SELECT
USING (is_active = true);

-- Admins can manage featured creators
CREATE POLICY "Admins can manage featured creators"
ON public.featured_creators
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable RLS on junction table
ALTER TABLE public.reward_featured_creators ENABLE ROW LEVEL SECURITY;

-- Anyone can view reward-creator relationships
CREATE POLICY "Anyone can view reward creator links"
ON public.reward_featured_creators
FOR SELECT
USING (true);

-- Admins can manage reward-creator relationships
CREATE POLICY "Admins can manage reward creator links"
ON public.reward_featured_creators
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_featured_creators_platform ON public.featured_creators(platform);
CREATE INDEX idx_featured_creators_category ON public.featured_creators(category);
CREATE INDEX idx_featured_creators_active ON public.featured_creators(is_active);
CREATE INDEX idx_featured_creators_priority ON public.featured_creators(display_priority DESC);
CREATE INDEX idx_reward_featured_creators_reward ON public.reward_featured_creators(reward_id);
CREATE INDEX idx_reward_featured_creators_creator ON public.reward_featured_creators(creator_id);

-- Insert sample featured creator
INSERT INTO public.featured_creators (name, handle, platform, profile_url, image_url, category, is_verified, is_active, display_priority)
VALUES (
  'Ian Carroll',
  '@IanCarrollShow', 
  'twitch',
  'https://twitch.tv/iancarrollshow',
  'https://static-cdn.jtvnw.net/jtv_user_pictures/iancarrollshow-profile_image-70x70.png',
  'education',
  true,
  true,
  100
);