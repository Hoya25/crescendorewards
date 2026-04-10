CREATE TABLE public.reward_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.unified_profiles(id) ON DELETE CASCADE,
  user_email TEXT,
  request_title TEXT NOT NULL,
  request_details TEXT,
  tier_at_time TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reward_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
ON public.reward_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own requests"
ON public.reward_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all requests"
ON public.reward_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);