-- Add brand_id column to rewards table
ALTER TABLE public.rewards 
ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_rewards_brand_id ON public.rewards(brand_id);