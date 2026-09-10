ALTER TABLE public.cross_platform_activity_log
  DROP CONSTRAINT IF EXISTS cross_platform_activity_log_platform_check;

ALTER TABLE public.cross_platform_activity_log
  ADD CONSTRAINT cross_platform_activity_log_platform_check
  CHECK (platform = ANY (ARRAY['garden'::text,'crescendo'::text,'admin'::text,'bounty_hunter'::text]));