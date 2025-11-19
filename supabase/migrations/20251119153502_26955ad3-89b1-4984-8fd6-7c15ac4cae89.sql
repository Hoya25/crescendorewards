-- Update the handle_new_user function to give new users 100 locked_nctr instead of available_nctr
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    referral_code,
    available_nctr,
    locked_nctr,
    claim_balance
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    generate_referral_code(),
    0,  -- Start with 0 available NCTR
    100, -- Start with 100 locked NCTR (360LOCK)
    0
  );
  RETURN new;
END;
$$;