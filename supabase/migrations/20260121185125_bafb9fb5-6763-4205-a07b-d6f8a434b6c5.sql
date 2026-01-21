-- Add status column to feedback table
ALTER TABLE public.feedback 
ADD COLUMN status text NOT NULL DEFAULT 'pending';

-- Add reviewed_by and reviewed_at columns for tracking
ALTER TABLE public.feedback 
ADD COLUMN reviewed_by uuid REFERENCES auth.users(id),
ADD COLUMN reviewed_at timestamp with time zone;

-- Update RLS policy to allow admins to update feedback
CREATE POLICY "Admins can update feedback" 
ON public.feedback 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));