-- 1) Extend rewards with engine gating + funding source
ALTER TABLE public.rewards
  ADD COLUMN IF NOT EXISTS required_engines TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS engine_funding_source TEXT;

CREATE INDEX IF NOT EXISTS idx_rewards_required_engines
  ON public.rewards USING GIN (required_engines);

-- 2) Read-only mirror of BH engine registry
CREATE TABLE IF NOT EXISTS public.engine_registry_mirror (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'design',
  primary_color TEXT,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_engine_registry_mirror_status
  ON public.engine_registry_mirror (status);

ALTER TABLE public.engine_registry_mirror ENABLE ROW LEVEL SECURITY;

-- Public read (catalog gating UI needs this)
DROP POLICY IF EXISTS "Engine registry mirror is publicly readable"
  ON public.engine_registry_mirror;
CREATE POLICY "Engine registry mirror is publicly readable"
  ON public.engine_registry_mirror
  FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies → writes only allowed via
-- service_role (i.e. the sync-engine-registry edge function).
