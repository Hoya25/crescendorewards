import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';

// Session ID persists for the browser session
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('crescendo_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('crescendo_session_id', sessionId);
  }
  return sessionId;
};

// Detect device type
const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile';
  return 'desktop';
};

// Get browser name
const getBrowser = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  return 'Other';
};

interface TrackEventOptions {
  eventName?: string;
  elementId?: string;
  elementText?: string;
  metadata?: Record<string, unknown>;
  pagePath?: string;
}

export function useActivityTracker() {
  const { profile } = useUnifiedUser();
  const location = useLocation();
  const sessionId = useRef(getSessionId());
  const lastPageView = useRef<string | null>(null);
  const lastPageViewTime = useRef<number>(0);
  const pageEnterTime = useRef<number>(Date.now());
  const sessionStarted = useRef(false);

  // Check if path is admin (skip tracking)
  const isAdminPath = (path: string) => path.startsWith('/admin');

  // Get the auth user id for tracking
  const getAuthUserId = useCallback(async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  }, []);

  // Track event function
  const trackEvent = useCallback(async (
    eventType: 'page_view' | 'click' | 'action' | 'session_start' | 'session_end',
    options: TrackEventOptions = {}
  ) => {
    const userId = await getAuthUserId();
    if (!userId) return;

    const pagePath = options.pagePath ?? location.pathname;

    // Skip admin pages
    if (isAdminPath(pagePath)) return;

    try {
      await supabase.from('user_activity').insert([{
        user_id: userId,
        session_id: sessionId.current,
        event_type: eventType,
        event_name: options.eventName,
        page_path: pagePath,
        page_title: document.title,
        element_id: options.elementId,
        element_text: options.elementText?.slice(0, 255),
        metadata: options.metadata ? JSON.parse(JSON.stringify(options.metadata)) : null,
        referrer: lastPageView.current,
        device_type: getDeviceType(),
        browser: getBrowser()
      }]);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, [getAuthUserId, location.pathname]);

  // Track page views on route change (with debounce)
  useEffect(() => {
    if (!profile?.id) return;
    if (isAdminPath(location.pathname)) return;

    // Debounce: skip if same path within 1 second
    const now = Date.now();
    if (location.pathname === lastPageView.current && now - lastPageViewTime.current < 1000) {
      return;
    }

    // Calculate time on previous page
    const timeOnPrevPage = Date.now() - pageEnterTime.current;

    trackEvent('page_view', {
      eventName: `viewed_${location.pathname.replace(/\//g, '_').slice(1) || 'home'}`,
      metadata: {
        time_on_previous_page_ms: lastPageView.current ? timeOnPrevPage : null
      }
    });

    // Update refs
    lastPageView.current = location.pathname;
    lastPageViewTime.current = now;
    pageEnterTime.current = Date.now();
  }, [location.pathname, profile?.id, trackEvent]);

  // Track session start
  useEffect(() => {
    if (!profile?.id || sessionStarted.current) return;

    const isNewSession = !sessionStorage.getItem('crescendo_session_started');
    if (isNewSession) {
      sessionStorage.setItem('crescendo_session_started', 'true');
      sessionStarted.current = true;

      trackEvent('session_start', {
        eventName: 'session_started',
        metadata: {
          device_type: getDeviceType(),
          browser: getBrowser(),
        }
      });

      // Create session record
      supabase.from('user_sessions').insert({
        user_id: profile.id,
        session_id: sessionId.current,
        started_at: new Date().toISOString(),
        entry_page: location.pathname,
        device_type: getDeviceType(),
        browser: getBrowser()
      }).then(({ error }) => {
        if (error) console.error('Failed to create session:', error);
      });
    }

    // Track session end on page unload via sendBeacon
    const handleUnload = () => {
      const duration = Math.floor((Date.now() - pageEnterTime.current) / 1000);

      const payload = JSON.stringify({
        user_id: profile.id,
        session_id: sessionId.current,
        ended_at: new Date().toISOString(),
        exit_page: location.pathname,
        duration_seconds: duration
      });

      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-session-end`,
        payload
      );

      // Also log session_end event via sendBeacon to user_activity
      const activityPayload = JSON.stringify({
        user_id: profile.id,
        session_id: sessionId.current,
        event_type: 'session_end',
        event_name: 'session_ended',
        page_path: location.pathname,
        device_type: getDeviceType(),
        browser: getBrowser()
      });

      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-session-end`,
        activityPayload
      );
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [profile?.id, location.pathname, trackEvent]);

  // Click tracker function for manual use
  const trackClick = useCallback((
    elementId: string,
    elementText?: string,
    metadata?: Record<string, unknown>
  ) => {
    trackEvent('click', {
      eventName: `clicked_${elementId}`,
      elementId,
      elementText,
      metadata
    });
  }, [trackEvent]);

  // Action tracker for important actions
  const trackAction = useCallback((
    actionName: string,
    metadata?: Record<string, unknown>
  ) => {
    trackEvent('action', {
      eventName: actionName,
      metadata
    });
  }, [trackEvent]);

  return { trackClick, trackAction, trackEvent };
}
