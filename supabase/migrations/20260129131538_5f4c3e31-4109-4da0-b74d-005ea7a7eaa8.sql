-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can claim available items" ON public.gear_vault_items;

-- Create a more restrictive policy for claiming
CREATE POLICY "Authenticated users can claim available items"
ON public.gear_vault_items
FOR UPDATE
TO authenticated
USING (status = 'available' OR claimer_id = auth.uid())
WITH CHECK (
  -- User can only set themselves as claimer
  (claimer_id = auth.uid() OR claimer_id IS NULL)
  AND
  -- Only allow status transitions: available -> pending/claimed
  (status IN ('available', 'pending', 'claimed', 'shipped', 'completed'))
);