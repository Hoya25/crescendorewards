CREATE OR REPLACE FUNCTION public.normalize_wallet_address()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.wallet_address := lower(nullif(trim(NEW.wallet_address), ''));
  RETURN NEW;
END $$;

CREATE TRIGGER normalize_wallet_address
BEFORE INSERT OR UPDATE ON public.unified_profiles
FOR EACH ROW EXECUTE FUNCTION public.normalize_wallet_address();

ALTER TABLE public.unified_profiles
  ADD CONSTRAINT unified_profiles_wallet_format
  CHECK (wallet_address IS NULL OR wallet_address ~ '^0x[a-fA-F0-9]{40}$') NOT VALID;