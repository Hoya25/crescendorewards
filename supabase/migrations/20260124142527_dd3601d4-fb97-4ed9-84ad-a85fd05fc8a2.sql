-- Add scheduling fields to rewards table
ALTER TABLE public.rewards 
ADD COLUMN IF NOT EXISTS publish_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS unpublish_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for efficient scheduling queries
CREATE INDEX IF NOT EXISTS idx_rewards_publish_at ON public.rewards (publish_at) WHERE publish_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rewards_unpublish_at ON public.rewards (unpublish_at) WHERE unpublish_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.rewards.publish_at IS 'When to automatically set is_active = true. NULL means publish immediately.';
COMMENT ON COLUMN public.rewards.unpublish_at IS 'When to automatically set is_active = false. NULL means never expires.';