-- Update the trigger function to call the edge function
CREATE OR REPLACE FUNCTION public.create_reward_from_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward_id uuid;
  v_function_url text;
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
      true,
      false
    )
    RETURNING id INTO v_reward_id;
    
    -- Log the creation
    RAISE NOTICE 'Created reward % from submission %', v_reward_id, NEW.id;
    
    -- Update submission with a note that it was published
    NEW.admin_notes := COALESCE(NEW.admin_notes || E'\n\n', '') || 
                       'Published to marketplace as reward ID: ' || v_reward_id::text;
    
    -- Call edge function to send email notification
    -- Note: This requires RESEND_API_KEY to be configured in secrets
    BEGIN
      v_function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-approval-notification';
      
      PERFORM net.http_post(
        url := v_function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'submission_id', NEW.id,
          'reward_id', v_reward_id
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      RAISE WARNING 'Failed to send approval notification: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;