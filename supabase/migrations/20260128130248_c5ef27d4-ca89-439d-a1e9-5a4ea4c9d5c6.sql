-- Create admin NCTR adjustments log table
CREATE TABLE public.admin_nctr_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES unified_profiles(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES unified_profiles(id),
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('add', 'subtract', 'set')),
  amount NUMERIC NOT NULL,
  previous_balance NUMERIC NOT NULL,
  new_balance NUMERIC NOT NULL,
  previous_tier TEXT,
  new_tier TEXT,
  lock_duration INTEGER,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_nctr_adjustments_user ON public.admin_nctr_adjustments(user_id);
CREATE INDEX idx_nctr_adjustments_admin ON public.admin_nctr_adjustments(admin_id);
CREATE INDEX idx_nctr_adjustments_created ON public.admin_nctr_adjustments(created_at DESC);

-- Add tier override columns to unified_profiles
ALTER TABLE public.unified_profiles 
ADD COLUMN IF NOT EXISTS tier_override TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tier_override_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tier_override_by UUID REFERENCES unified_profiles(id),
ADD COLUMN IF NOT EXISTS tier_override_at TIMESTAMPTZ DEFAULT NULL;

-- Enable RLS on adjustments table
ALTER TABLE public.admin_nctr_adjustments ENABLE ROW LEVEL SECURITY;

-- Admins can insert adjustments
CREATE POLICY "Admins can insert NCTR adjustments"
ON public.admin_nctr_adjustments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users au
    JOIN unified_profiles up ON au.user_id = up.id
    WHERE up.auth_user_id = auth.uid() AND au.is_active = true
  )
);

-- Admins can view all adjustments
CREATE POLICY "Admins can view NCTR adjustments"
ON public.admin_nctr_adjustments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users au
    JOIN unified_profiles up ON au.user_id = up.id
    WHERE up.auth_user_id = auth.uid() AND au.is_active = true
  )
);

-- Users can view their own adjustments
CREATE POLICY "Users can view own NCTR adjustments"
ON public.admin_nctr_adjustments FOR SELECT
USING (
  user_id IN (
    SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
  )
);