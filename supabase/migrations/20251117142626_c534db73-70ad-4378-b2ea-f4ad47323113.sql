-- Add earn_opportunities field to brands table
ALTER TABLE brands ADD COLUMN IF NOT EXISTS earn_opportunities JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN brands.earn_opportunities IS 'Array of earn opportunity objects with title, description, and link fields';