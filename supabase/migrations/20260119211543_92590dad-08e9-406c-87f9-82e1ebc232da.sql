
-- Create sponsors table for centralized sponsor management
CREATE TABLE public.sponsors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Anyone can view active sponsors (for display on rewards)
CREATE POLICY "Anyone can view active sponsors"
  ON public.sponsors
  FOR SELECT
  USING (is_active = true);

-- Admins can manage all sponsors
CREATE POLICY "Admins can manage sponsors"
  ON public.sponsors
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Create storage bucket for sponsor logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('sponsor-logos', 'sponsor-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for sponsor logos
CREATE POLICY "Anyone can view sponsor logos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'sponsor-logos');

CREATE POLICY "Admins can upload sponsor logos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'sponsor-logos' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sponsor logos"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'sponsor-logos' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sponsor logos"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'sponsor-logos' AND has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_sponsors_updated_at
  BEFORE UPDATE ON public.sponsors
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
