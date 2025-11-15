-- Function to automatically create a reward from an approved submission
CREATE OR REPLACE FUNCTION public.create_reward_from_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward_id uuid;
BEGIN
  -- Only proceed if status changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Insert into rewards table
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
      NEW.claim_passes_required,
      NEW.image_url,
      NEW.stock_quantity,
      true,  -- Make it active immediately
      false  -- Not featured by default
    )
    RETURNING id INTO v_reward_id;
    
    -- Log the creation
    RAISE NOTICE 'Created reward % from submission %', v_reward_id, NEW.id;
    
    -- Update submission with a note that it was published
    NEW.admin_notes := COALESCE(NEW.admin_notes || E'\n\n', '') || 
                       'Published to marketplace as reward ID: ' || v_reward_id::text;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically publish approved submissions
DROP TRIGGER IF EXISTS on_submission_approved ON public.reward_submissions;

CREATE TRIGGER on_submission_approved
  BEFORE UPDATE ON public.reward_submissions
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION public.create_reward_from_submission();

-- Add comment for documentation
COMMENT ON FUNCTION public.create_reward_from_submission() IS 
  'Automatically creates a reward in the marketplace when a submission is approved';