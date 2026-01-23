-- Add display_order column to rewards table for marketplace ordering
ALTER TABLE public.rewards
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create index for efficient ordering queries
CREATE INDEX IF NOT EXISTS idx_rewards_display_order ON public.rewards(display_order);

-- Initialize display_order based on created_at for existing rewards
UPDATE public.rewards
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as row_num
  FROM public.rewards
) AS subquery
WHERE public.rewards.id = subquery.id;

COMMENT ON COLUMN public.rewards.display_order IS 'Display order position for marketplace. Lower numbers appear first.';