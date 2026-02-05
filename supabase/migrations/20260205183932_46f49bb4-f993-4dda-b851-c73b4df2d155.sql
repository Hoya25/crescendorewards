-- Create table to track social posts
CREATE TABLE public.reward_social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE,
  platform TEXT DEFAULT 'twitter' NOT NULL,
  post_content TEXT NOT NULL,
  post_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
  scheduled_for TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  auto_post BOOLEAN DEFAULT false,
  mentions JSONB DEFAULT '[]',
  hashtags JSONB DEFAULT '[]',
  reach_metrics JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for category-to-mention mapping
CREATE TABLE public.social_mention_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  subcategory TEXT,
  default_mentions JSONB DEFAULT '[]',
  default_hashtags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns to rewards table
ALTER TABLE public.rewards 
ADD COLUMN IF NOT EXISTS auto_post_to_twitter BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS twitter_post_id UUID REFERENCES public.reward_social_posts(id) ON DELETE SET NULL;

-- Enable RLS on reward_social_posts
ALTER TABLE public.reward_social_posts ENABLE ROW LEVEL SECURITY;

-- Admin can view all social posts
CREATE POLICY "Admins can view all social posts"
ON public.reward_social_posts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can insert social posts
CREATE POLICY "Admins can insert social posts"
ON public.reward_social_posts
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can update social posts
CREATE POLICY "Admins can update social posts"
ON public.reward_social_posts
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete social posts
CREATE POLICY "Admins can delete social posts"
ON public.reward_social_posts
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Enable RLS on social_mention_defaults
ALTER TABLE public.social_mention_defaults ENABLE ROW LEVEL SECURITY;

-- Anyone can read mention defaults
CREATE POLICY "Anyone can read mention defaults"
ON public.social_mention_defaults
FOR SELECT
USING (true);

-- Admin can manage mention defaults
CREATE POLICY "Admins can manage mention defaults"
ON public.social_mention_defaults
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at on reward_social_posts
CREATE TRIGGER update_reward_social_posts_updated_at
BEFORE UPDATE ON public.reward_social_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial mention defaults
INSERT INTO public.social_mention_defaults (category, subcategory, default_mentions, default_hashtags) VALUES
('gaming', NULL, '["@Xbox", "@PlayStation", "@Steam", "@NintendoAmerica"]', '["#Gaming", "#Gamer", "#VideoGames"]'),
('entertainment', 'streaming', '["@Twitch", "@YouTube", "@Kick"]', '["#Streaming", "#LiveStream", "#ContentCreator"]'),
('entertainment', 'music', '["@Spotify", "@AppleMusic", "@SoundCloud"]', '["#Music", "#NewMusic", "#LiveMusic"]'),
('experiences', 'sports', '["@ESPN", "@BleacherReport"]', '["#Sports", "#Fan"]'),
('wellness', NULL, '["@Whoop", "@Peloton", "@Nike"]', '["#Fitness", "#Health", "#Workout"]'),
('subscriptions', 'education', '["@MasterClass", "@Skillshare", "@Coursera"]', '["#Learning", "#Education", "#Skills"]'),
('crypto', NULL, '["@Coinbase", "@Binance", "@opensea"]', '["#Crypto", "#Web3", "#NFT"]'),
('merch', NULL, '[]', '["#Merch", "#Swag", "#Exclusive"]'),
('gift_cards', NULL, '[]', '["#GiftCard", "#Rewards"]'),
('alliance_tokens', NULL, '["@NCTRtoken"]', '["#NCTR", "#Web3Rewards", "#EarnDontBuy"]');