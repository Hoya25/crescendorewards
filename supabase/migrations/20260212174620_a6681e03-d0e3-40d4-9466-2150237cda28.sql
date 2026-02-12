
-- Tighten the contrib_earnings_insert policy to only allow inserts where claimer matches auth user
DROP POLICY IF EXISTS "contrib_earnings_insert" ON contributed_reward_earnings;
CREATE POLICY "contrib_earnings_insert" ON contributed_reward_earnings
  FOR INSERT TO authenticated
  WITH CHECK (
    claimer_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid())
    OR contributor_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid())
  );
