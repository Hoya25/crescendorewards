ALTER TABLE unified_profiles
ADD COLUMN IF NOT EXISTS nctr_locked_points numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS nctr_balance_points numeric DEFAULT 0;