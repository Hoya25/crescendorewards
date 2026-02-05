-- Create user onboarding progress table
CREATE TABLE public.user_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.unified_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  profile_completed boolean DEFAULT false,
  profile_completed_at timestamptz,
  how_it_works_viewed boolean DEFAULT false,
  how_it_works_viewed_at timestamptz,
  garden_visited boolean DEFAULT false,
  garden_visited_at timestamptz,
  first_wishlist_item boolean DEFAULT false,
  first_wishlist_item_at timestamptz,
  first_referral boolean DEFAULT false,
  first_referral_at timestamptz,
  onboarding_nctr_awarded numeric DEFAULT 0,
  is_dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Users can read their own onboarding progress
CREATE POLICY "Users can view own onboarding"
ON public.user_onboarding
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own onboarding progress
CREATE POLICY "Users can update own onboarding"
ON public.user_onboarding
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own onboarding record
CREATE POLICY "Users can insert own onboarding"
ON public.user_onboarding
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_onboarding_user_id ON public.user_onboarding(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_onboarding_updated_at
BEFORE UPDATE ON public.user_onboarding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();