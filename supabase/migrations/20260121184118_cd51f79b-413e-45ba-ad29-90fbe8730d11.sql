-- Add optional screenshot URL to feedback submissions
ALTER TABLE public.feedback
ADD COLUMN IF NOT EXISTS image_url text;