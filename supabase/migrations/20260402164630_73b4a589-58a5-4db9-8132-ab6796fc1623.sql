
-- Create member_ambitions table
CREATE TABLE public.member_ambitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id text NOT NULL,
  reward_name text NOT NULL,
  reward_tier_required text NOT NULL,
  is_claimable boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz
);

-- Index for fast user lookups
CREATE INDEX idx_member_ambitions_user_id ON public.member_ambitions(user_id);

-- Unique constraint: one active ambition per reward per user
CREATE UNIQUE INDEX idx_member_ambitions_unique_active ON public.member_ambitions(user_id, reward_id) WHERE removed_at IS NULL;

-- Enable RLS
ALTER TABLE public.member_ambitions ENABLE ROW LEVEL SECURITY;

-- Users can read their own ambitions
CREATE POLICY "Users can read own ambitions"
  ON public.member_ambitions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own ambitions
CREATE POLICY "Users can insert own ambitions"
  ON public.member_ambitions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own ambitions (for soft delete via removed_at)
CREATE POLICY "Users can update own ambitions"
  ON public.member_ambitions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
