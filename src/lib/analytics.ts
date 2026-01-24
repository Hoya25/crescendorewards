/**
 * Simple analytics tracking utility for Crescendo
 * Currently logs to console - can be extended to Mixpanel, Amplitude, PostHog, etc.
 */

type EventName =
  | 'page_view'
  | 'signup_completed'
  | 'login_completed'
  | 'claim_attempted'
  | 'claim_successful'
  | 'claim_failed'
  | 'purchase_attempted'
  | 'purchase_successful'
  | 'purchase_failed'
  | 'feedback_submitted'
  | 'reward_viewed'
  | 'reward_wishlisted'
  | 'reward_favorited'
  | 'referral_copied'
  | 'onboarding_completed'
  | 'onboarding_skipped'
  | 'referred_welcome_completed'
  | 'tier_upgraded';

interface EventData {
  [key: string]: string | number | boolean | undefined | null;
}

const isDev = import.meta.env.DEV;

/**
 * Track an analytics event
 * @param eventName - The name of the event to track
 * @param data - Optional data to attach to the event
 */
export function trackEvent(eventName: EventName, data?: EventData): void {
  const timestamp = new Date().toISOString();
  const payload = {
    event: eventName,
    timestamp,
    url: window.location.pathname,
    ...data,
  };

  // Always log in development, optionally in production
  if (isDev) {
    console.log('[Analytics]', eventName, payload);
  }

  // TODO: Send to analytics service
  // Example: mixpanel.track(eventName, payload);
  // Example: amplitude.logEvent(eventName, payload);
  // Example: posthog.capture(eventName, payload);
}

/**
 * Track a page view
 * @param pageName - Optional custom page name
 */
export function trackPageView(pageName?: string): void {
  trackEvent('page_view', {
    page: pageName || window.location.pathname,
    referrer: document.referrer || undefined,
  });
}

/**
 * Identify a user for analytics
 * @param userId - The user's ID
 * @param traits - Optional user traits
 */
export function identifyUser(userId: string, traits?: EventData): void {
  if (isDev) {
    console.log('[Analytics] Identify:', userId, traits);
  }

  // TODO: Identify user in analytics service
  // Example: mixpanel.identify(userId);
  // Example: mixpanel.people.set(traits);
}