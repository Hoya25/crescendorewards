-- Create membership history table
CREATE TABLE public.membership_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_level INTEGER NOT NULL,
  tier_name TEXT NOT NULL,
  locked_nctr INTEGER NOT NULL,
  previous_tier_level INTEGER,
  previous_tier_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.membership_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own history
CREATE POLICY "Users can view their own membership history"
ON public.membership_history
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert history records
CREATE POLICY "System can insert membership history"
ON public.membership_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_membership_history_user_id ON public.membership_history(user_id);
CREATE INDEX idx_membership_history_created_at ON public.membership_history(created_at DESC);