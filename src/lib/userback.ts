// Userback type declarations and initialization

declare global {
  interface Window {
    Userback?: {
      access_token?: string;
      identify?: (userId: string, data: { name?: string; email?: string; account_id?: string }) => void;
      open?: () => void;
      close?: () => void;
      hide?: () => void;
      show?: () => void;
      widget_settings?: {
        display?: 'manual' | 'auto';
      };
    };
  }
}

// Userback widget token (publishable, safe to embed in frontend code)
const USERBACK_TOKEN = import.meta.env.VITE_USERBACK_TOKEN || 'A-CgAKnnPbKMeBZelCUa5I3ita5';

/**
 * Initialize Userback with the access token
 * This should be called after the widget script has loaded
 */
export function initUserback() {
  if (!USERBACK_TOKEN) {
    console.warn('Userback token not configured. Set VITE_USERBACK_TOKEN in environment.');
    return;
  }

  // Set the access token on the Userback object
  // The widget script from index.html creates window.Userback
  if (window.Userback) {
    window.Userback.access_token = USERBACK_TOKEN;
  } else {
    // If Userback object doesn't exist yet, create it with the token
    window.Userback = {
      access_token: USERBACK_TOKEN,
    };
  }
}

/**
 * Identify logged-in user to Userback for better feedback tracking
 */
export function identifyUserbackUser(userId: string, name?: string, email?: string) {
  if (!USERBACK_TOKEN) return;
  
  const doIdentify = () => {
    if (window.Userback?.identify) {
      window.Userback.identify(userId, {
        name: name || undefined,
        email: email || undefined,
      });
    }
  };

  if (window.Userback?.identify) {
    doIdentify();
  } else {
    // Retry after a short delay if widget hasn't loaded yet
    setTimeout(doIdentify, 1500);
  }
}

/**
 * Clear Userback user identification on logout
 */
export function clearUserbackUser() {
  // Userback doesn't have a clear method, but we can re-identify with empty data
  // The widget will reset on page reload
}

/**
 * Programmatically open the Userback feedback widget
 */
export function openUserbackWidget() {
  if (!USERBACK_TOKEN) {
    console.warn('Cannot open Userback widget: token not configured');
    return;
  }
  
  if (window.Userback?.open) {
    window.Userback.open();
  } else {
    console.warn('Userback widget not loaded yet');
  }
}

export default {
  init: initUserback,
  identify: identifyUserbackUser,
  clear: clearUserbackUser,
  open: openUserbackWidget,
};
