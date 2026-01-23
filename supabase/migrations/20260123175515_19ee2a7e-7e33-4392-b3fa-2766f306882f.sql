-- Add image_urls column for multiple images (up to 4)
ALTER TABLE public.reward_submissions
ADD COLUMN image_urls TEXT[] DEFAULT '{}';

-- Comment explaining the column
COMMENT ON COLUMN public.reward_submissions.image_urls IS 'Array of up to 4 image URLs for the reward submission';