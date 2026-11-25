CREATE TABLE IF NOT EXISTS public.phase1e_backup (id bigserial primary key, table_name text not null, row_id text not null, column_name text not null, old_value jsonb, changed_at timestamptz not null default now());
GRANT ALL ON public.phase1e_backup TO service_role;
ALTER TABLE public.phase1e_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;
ALTER TABLE public.rewards ALTER COLUMN auto_post_to_twitter SET DEFAULT false;