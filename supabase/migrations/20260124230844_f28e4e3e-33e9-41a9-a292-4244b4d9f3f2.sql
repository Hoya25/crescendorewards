-- Add creator selection fields to member_active_benefits
ALTER TABLE member_active_benefits ADD COLUMN IF NOT EXISTS selected_creator_name TEXT;
ALTER TABLE member_active_benefits ADD COLUMN IF NOT EXISTS selected_creator_url TEXT;
ALTER TABLE member_active_benefits ADD COLUMN IF NOT EXISTS selected_creator_platform TEXT;