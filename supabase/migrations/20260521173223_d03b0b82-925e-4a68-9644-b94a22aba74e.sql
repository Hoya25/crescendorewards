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
      required_status_tier,
      min_tier_required,
      min_status_tier
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
      NEW.required_status_tier,
      NEW.required_status_tier,
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