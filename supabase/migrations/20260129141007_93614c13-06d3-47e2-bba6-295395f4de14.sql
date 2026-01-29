-- Create member reward selections table for tracking GROUNDBALL reward allocations
CREATE TABLE public.member_reward_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES public.groundball_rewards(id) ON DELETE CASCADE,
  selected_at TIMESTAMPTZ DEFAULT now(),
  last_redeemed_at TIMESTAMPTZ,
  redemption_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(member_id, reward_id)
);

-- Enable RLS
ALTER TABLE public.member_reward_selections ENABLE ROW LEVEL SECURITY;

-- Users can view their own selections
CREATE POLICY "Users can view their own reward selections"
ON public.member_reward_selections
FOR SELECT
USING (auth.uid() = member_id);

-- Users can insert their own selections
CREATE POLICY "Users can insert their own reward selections"
ON public.member_reward_selections
FOR INSERT
WITH CHECK (auth.uid() = member_id);

-- Users can update their own selections
CREATE POLICY "Users can update their own reward selections"
ON public.member_reward_selections
FOR UPDATE
USING (auth.uid() = member_id);

-- Users can delete their own selections
CREATE POLICY "Users can delete their own reward selections"
ON public.member_reward_selections
FOR DELETE
USING (auth.uid() = member_id);

-- Admins can manage all selections
CREATE POLICY "Admins can manage all reward selections"
ON public.member_reward_selections
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add indexes for performance
CREATE INDEX idx_member_reward_selections_member ON public.member_reward_selections(member_id);
CREATE INDEX idx_member_reward_selections_reward ON public.member_reward_selections(reward_id);
CREATE INDEX idx_member_reward_selections_active ON public.member_reward_selections(member_id, is_active) WHERE is_active = true;