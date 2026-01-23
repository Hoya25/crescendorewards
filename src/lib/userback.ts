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

const USERBACK_SCRIPT_SRC = 'https://static.userback.io/widget/v1.js';

function hasUserbackScript(): boolean {
  return Boolean(document.querySelector(`script[src="${USERBACK_SCRIPT_SRC}"]`));
}

function injectUserbackScript(): void {
  if (hasUserbackScript()) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = USERBACK_SCRIPT_SRC;
  (document.head || document.body).appendChild(s);
}

function hasOpenApi(): boolean {
  const ub: any = window.Userback;
  return (
    typeof ub?.open === 'function' ||
    typeof ub?.show === 'function' ||
    typeof ub?.openForm === 'function' ||
    typeof ub === 'function'
  );
}

async function ensureUserbackReady(timeoutMs = 4000): Promise<boolean> {
  // Always ensure token/settings exist before loading script
  initUserback();

  if (hasOpenApi()) return true;

  // In case index.html script failed to run or loaded too early, inject again (idempotent)
  injectUserbackScript();

  const startedAt = Date.now();
  return await new Promise((resolve) => {
    const tick = () => {
      if (hasOpenApi()) return resolve(true);
      if (Date.now() - startedAt >= timeoutMs) return resolve(false);
      setTimeout(tick, 100);
    };
    tick();
  });
}

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
    window.Userback.widget_settings = { display: 'manual' };
  } else {
    // If Userback object doesn't exist yet, create it with the token
    window.Userback = {
      access_token: USERBACK_TOKEN,
      widget_settings: { display: 'manual' },
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
export async function openUserbackWidget() {
  if (!USERBACK_TOKEN) {
    console.warn('Cannot open Userback widget: token not configured');
    return;
  }

  const ready = await ensureUserbackReady();
  if (!ready) {
    console.warn('Userback widget not loaded (script blocked or still loading).');
    return;
  }

  const ub: any = window.Userback;

  // Support multiple API variants (depends on widget/snippet version)
  if (typeof ub?.open === 'function') return ub.open();
  if (typeof ub?.show === 'function') return ub.show();
  if (typeof ub?.openForm === 'function') return ub.openForm();
  if (typeof ub === 'function') return ub('open');

  console.warn('Userback widget loaded but no open API was found.', ub);
}

export default {
  init: initUserback,
  identify: identifyUserbackUser,
  clear: clearUserbackUser,
  open: openUserbackWidget,
};
