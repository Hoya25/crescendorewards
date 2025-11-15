-- Create reward_submissions table
CREATE TABLE public.reward_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lock_rate TEXT NOT NULL CHECK (lock_rate IN ('360', '90')),
  reward_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  nctr_value INTEGER NOT NULL,
  claim_passes_required INTEGER NOT NULL DEFAULT 1,
  stock_quantity INTEGER,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reward_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own submissions
CREATE POLICY "Users can view their own submissions"
ON public.reward_submissions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own submissions
CREATE POLICY "Users can create their own submissions"
ON public.reward_submissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending submissions
CREATE POLICY "Users can update their own pending submissions"
ON public.reward_submissions
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
ON public.reward_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update all submissions
CREATE POLICY "Admins can update all submissions"
ON public.reward_submissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete submissions
CREATE POLICY "Admins can delete submissions"
ON public.reward_submissions
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_reward_submissions_updated_at
BEFORE UPDATE ON public.reward_submissions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX idx_reward_submissions_user_id ON public.reward_submissions(user_id);
CREATE INDEX idx_reward_submissions_status ON public.reward_submissions(status);
CREATE INDEX idx_reward_submissions_created_at ON public.reward_submissions(created_at DESC);