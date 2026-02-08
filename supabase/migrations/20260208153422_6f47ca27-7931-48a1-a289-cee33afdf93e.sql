
-- Add missing columns to existing content_submissions table
ALTER TABLE public.content_submissions 
ADD COLUMN IF NOT EXISTS source_avatar_url TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_content_status ON content_submissions(status);
CREATE INDEX IF NOT EXISTS idx_content_source ON content_submissions(source_type);
CREATE INDEX IF NOT EXISTS idx_content_reward ON content_submissions(reward_id);
CREATE INDEX IF NOT EXISTS idx_content_featured ON content_submissions(is_featured) WHERE is_featured = true;
