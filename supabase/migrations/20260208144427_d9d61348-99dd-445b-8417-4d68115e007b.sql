
-- Add hero_video_url column to brands table for brand content videos
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS hero_video_url text;
