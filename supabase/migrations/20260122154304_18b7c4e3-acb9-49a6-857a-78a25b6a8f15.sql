-- Drop the problematic admin policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can manage opportunities" ON earning_opportunities;

-- Create a simpler admin policy using user_roles table instead of admin_users
CREATE POLICY "Admins can manage opportunities" ON earning_opportunities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );