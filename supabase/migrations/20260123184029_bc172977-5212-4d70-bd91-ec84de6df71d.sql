-- Add status_tier_claims_cost column to reward_submissions for contributor tier pricing suggestions
ALTER TABLE public.reward_submissions
ADD COLUMN IF NOT EXISTS status_tier_claims_cost JSONB DEFAULT NULL;

COMMENT ON COLUMN public.reward_submissions.status_tier_claims_cost IS 'Optional tier-based pricing suggested by contributor. JSON format: {bronze: number, silver: number, gold: number, platinum: number, diamond: number}';