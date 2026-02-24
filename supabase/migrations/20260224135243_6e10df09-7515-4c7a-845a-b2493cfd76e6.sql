
CREATE TABLE IF NOT EXISTS handle_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES unified_profiles(id),
  old_handle text NOT NULL,
  new_handle text NOT NULL,
  reason text NOT NULL CHECK (reason IN ('initial_claim', 'annual_change', 'tier_upgrade', 'admin_change')),
  tier_at_change text,
  changed_at timestamptz DEFAULT now()
);

CREATE INDEX idx_handle_history_user ON handle_history(user_id);
CREATE INDEX idx_handle_history_old ON handle_history(old_handle);
CREATE INDEX idx_handle_history_new ON handle_history(new_handle);

ALTER TABLE handle_history ENABLE ROW LEVEL SECURITY;

-- Users can see their own history
CREATE POLICY "Users can view own handle history"
  ON handle_history FOR SELECT
  USING (user_id IN (
    SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
  ));

-- Admins can see all history
CREATE POLICY "Admins can view all handle history"
  ON handle_history FOR SELECT
  USING (public.has_admin_permission(auth.uid(), 'handle_management'));

-- Only functions can insert (not direct user access)
CREATE POLICY "System can insert handle history"
  ON handle_history FOR INSERT
  WITH CHECK (true);
