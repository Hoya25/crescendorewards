CREATE TABLE public.stripe_processed_events (
  event_id text PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.stripe_processed_events TO service_role;

ALTER TABLE public.stripe_processed_events ENABLE ROW LEVEL SECURITY;