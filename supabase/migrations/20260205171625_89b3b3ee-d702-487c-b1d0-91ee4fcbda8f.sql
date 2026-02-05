-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create notification_settings table for email preferences
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.unified_profiles(id) ON DELETE CASCADE,
  email_shop_purchases BOOLEAN NOT NULL DEFAULT true,
  email_nctr_credited BOOLEAN NOT NULL DEFAULT true,
  email_tier_changes BOOLEAN NOT NULL DEFAULT true,
  email_rewards_claimed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own settings
CREATE POLICY "Users can view own notification settings"
ON public.notification_settings
FOR SELECT
USING (user_id IN (
  SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
));

-- Users can insert their own settings
CREATE POLICY "Users can insert own notification settings"
ON public.notification_settings
FOR INSERT
WITH CHECK (user_id IN (
  SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
));

-- Users can update their own settings
CREATE POLICY "Users can update own notification settings"
ON public.notification_settings
FOR UPDATE
USING (user_id IN (
  SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
));

-- Admins can view all notification settings
CREATE POLICY "Admins can view all notification settings"
ON public.notification_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create update trigger for updated_at
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();