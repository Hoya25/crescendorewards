-- Admin roles and permissions table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES unified_profiles(id) NOT NULL UNIQUE,
  role text CHECK (role IN ('super_admin', 'admin', 'moderator')) NOT NULL DEFAULT 'moderator',
  permissions jsonb DEFAULT '[]',
  invited_by uuid REFERENCES unified_profiles(id),
  invited_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  last_login timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Permission types for reference
COMMENT ON COLUMN admin_users.permissions IS 'Array of permission strings: 
  ["rewards_view", "rewards_edit", "rewards_delete", "rewards_create"],
  ["claims_view", "claims_process", "claims_refund"],
  ["users_view", "users_edit", "users_ban"],
  ["submissions_view", "submissions_approve", "submissions_reject"],
  ["sponsors_view", "sponsors_edit"],
  ["brands_view", "brands_edit"],
  ["settings_view", "settings_edit"],
  ["admins_view", "admins_manage"]
';

-- Admin activity log
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES admin_users(id) NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_activity_admin ON admin_activity_log(admin_user_id);
CREATE INDEX idx_admin_activity_created ON admin_activity_log(created_at DESC);

-- RLS Policies
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin_users
CREATE POLICY "Admins can view admin users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      JOIN unified_profiles up ON au.user_id = up.id 
      WHERE up.auth_user_id = auth.uid() AND au.is_active = true
    )
  );

-- Only super_admin can insert/update/delete admin_users
CREATE POLICY "Super admin can manage admin users" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      JOIN unified_profiles up ON au.user_id = up.id 
      WHERE up.auth_user_id = auth.uid() AND au.role = 'super_admin' AND au.is_active = true
    )
  );

-- Admins can view activity log
CREATE POLICY "Admins can view activity log" ON admin_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      JOIN unified_profiles up ON au.user_id = up.id 
      WHERE up.auth_user_id = auth.uid() AND au.is_active = true
    )
  );

-- Admins can insert activity log
CREATE POLICY "Admins can log activity" ON admin_activity_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au 
      JOIN unified_profiles up ON au.user_id = up.id 
      WHERE up.auth_user_id = auth.uid() AND au.is_active = true
    )
  );

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION has_admin_permission(check_user_id uuid, required_permission text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = check_user_id 
    AND is_active = true
    AND (
      role = 'super_admin' 
      OR permissions ? required_permission
    )
  );
END;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_admin_users_timestamp
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();