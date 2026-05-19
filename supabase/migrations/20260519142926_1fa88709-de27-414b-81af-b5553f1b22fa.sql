-- Turn 2.5: Denormalize settlement fields onto rewards
ALTER TABLE public.rewards
  ADD COLUMN submission_id uuid NOT NULL
    REFERENCES public.reward_submissions(id) ON DELETE RESTRICT,
  ADD COLUMN floor_usd_amount integer NOT NULL,
  ADD COLUMN lock_option text NOT NULL,
  ADD COLUMN multiplier_at_submission numeric(4,2) NOT NULL,
  ADD COLUMN claims_required integer NOT NULL,
  ADD COLUMN contributor_user_id uuid NOT NULL;

ALTER TABLE public.rewards
  ADD CONSTRAINT rewards_lock_option_check
    CHECK (lock_option IN ('90lock', '360lock'));

CREATE INDEX IF NOT EXISTS rewards_submission_id_idx
  ON public.rewards(submission_id);

CREATE INDEX IF NOT EXISTS rewards_contributor_user_id_idx
  ON public.rewards(contributor_user_id);

-- Update trigger to populate denormalized fields
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
      contributor_user_id
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
      NEW.user_id
    )
    RETURNING id INTO v_reward_id;

    RAISE NOTICE 'Created reward % from submission %', v_reward_id, NEW.id;

    NEW.admin_notes := COALESCE(NEW.admin_notes || E'\n\n', '') ||
                       'Published to marketplace as reward ID: ' || v_reward_id::text;
  END IF;

  RETURN NEW;
END;
$function$;