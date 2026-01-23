import { createContext, useContext, ReactNode } from 'react';
import { useActivityTracker } from '@/hooks/useActivityTracker';

interface ActivityContextType {
  trackClick: (elementId: string, elementText?: string, metadata?: Record<string, unknown>) => void;
  trackAction: (actionName: string, metadata?: Record<string, unknown>) => void;
}

const ActivityContext = createContext<ActivityContextType | null>(null);

export function ActivityTrackerProvider({ children }: { children: ReactNode }) {
  const { trackClick, trackAction } = useActivityTracker();

  return (
    <ActivityContext.Provider value={{ trackClick, trackAction }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useTracking() {
  const context = useContext(ActivityContext);
  if (!context) {
    // Return no-op functions if used outside provider (graceful fallback)
    return {
      trackClick: () => {},
      trackAction: () => {}
    };
  }
  return context;
}
