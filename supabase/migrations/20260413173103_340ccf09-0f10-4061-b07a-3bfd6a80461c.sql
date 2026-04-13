ALTER TABLE rewards ADD COLUMN IF NOT EXISTS powered_by_name text DEFAULT NULL;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS show_powered_by boolean DEFAULT false;