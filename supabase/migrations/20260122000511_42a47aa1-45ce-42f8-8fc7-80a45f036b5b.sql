-- Create shop_settings table
CREATE TABLE public.shop_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_identifier text UNIQUE NOT NULL,
  nctr_per_dollar numeric(10,2) DEFAULT 1.0,
  minimum_purchase numeric(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create shop_transactions table
CREATE TABLE public.shop_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL,
  customer_email text,
  customer_name text,
  order_total numeric(10,2) NOT NULL,
  nctr_earned numeric(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'failed')),
  store_identifier text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for shop_settings (admin only)
CREATE POLICY "Admins can view shop settings"
  ON public.shop_settings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update shop settings"
  ON public.shop_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert shop settings"
  ON public.shop_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS policies for shop_transactions (admin only)
CREATE POLICY "Admins can view shop transactions"
  ON public.shop_transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert transactions"
  ON public.shop_transactions FOR INSERT
  WITH CHECK (true);

-- Insert default settings for nctr-merch store
INSERT INTO public.shop_settings (store_identifier, nctr_per_dollar, minimum_purchase, is_active)
VALUES ('nctr-merch', 1.0, 0, true);

-- Trigger for updated_at
CREATE TRIGGER update_shop_settings_updated_at
  BEFORE UPDATE ON public.shop_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();