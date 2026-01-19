-- Add sponsorship fields to rewards table
ALTER TABLE public.rewards
ADD COLUMN sponsor_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN sponsor_name text,
ADD COLUMN sponsor_logo text,
ADD COLUMN sponsor_link text,
ADD COLUMN sponsor_start_date date,
ADD COLUMN sponsor_end_date date;

-- Add constraint to ensure end date is after start date when both are set
ALTER TABLE public.rewards
ADD CONSTRAINT sponsor_dates_valid 
CHECK (
  sponsor_end_date IS NULL 
  OR sponsor_start_date IS NULL 
  OR sponsor_end_date >= sponsor_start_date
);

-- Create index for efficient sponsorship queries
CREATE INDEX idx_rewards_sponsorship ON public.rewards (sponsor_enabled, sponsor_start_date, sponsor_end_date) 
WHERE sponsor_enabled = true;