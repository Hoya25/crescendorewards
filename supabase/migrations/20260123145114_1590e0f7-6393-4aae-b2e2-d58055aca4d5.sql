-- Add new compensation fields to reward_submissions table
ALTER TABLE public.reward_submissions
ADD COLUMN IF NOT EXISTS floor_usd_amount integer,
ADD COLUMN IF NOT EXISTS lock_option text,
ADD COLUMN IF NOT EXISTS nctr_rate_at_submission decimal(10,6);

-- Add comment for documentation
COMMENT ON COLUMN public.reward_submissions.floor_usd_amount IS 'The minimum dollar value the contributor will accept';
COMMENT ON COLUMN public.reward_submissions.lock_option IS 'Selected LOCK period: 30, 90, 360, or 720';
COMMENT ON COLUMN public.reward_submissions.nctr_rate_at_submission IS 'NCTR rate snapshot at time of submission (e.g., 0.05)';