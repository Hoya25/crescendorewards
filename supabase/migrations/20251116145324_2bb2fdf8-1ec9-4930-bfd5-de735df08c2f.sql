-- Create purchases table to track all claim package purchases
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  claims_amount INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL, -- in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases"
ON public.purchases
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert purchases
CREATE POLICY "System can insert purchases"
ON public.purchases
FOR INSERT
WITH CHECK (true);

-- Admins can view all purchases
CREATE POLICY "Admins can view all purchases"
ON public.purchases
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_purchases_created_at ON public.purchases(created_at DESC);