-- Add onboarding tracking column
ALTER TABLE public.unified_profiles 
ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean DEFAULT false;

-- Add signup bonus tracking column
ALTER TABLE public.unified_profiles
ADD COLUMN IF NOT EXISTS signup_bonus_awarded boolean DEFAULT false;