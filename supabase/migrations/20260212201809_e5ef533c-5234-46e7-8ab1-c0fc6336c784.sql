-- Fix 1: Gear Vault Item Update Bypass - replace WITH CHECK(true)
DROP POLICY IF EXISTS "Authenticated users can claim available items" ON public.gear_vault_items;

CREATE POLICY "Authenticated users can claim available items"
ON public.gear_vault_items
FOR UPDATE
TO authenticated
USING (status = 'available' OR claimer_id = auth.uid())
WITH CHECK (
  (claimer_id = auth.uid() OR (claimer_id IS NULL AND auth.uid() IS NOT NULL))
  AND status IN ('available', 'pending', 'claimed')
);

-- Fix 2: Explicit deny public (anon) SELECT on unified_profiles
DROP POLICY IF EXISTS "Deny public access to unified_profiles" ON public.unified_profiles;
CREATE POLICY "Deny public access to unified_profiles"
ON public.unified_profiles
FOR SELECT
TO anon
USING (false);

-- Fix 3: Explicit deny public (anon) SELECT on shop_transactions
DROP POLICY IF EXISTS "Deny public access to shop_transactions" ON public.shop_transactions;
CREATE POLICY "Deny public access to shop_transactions"
ON public.shop_transactions
FOR SELECT
TO anon
USING (false);
