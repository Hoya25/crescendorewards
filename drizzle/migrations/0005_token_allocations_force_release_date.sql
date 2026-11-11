CREATE OR REPLACE TRIGGER token_allocations_normalize
  BEFORE INSERT OR UPDATE OF wallet_address, lock_months, release_date
  ON public.token_allocations
  FOR EACH ROW EXECUTE FUNCTION public.token_allocations_normalize();