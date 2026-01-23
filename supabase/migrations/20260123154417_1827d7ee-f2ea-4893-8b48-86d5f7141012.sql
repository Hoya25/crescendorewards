-- Update the create_reward_from_submission trigger to use claims_required
CREATE OR REPLACE FUNCTION public.create_reward_from_submission()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_reward_id uuid;
BEGIN
  -- Only proceed if status changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Insert into rewards table using claims_required as cost
    INSERT INTO public.rewards (
      title,
      description,
      category,
      cost,
      image_url,
      stock_quantity,
      is_active,
      is_featured
    )
    VALUES (
      NEW.title,
      NEW.description,
      NEW.category,
      COALESCE(NEW.claims_required, NEW.claim_passes_required, 1),
      NEW.image_url,
      NEW.stock_quantity,
      true,
      false
    )
    RETURNING id INTO v_reward_id;
    
    -- Log the creation
    RAISE NOTICE 'Created reward % from submission % with cost %', v_reward_id, NEW.id, COALESCE(NEW.claims_required, NEW.claim_passes_required, 1);
    
    -- Update submission with a note that it was published
    NEW.admin_notes := COALESCE(NEW.admin_notes || E'\n\n', '') || 
                       'Published to marketplace as reward ID: ' || v_reward_id::text ||
                       ' | Cost: ' || COALESCE(NEW.claims_required, NEW.claim_passes_required, 1)::text || ' Claims';
  END IF;
  
  RETURN NEW;
END;
$function$;