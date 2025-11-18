-- Insert UFL Merchandise as a featured reward
INSERT INTO public.rewards (
  title,
  description,
  category,
  cost,
  image_url,
  is_active,
  is_featured,
  stock_quantity
) VALUES (
  'Official UFL Team Merchandise',
  'Rep your favorite United Football League team with official UFL merch! Choose from a variety of t-shirts, hoodies, and team gear featuring the Battlehawks, Aviators, and more. High-quality apparel for true football fans.',
  'merch',
  150,
  '/rewards/ufl-merch.jpg',
  true,
  true,
  25
)
ON CONFLICT DO NOTHING;