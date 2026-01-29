-- Create reward redemptions table for tracking GROUNDBALL reward usage
CREATE TABLE public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES public.groundball_rewards(id) ON DELETE SET NULL,
  selection_id UUID REFERENCES public.member_reward_selections(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  period TEXT, -- '2026-Q1', '2026-01', '2026'
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own redemptions
CREATE POLICY "Users can view their own redemptions"
ON public.reward_redemptions
FOR SELECT
USING (auth.uid() = member_id);

-- Users can insert their own redemptions
CREATE POLICY "Users can insert their own redemptions"
ON public.reward_redemptions
FOR INSERT
WITH CHECK (auth.uid() = member_id);

-- Admins can manage all redemptions
CREATE POLICY "Admins can manage all redemptions"
ON public.reward_redemptions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add indexes for performance
CREATE INDEX idx_reward_redemptions_member ON public.reward_redemptions(member_id);
CREATE INDEX idx_reward_redemptions_reward ON public.reward_redemptions(reward_id);
CREATE INDEX idx_reward_redemptions_selection ON public.reward_redemptions(selection_id);
CREATE INDEX idx_reward_redemptions_period ON public.reward_redemptions(member_id, reward_id, period);