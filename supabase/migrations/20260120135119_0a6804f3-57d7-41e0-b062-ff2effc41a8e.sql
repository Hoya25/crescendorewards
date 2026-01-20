-- Create function to sync unified_profiles changes to profiles table
CREATE OR REPLACE FUNCTION public.sync_unified_to_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_exists boolean;
  v_crescendo_data jsonb;
BEGIN
  -- Check if a corresponding profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = NEW.auth_user_id) INTO v_profile_exists;
  
  IF NOT v_profile_exists THEN
    -- No legacy profile to update
    RETURN NEW;
  END IF;
  
  -- Extract crescendo_data for legacy fields
  v_crescendo_data := COALESCE(NEW.crescendo_data, '{}'::jsonb);
  
  -- Update the legacy profiles table with unified profile data
  UPDATE profiles
  SET
    email = COALESCE(NEW.email, email),
    full_name = COALESCE(NEW.display_name, full_name),
    avatar_url = COALESCE(NEW.avatar_url, avatar_url),
    wallet_address = COALESCE(NEW.wallet_address, wallet_address),
    -- Sync crescendo-specific data if present in crescendo_data
    level = COALESCE((v_crescendo_data->>'level')::integer, level),
    locked_nctr = COALESCE((v_crescendo_data->>'locked_nctr')::integer, locked_nctr),
    available_nctr = COALESCE((v_crescendo_data->>'available_nctr')::integer, available_nctr),
    claim_balance = COALESCE((v_crescendo_data->>'claim_balance')::integer, claim_balance),
    bio = COALESCE(v_crescendo_data->>'bio', bio),
    updated_at = now()
  WHERE id = NEW.auth_user_id;
  
  -- Log the sync activity
  INSERT INTO cross_platform_activity_log (user_id, platform, action_type, action_data)
  VALUES (
    NEW.id,
    'crescendo',
    'profile_reverse_sync',
    jsonb_build_object(
      'synced_fields', jsonb_build_object(
        'email', NEW.email,
        'display_name', NEW.display_name,
        'avatar_url', NEW.avatar_url,
        'wallet_address', NEW.wallet_address
      ),
      'synced_at', now()
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on unified_profiles for INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_sync_unified_to_profiles ON unified_profiles;

CREATE TRIGGER trigger_sync_unified_to_profiles
AFTER INSERT OR UPDATE ON unified_profiles
FOR EACH ROW
EXECUTE FUNCTION sync_unified_to_profiles();