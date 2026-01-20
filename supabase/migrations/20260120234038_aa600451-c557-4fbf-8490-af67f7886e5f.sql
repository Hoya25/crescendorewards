-- Fix the remaining overly permissive RLS policy on purchases table

-- Drop the permissive policy
DROP POLICY IF EXISTS "System can insert purchases" ON public.purchases;

-- Replace with service_role only access (for Stripe webhook)
CREATE POLICY "Service role can insert purchases"
ON public.purchases
FOR INSERT
WITH CHECK (auth.role() = 'service_role');