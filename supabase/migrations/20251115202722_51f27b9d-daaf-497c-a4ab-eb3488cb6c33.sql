-- Add featured flag to rewards table
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster featured rewards queries
CREATE INDEX IF NOT EXISTS idx_rewards_featured ON rewards(is_featured) WHERE is_featured = true;