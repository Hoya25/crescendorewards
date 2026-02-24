
-- Create the reserved_handles table for admin-manageable handle reservations
CREATE TABLE IF NOT EXISTS public.reserved_handles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  handle text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category IN ('brand', 'engine', 'system', 'vip', 'offensive', 'squatting')),
  reason text,
  reserved_for text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES unified_profiles(id)
);

-- Index for fast lookups
CREATE INDEX idx_reserved_handles_handle ON reserved_handles(handle);
CREATE INDEX idx_reserved_handles_category ON reserved_handles(category);

-- RLS
ALTER TABLE reserved_handles ENABLE ROW LEVEL SECURITY;

-- Anyone can SELECT (needed for handle availability checks)
CREATE POLICY "Anyone can check reservations"
  ON reserved_handles FOR SELECT
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert reserved handles"
  ON reserved_handles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reserved handles"
  ON reserved_handles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reserved handles"
  ON reserved_handles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));
