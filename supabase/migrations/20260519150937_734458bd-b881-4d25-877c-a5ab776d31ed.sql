
-- reward_origin discriminator
ALTER TABLE public.reward_submissions
  ADD COLUMN IF NOT EXISTS reward_origin text NOT NULL DEFAULT 'contributor'
    CHECK (reward_origin IN ('contributor', 'sponsor', 'admin_manual'));

ALTER TABLE public.rewards
  ADD COLUMN IF NOT EXISTS reward_origin text NOT NULL DEFAULT 'contributor'
    CHECK (reward_origin IN ('contributor', 'sponsor', 'admin_manual'));

-- required_status_tier gating
ALTER TABLE public.reward_submissions
  ADD COLUMN IF NOT EXISTS required_status_tier text
    CHECK (required_status_tier IS NULL OR required_status_tier IN
      ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'));

ALTER TABLE public.rewards
  ADD COLUMN IF NOT EXISTS required_status_tier text
    CHECK (required_status_tier IS NULL OR required_status_tier IN
      ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'));

-- Relax settlement fields on rewards
ALTER TABLE public.rewards
  ALTER COLUMN floor_usd_amount DROP NOT NULL,
  ALTER COLUMN lock_option DROP NOT NULL,
  ALTER COLUMN multiplier_at_submission DROP NOT NULL,
  ALTER COLUMN contributor_user_id DROP NOT NULL,
  ALTER COLUMN submission_id DROP NOT NULL;

-- Conditional contributor settlement check (rewards)
ALTER TABLE public.rewards
  ADD CONSTRAINT rewards_contributor_settlement_check CHECK (
    reward_origin <> 'contributor' OR (
      submission_id IS NOT NULL
      AND floor_usd_amount IS NOT NULL
      AND lock_option IS NOT NULL
      AND multiplier_at_submission IS NOT NULL
      AND contributor_user_id IS NOT NULL
    )
  );

-- Conditional contributor settlement check (reward_submissions)
ALTER TABLE public.reward_submissions
  ADD CONSTRAINT reward_submissions_contributor_check CHECK (
    reward_origin <> 'contributor' OR (
      floor_usd_amount IS NOT NULL
      AND lock_option IS NOT NULL
      AND multiplier_at_submission IS NOT NULL
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS rewards_origin_idx
  ON public.rewards(reward_origin);

CREATE INDEX IF NOT EXISTS reward_submissions_origin_idx
  ON public.reward_submissions(reward_origin);

-- Update trigger function to copy reward_origin + required_status_tier
CREATE OR REPLACE FUNCTION public.create_reward_from_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_reward_id uuid;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO public.rewards (
      title,
      description,
      category,
      cost,
      image_url,
      stock_quantity,
      is_active,
      is_featured,
      submission_id,
      floor_usd_amount,
      lock_option,
      multiplier_at_submission,
      claims_required,
      contributor_user_id,
      reward_origin,
      required_status_tier
    )
    VALUES (
      NEW.title,
      NEW.description,
      NEW.category,
      COALESCE(NEW.claims_required, NEW.claim_passes_required, 1),
      NEW.image_url,
      NEW.stock_quantity,
      true,
      false,
      NEW.id,
      NEW.floor_usd_amount,
      NEW.lock_option,
      NEW.multiplier_at_submission,
      COALESCE(NEW.claims_required, NEW.claim_passes_required, 1),
      CASE WHEN NEW.reward_origin = 'contributor' THEN NEW.user_id ELSE NULL END,
      NEW.reward_origin,
      NEW.required_status_tier
    )
    RETURNING id INTO v_reward_id;

    RAISE NOTICE 'Created reward % from submission %', v_reward_id, NEW.id;

    NEW.admin_notes := COALESCE(NEW.admin_notes || E'\n\n', '') ||
                       'Published to marketplace as reward ID: ' || v_reward_id::text;
  END IF;

  RETURN NEW;
END;
$function$;
