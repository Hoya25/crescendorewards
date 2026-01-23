// Userback user identification utility
// The widget script is loaded directly in index.html with standard installation

declare global {
  interface Window {
    Userback?: {
      identify?: (userId: string, data: { name?: string; email?: string }) => void;
    };
  }
}

/**
 * Identify logged-in user to Userback for better feedback tracking.
 * Call this after successful authentication.
 */
export function identifyUserbackUser(userId: string, name?: string, email?: string) {
  // Retry with delay if widget hasn't loaded yet
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
    // Widget may still be loading, retry after a short delay
    setTimeout(doIdentify, 2000);
  }
}

/**
 * Clear Userback user identification on logout
 */
export function clearUserbackUser() {
  // Userback resets on page reload
}
