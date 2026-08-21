REVOKE ALL ON FUNCTION public.process_referral(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_referral(text) FROM anon;
REVOKE ALL ON FUNCTION public.process_referral(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_referral(text) TO service_role;