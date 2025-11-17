
-- Add image_url column to brands table
ALTER TABLE brands ADD COLUMN IF NOT EXISTS image_url TEXT;
