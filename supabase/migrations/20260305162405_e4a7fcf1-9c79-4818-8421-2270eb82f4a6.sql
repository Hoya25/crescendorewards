
-- Enable RLS on nctr_deposits
ALTER TABLE nctr_deposits ENABLE ROW LEVEL SECURITY;

-- Users can view their own deposits
CREATE POLICY "Users can view own deposits"
  ON nctr_deposits FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own deposits
CREATE POLICY "Users can insert own deposits"
  ON nctr_deposits FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
