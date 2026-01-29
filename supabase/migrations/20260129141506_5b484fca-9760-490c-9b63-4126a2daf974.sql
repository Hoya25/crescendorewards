-- Create member_groundball_status table for tracking member tier and allocation
CREATE TABLE public.member_groundball_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  groundball_locked INTEGER DEFAULT 0,
  status_tier TEXT DEFAULT 'none' CHECK (status_tier IN ('none', 'bronze', 'silver', 'gold')),
  selections_used INTEGER DEFAULT 0,
  selections_max INTEGER DEFAULT 0, -- bronze=2, silver=4, gold=7
  bonus_selections INTEGER DEFAULT 0, -- purchased with Claims
  free_swaps_remaining INTEGER DEFAULT 1,
  current_period_start DATE,
  current_period_end DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.member_groundball_status ENABLE ROW LEVEL SECURITY;

-- Members can view their own status
CREATE POLICY "Members can view their own groundball status"
ON public.member_groundball_status
FOR SELECT
USING (auth.uid() = member_id);

-- Members can insert their own status (on first access)
CREATE POLICY "Members can insert their own groundball status"
ON public.member_groundball_status
FOR INSERT
WITH CHECK (auth.uid() = member_id);

-- Members can update their own status
CREATE POLICY "Members can update their own groundball status"
ON public.member_groundball_status
FOR UPDATE
USING (auth.uid() = member_id);

-- Admins can manage all status records
CREATE POLICY "Admins can manage all groundball status"
ON public.member_groundball_status
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for fast lookups
CREATE INDEX idx_member_groundball_status_member ON public.member_groundball_status(member_id);
CREATE INDEX idx_member_groundball_status_tier ON public.member_groundball_status(status_tier);

-- Create trigger for updated_at
CREATE TRIGGER update_member_groundball_status_updated_at
  BEFORE UPDATE ON public.member_groundball_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_delivery_profile_updated_at();

-- Add comment for documentation
COMMENT ON TABLE public.member_groundball_status IS 'Tracks member GROUNDBALL status tier and reward selection allocations. Tier thresholds: bronze=2 selections, silver=4, gold=7.';