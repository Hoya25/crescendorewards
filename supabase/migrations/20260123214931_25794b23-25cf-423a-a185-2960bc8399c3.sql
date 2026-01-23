-- User activity events table for tracking all user interactions
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.unified_profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_name VARCHAR(100),
  page_path VARCHAR(255),
  page_title VARCHAR(255),
  element_id VARCHAR(100),
  element_text VARCHAR(255),
  metadata JSONB,
  referrer VARCHAR(255),
  device_type VARCHAR(20),
  browser VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_session_id ON public.user_activity(session_id);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at DESC);
CREATE INDEX idx_user_activity_event_type ON public.user_activity(event_type);

-- User sessions summary table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.unified_profiles(id) ON DELETE CASCADE,
  session_id UUID UNIQUE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  page_views INT DEFAULT 0,
  clicks INT DEFAULT 0,
  actions INT DEFAULT 0,
  entry_page VARCHAR(255),
  exit_page VARCHAR(255),
  device_type VARCHAR(20),
  browser VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_started_at ON public.user_sessions(started_at DESC);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own activity
CREATE POLICY "Users can insert own activity"
ON public.user_activity
FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM public.unified_profiles WHERE auth_user_id = auth.uid()
  )
);

-- Users can read their own activity
CREATE POLICY "Users can read own activity"
ON public.user_activity
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.unified_profiles WHERE auth_user_id = auth.uid()
  )
);

-- Admins can read all activity
CREATE POLICY "Admins can read all activity"
ON public.user_activity
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id IN (SELECT id FROM public.unified_profiles WHERE auth_user_id = auth.uid())
    AND is_active = true
  )
);

-- Users can insert own sessions
CREATE POLICY "Users can insert own sessions"
ON public.user_sessions
FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM public.unified_profiles WHERE auth_user_id = auth.uid()
  )
);

-- Users can update own sessions
CREATE POLICY "Users can update own sessions"
ON public.user_sessions
FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM public.unified_profiles WHERE auth_user_id = auth.uid()
  )
);

-- Users can read own sessions
CREATE POLICY "Users can read own sessions"
ON public.user_sessions
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.unified_profiles WHERE auth_user_id = auth.uid()
  )
);

-- Admins can read all sessions
CREATE POLICY "Admins can read all sessions"
ON public.user_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id IN (SELECT id FROM public.unified_profiles WHERE auth_user_id = auth.uid())
    AND is_active = true
  )
);

-- Function to get user journey summary for admins
CREATE OR REPLACE FUNCTION public.get_user_journey_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
  v_is_admin boolean;
BEGIN
  -- Check if caller is admin
  SELECT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid())
    AND is_active = true
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;
  
  SELECT jsonb_build_object(
    'total_sessions', (SELECT COUNT(*) FROM user_sessions WHERE user_id = p_user_id),
    'total_page_views', (SELECT COUNT(*) FROM user_activity WHERE user_id = p_user_id AND event_type = 'page_view'),
    'total_clicks', (SELECT COUNT(*) FROM user_activity WHERE user_id = p_user_id AND event_type = 'click'),
    'total_actions', (SELECT COUNT(*) FROM user_activity WHERE user_id = p_user_id AND event_type = 'action'),
    'avg_session_duration', (SELECT COALESCE(AVG(duration_seconds), 0) FROM user_sessions WHERE user_id = p_user_id AND duration_seconds IS NOT NULL),
    'total_time_seconds', (SELECT COALESCE(SUM(duration_seconds), 0) FROM user_sessions WHERE user_id = p_user_id),
    'first_seen', (SELECT MIN(created_at) FROM user_activity WHERE user_id = p_user_id),
    'last_seen', (SELECT MAX(created_at) FROM user_activity WHERE user_id = p_user_id),
    'rewards_claimed', (SELECT COUNT(*) FROM rewards_claims rc JOIN unified_profiles up ON rc.user_id = up.auth_user_id WHERE up.id = p_user_id),
    'referrals_made', (SELECT COUNT(*) FROM referrals r JOIN unified_profiles up ON r.referrer_id = up.auth_user_id WHERE up.id = p_user_id)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;