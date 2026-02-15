
-- Create check_ins table for daily streak tracking
CREATE TABLE public.check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_in_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, checked_in_at)
);

-- Enable RLS
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- Users can read their own check-ins
CREATE POLICY "Users can read own check-ins"
ON public.check_ins
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own check-ins
CREATE POLICY "Users can insert own check-ins"
ON public.check_ins
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Index for efficient streak lookups
CREATE INDEX idx_check_ins_user_date ON public.check_ins (user_id, checked_in_at DESC);

-- Function to calculate current streak and award reward if 7-day streak completed
CREATE OR REPLACE FUNCTION public.perform_daily_checkin(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_already_checked_in BOOLEAN;
  v_streak INT := 0;
  v_check_date DATE;
  v_reward_amount INT := 1500;
  v_streak_completed BOOLEAN := false;
BEGIN
  -- Check if already checked in today
  SELECT EXISTS(
    SELECT 1 FROM check_ins WHERE user_id = p_user_id AND checked_in_at = v_today
  ) INTO v_already_checked_in;

  IF v_already_checked_in THEN
    -- Still calculate current streak for display
    v_check_date := v_today;
    LOOP
      IF EXISTS(SELECT 1 FROM check_ins WHERE user_id = p_user_id AND checked_in_at = v_check_date) THEN
        v_streak := v_streak + 1;
        v_check_date := v_check_date - INTERVAL '1 day';
      ELSE
        EXIT;
      END IF;
      IF v_streak >= 7 THEN EXIT; END IF;
    END LOOP;

    RETURN jsonb_build_object(
      'success', true,
      'already_checked_in', true,
      'streak', v_streak,
      'streak_completed', false,
      'message', 'Already checked in today'
    );
  END IF;

  -- Insert today's check-in
  INSERT INTO check_ins (user_id, checked_in_at) VALUES (p_user_id, v_today);

  -- Calculate streak (including today)
  v_check_date := v_today;
  LOOP
    IF EXISTS(SELECT 1 FROM check_ins WHERE user_id = p_user_id AND checked_in_at = v_check_date) THEN
      v_streak := v_streak + 1;
      v_check_date := v_check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
    IF v_streak >= 7 THEN EXIT; END IF;
  END LOOP;

  -- If streak hits 7, award reward and reset
  IF v_streak >= 7 THEN
    v_streak_completed := true;
    
    -- Award 1,500 NCTR in 360LOCK
    UPDATE profiles
    SET locked_nctr = locked_nctr + v_reward_amount,
        updated_at = now()
    WHERE id = p_user_id;

    -- Delete the 7 check-ins that formed the streak to reset
    DELETE FROM check_ins
    WHERE user_id = p_user_id
    AND checked_in_at >= (v_today - INTERVAL '6 days')
    AND checked_in_at <= v_today;

    -- Create notification
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      p_user_id,
      'streak_reward',
      '🔥 7-Day Streak Complete!',
      'You earned ' || v_reward_amount || ' NCTR in 360LOCK for your weekly check-in streak!',
      jsonb_build_object('reward', v_reward_amount, 'streak_days', 7)
    );

    v_streak := 0; -- Reset after reward
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'already_checked_in', false,
    'streak', v_streak,
    'streak_completed', v_streak_completed,
    'reward', CASE WHEN v_streak_completed THEN v_reward_amount ELSE 0 END,
    'message', CASE WHEN v_streak_completed 
      THEN '🔥 7-day streak complete! ' || v_reward_amount || ' NCTR earned!'
      ELSE 'Checked in! Day ' || v_streak || ' of 7'
    END
  );
END;
$$;

-- Function to get current streak status without checking in
CREATE OR REPLACE FUNCTION public.get_checkin_streak(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_checked_in_today BOOLEAN;
  v_streak INT := 0;
  v_check_date DATE;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM check_ins WHERE user_id = p_user_id AND checked_in_at = v_today
  ) INTO v_checked_in_today;

  -- Calculate streak from today (or yesterday if not checked in today)
  IF v_checked_in_today THEN
    v_check_date := v_today;
  ELSE
    v_check_date := v_today - INTERVAL '1 day';
    -- Only count past streak if yesterday was checked in
    IF NOT EXISTS(SELECT 1 FROM check_ins WHERE user_id = p_user_id AND checked_in_at = v_check_date) THEN
      RETURN jsonb_build_object(
        'streak', 0,
        'checked_in_today', false,
        'max', 7
      );
    END IF;
  END IF;

  LOOP
    IF EXISTS(SELECT 1 FROM check_ins WHERE user_id = p_user_id AND checked_in_at = v_check_date) THEN
      v_streak := v_streak + 1;
      v_check_date := v_check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
    IF v_streak >= 7 THEN EXIT; END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'streak', v_streak,
    'checked_in_today', v_checked_in_today,
    'max', 7
  );
END;
$$;
