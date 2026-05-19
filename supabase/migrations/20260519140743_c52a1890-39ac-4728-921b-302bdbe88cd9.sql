ALTER TABLE public.reward_submissions
  ADD COLUMN IF NOT EXISTS scheduling_notes TEXT,
  ADD COLUMN IF NOT EXISTS is_brand_submission BOOLEAN DEFAULT false;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reward_submissions'
      AND column_name = 'nctr_amount_calculated'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reward_submissions'
      AND column_name = 'nctr_amount_preview_at_submission'
  ) THEN
    ALTER TABLE public.reward_submissions
      RENAME COLUMN nctr_amount_calculated
      TO nctr_amount_preview_at_submission;
  END IF;
END $$;

ALTER TABLE public.rewards_claims
  ADD COLUMN IF NOT EXISTS contributor_user_id UUID,
  ADD COLUMN IF NOT EXISTS nctr_credited_to_contributor INTEGER,
  ADD COLUMN IF NOT EXISTS nctr_rate_at_claim DECIMAL(18,8),
  ADD COLUMN IF NOT EXISTS contributor_settlement_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bh_credit_response JSONB;