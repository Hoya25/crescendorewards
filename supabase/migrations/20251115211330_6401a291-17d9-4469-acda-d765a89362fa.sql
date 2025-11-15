-- Create brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  base_earning_rate INTEGER NOT NULL,
  logo_emoji TEXT NOT NULL,
  logo_color TEXT NOT NULL,
  shop_url TEXT NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Allow all users to read active brands
CREATE POLICY "Anyone can view active brands"
  ON public.brands
  FOR SELECT
  USING (is_active = true);

-- Allow admins to manage brands
CREATE POLICY "Admins can manage brands"
  ON public.brands
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Create index for category filtering
CREATE INDEX idx_brands_category ON public.brands(category);
CREATE INDEX idx_brands_featured ON public.brands(is_featured) WHERE is_featured = true;

-- Create trigger for updated_at
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample brands
INSERT INTO public.brands (name, description, category, base_earning_rate, logo_emoji, logo_color, shop_url, is_featured) VALUES
('Apple Store', 'Innovative technology products including iPhone, iPad, Mac, and premium accessories', 'Technology', 4, '🍎', 'hsl(199 89% 48%)', 'https://apple.com', true),
('Kroma Wellness', 'Premium superfood wellness products and nutritional supplements for optimal health', 'Wellness', 8, 'kroma.', 'hsl(0 0% 95%)', 'https://kromawellness.com', false),
('Urban Outfitters', 'Contemporary fashion and lifestyle brand offering trendy apparel, accessories, and home decor', 'Retail', 5, '🛍️', 'hsl(291 64% 42%)', 'https://urbanoutfitters.com', false),
('Whole Foods Market', 'Premium organic groceries, fresh produce, and natural products for healthy living', 'Dining', 3, '🥗', 'hsl(142 76% 36%)', 'https://wholefoodsmarket.com', false),
('Delta Airlines', 'Premium air travel experiences with worldwide destinations and exceptional service', 'Travel', 7, '✈️', 'hsl(217 91% 60%)', 'https://delta.com', false),
('Spotify Premium', 'Music streaming and podcasts with ad-free listening and offline downloads', 'Entertainment', 4, '🎵', 'hsl(142 76% 36%)', 'https://spotify.com', false),
('Nike', 'World-class athletic footwear, apparel, and equipment for every sport and lifestyle', 'Retail', 6, '👟', 'hsl(14 100% 57%)', 'https://nike.com', false),
('Chipotle', 'Fast-casual Mexican cuisine with fresh, responsibly-sourced ingredients', 'Dining', 4, '🌯', 'hsl(14 100% 57%)', 'https://chipotle.com', false),
('AMC Theatres', 'Premium movie theater experiences with IMAX, Dolby Cinema, and luxury seating', 'Entertainment', 5, '🎬', 'hsl(43 96% 56%)', 'https://amctheatres.com', false),
('Sephora', 'Premium beauty products, cosmetics, skincare, and fragrance from top brands', 'Lifestyle', 6, '💄', 'hsl(328 85% 70%)', 'https://sephora.com', false);