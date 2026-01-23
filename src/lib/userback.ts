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

const USERBACK_TOKEN = import.meta.env.VITE_USERBACK_TOKEN;

/**
 * Initialize Userback with the access token
 */
export function initUserback() {
  if (!USERBACK_TOKEN) {
    console.warn('Userback token not configured. Set VITE_USERBACK_TOKEN in environment.');
    return;
  }

  if (window.Userback) {
    window.Userback.access_token = USERBACK_TOKEN;
  }
}

/**
 * Identify logged-in user to Userback for better feedback tracking
 */
export function identifyUserbackUser(userId: string, name?: string, email?: string) {
  if (!window.Userback?.identify) {
    // Retry after a short delay if widget hasn't loaded yet
    setTimeout(() => {
      if (window.Userback?.identify) {
        window.Userback.identify(userId, {
          name: name || undefined,
          email: email || undefined,
        });
      }
    }, 1000);
    return;
  }

  window.Userback.identify(userId, {
    name: name || undefined,
    email: email || undefined,
  });
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
  if (window.Userback?.open) {
    window.Userback.open();
  }
}

export default {
  init: initUserback,
  identify: identifyUserbackUser,
  clear: clearUserbackUser,
  open: openUserbackWidget,
};
