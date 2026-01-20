-- Create watchlist table for out-of-stock notifications
CREATE TABLE public.reward_watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_reward_watch UNIQUE (user_id, reward_id)
);

-- Enable RLS
ALTER TABLE public.reward_watchlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own watchlist
CREATE POLICY "Users can view their own watchlist"
ON public.reward_watchlist
FOR SELECT
USING (auth.uid() = user_id);

-- Users can add to their own watchlist
CREATE POLICY "Users can add to their own watchlist"
ON public.reward_watchlist
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove from their own watchlist
CREATE POLICY "Users can remove from their own watchlist"
ON public.reward_watchlist
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all watchlist entries (for analytics)
CREATE POLICY "Admins can view all watchlist entries"
ON public.reward_watchlist
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can update watchlist (for marking as notified)
CREATE POLICY "System can update watchlist"
ON public.reward_watchlist
FOR UPDATE
USING (true);

-- Create function to get watch count for a reward
CREATE OR REPLACE FUNCTION public.get_reward_watch_count(p_reward_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::INTEGER
  FROM reward_watchlist
  WHERE reward_id = p_reward_id AND notified = false;
$$;

-- Create function to notify watchers when reward is restocked
CREATE OR REPLACE FUNCTION public.notify_watchers_on_restock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  watcher RECORD;
  v_reward_title TEXT;
BEGIN
  -- Only trigger when stock goes from 0 (or NULL) to > 0
  IF (OLD.stock_quantity IS NULL OR OLD.stock_quantity <= 0) 
     AND NEW.stock_quantity > 0 THEN
    
    v_reward_title := NEW.title;
    
    -- Create notifications for all watchers who haven't been notified
    FOR watcher IN 
      SELECT user_id 
      FROM reward_watchlist 
      WHERE reward_id = NEW.id AND notified = false
    LOOP
      INSERT INTO notifications (user_id, type, title, message, metadata)
      VALUES (
        watcher.user_id,
        'restock',
        'Back in Stock!',
        v_reward_title || ' is now available',
        jsonb_build_object('reward_id', NEW.id, 'reward_title', v_reward_title)
      );
      
      -- Mark as notified
      UPDATE reward_watchlist
      SET notified = true
      WHERE user_id = watcher.user_id AND reward_id = NEW.id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for restock notifications
CREATE TRIGGER trigger_notify_watchers_on_restock
AFTER UPDATE OF stock_quantity ON rewards
FOR EACH ROW
EXECUTE FUNCTION notify_watchers_on_restock();