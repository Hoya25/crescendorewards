-- Fix shop_transactions INSERT policy to restrict to service_role only
-- This prevents authenticated users from creating fake transaction records

DROP POLICY IF EXISTS "Service role can insert transactions" ON public.shop_transactions;

CREATE POLICY "Service role can insert transactions"
ON public.shop_transactions
FOR INSERT
WITH CHECK (auth.role() = 'service_role');
