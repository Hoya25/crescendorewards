-- Update featured_creators platform check to include 'kick' and remove 'twitch'
ALTER TABLE public.featured_creators DROP CONSTRAINT featured_creators_platform_check;
ALTER TABLE public.featured_creators ADD CONSTRAINT featured_creators_platform_check 
  CHECK (platform = ANY (ARRAY['kick'::text, 'twitch'::text, 'youtube'::text, 'spotify'::text, 'patreon'::text, 'instagram'::text, 'tiktok'::text, 'twitter'::text, 'other'::text]));

-- Update existing featured_creators from twitch to kick
UPDATE public.featured_creators SET platform = 'kick' WHERE platform = 'twitch';