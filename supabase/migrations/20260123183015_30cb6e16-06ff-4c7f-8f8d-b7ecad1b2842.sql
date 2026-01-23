-- Add min_status_tier column to reward_submissions for contributor status requirements
ALTER TABLE public.reward_submissions
ADD COLUMN IF NOT EXISTS min_status_tier TEXT DEFAULT NULL;

-- Add comment explaining the field
COMMENT ON COLUMN public.reward_submissions.min_status_tier IS 'Minimum status tier required to claim this reward. Values: null/all (no restriction), bronze, silver, gold, platinum, diamond';