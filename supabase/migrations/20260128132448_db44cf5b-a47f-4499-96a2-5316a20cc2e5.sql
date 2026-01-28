
-- ============================================
-- USER PROFILE ENHANCEMENTS
-- ============================================

-- Wallet management
ALTER TABLE unified_profiles ADD COLUMN IF NOT EXISTS primary_wallet_address TEXT;
ALTER TABLE unified_profiles ADD COLUMN IF NOT EXISTS wallet_addresses JSONB DEFAULT '[]';
ALTER TABLE unified_profiles ADD COLUMN IF NOT EXISTS wallet_verified BOOLEAN DEFAULT false;
ALTER TABLE unified_profiles ADD COLUMN IF NOT EXISTS wallet_verified_at TIMESTAMPTZ;

-- NCTR lock tracking
ALTER TABLE unified_profiles ADD COLUMN IF NOT EXISTS nctr_lock_expires_at TIMESTAMPTZ;
ALTER TABLE unified_profiles ADD COLUMN IF NOT EXISTS nctr_lock_duration_days INTEGER;
ALTER TABLE unified_profiles ADD COLUMN IF NOT EXISTS onchain_vesting_synced BOOLEAN DEFAULT false;
ALTER TABLE unified_profiles ADD COLUMN IF NOT EXISTS onchain_vesting_contract TEXT;

-- Add missing columns to admin_nctr_adjustments
ALTER TABLE admin_nctr_adjustments ADD COLUMN IF NOT EXISTS lock_expires_at TIMESTAMPTZ;
ALTER TABLE admin_nctr_adjustments ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE admin_nctr_adjustments ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false;
ALTER TABLE admin_nctr_adjustments ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;
ALTER TABLE admin_nctr_adjustments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';
ALTER TABLE admin_nctr_adjustments ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;
ALTER TABLE admin_nctr_adjustments ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES unified_profiles(id);
ALTER TABLE admin_nctr_adjustments ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- ============================================
-- ADMIN NOTIFICATIONS TO USERS
-- ============================================

CREATE TABLE IF NOT EXISTS admin_user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES unified_profiles(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES unified_profiles(id),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_adjustment_id UUID REFERENCES admin_nctr_adjustments(id),
  sent_via TEXT[] DEFAULT ARRAY['in_app'],
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON admin_user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON admin_user_notifications(user_id) WHERE read_at IS NULL;

-- RLS for admin_user_notifications
ALTER TABLE admin_user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert user notifications"
ON admin_user_notifications FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users au
    JOIN unified_profiles up ON au.user_id = up.id
    WHERE up.auth_user_id = auth.uid() AND au.is_active = true
  )
);

CREATE POLICY "Admins can view all user notifications"
ON admin_user_notifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users au
    JOIN unified_profiles up ON au.user_id = up.id
    WHERE up.auth_user_id = auth.uid() AND au.is_active = true
  )
);

CREATE POLICY "Users can view own notifications"
ON admin_user_notifications FOR SELECT
USING (
  user_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Users can update own notifications"
ON admin_user_notifications FOR UPDATE
USING (
  user_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid())
);

-- ============================================
-- ADJUSTMENT TEMPLATES
-- ============================================

CREATE TABLE IF NOT EXISTS admin_adjustment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  adjustment_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  lock_duration_days INTEGER,
  notification_enabled BOOLEAN DEFAULT true,
  notification_title TEXT,
  notification_message TEXT,
  created_by UUID REFERENCES unified_profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for templates
ALTER TABLE admin_adjustment_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage templates"
ON admin_adjustment_templates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users au
    JOIN unified_profiles up ON au.user_id = up.id
    WHERE up.auth_user_id = auth.uid() AND au.is_active = true
  )
);

-- Index for status filter on adjustments
CREATE INDEX IF NOT EXISTS idx_nctr_adjustments_status ON admin_nctr_adjustments(status);
CREATE INDEX IF NOT EXISTS idx_nctr_adjustments_created ON admin_nctr_adjustments(created_at DESC);
