-- Create claim_packages table for dynamic package management
CREATE TABLE public.claim_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  claims_amount integer NOT NULL,
  price_cents integer NOT NULL,
  bonus_nctr integer NOT NULL DEFAULT 0,
  stripe_price_id text,
  stripe_product_id text,
  is_popular boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.claim_packages ENABLE ROW LEVEL SECURITY;

-- Anyone can view active packages (for purchase page)
CREATE POLICY "Anyone can view active packages"
ON public.claim_packages
FOR SELECT
USING (is_active = true);

-- Admins can manage all packages
CREATE POLICY "Admins can manage packages"
ON public.claim_packages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_claim_packages_updated_at
  BEFORE UPDATE ON public.claim_packages
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Seed with existing packages
INSERT INTO public.claim_packages (name, claims_amount, price_cents, bonus_nctr, stripe_price_id, is_popular, sort_order) VALUES
  ('Starter Pack', 10, 5000, 150, 'price_1Srn1rLVb8JMU0JnDoZD3Yx6', false, 1),
  ('Popular Pack', 25, 12500, 375, 'price_1Srn2HLVb8JMU0JnsrXVR8ey', true, 2),
  ('Premium Pack', 50, 25000, 750, 'price_1Srn4BLVb8JMU0JnQJqbo6qO', false, 3),
  ('Ultimate Pack', 100, 50000, 1500, 'price_1Srn5VLVb8JMU0JnoPhLuYeC', false, 4),
  ('Mega Pack', 220, 100000, 3000, 'price_1Srn6mLVb8JMU0Jnhacdqn48', false, 5);