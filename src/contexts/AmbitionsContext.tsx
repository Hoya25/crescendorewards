import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface Ambition {
  rewardId: string;
  rewardName: string;
  claimable: boolean;
  distance?: string; // e.g. "6,580 NCTR away"
}

interface AmbitionsContextValue {
  ambitions: Ambition[];
  toggleAmbition: (ambition: Ambition) => void;
  removeAmbition: (rewardId: string) => void;
  isAmbition: (rewardId: string) => boolean;
}

const AmbitionsContext = createContext<AmbitionsContextValue | null>(null);

export function AmbitionsProvider({ children }: { children: ReactNode }) {
  const [ambitions, setAmbitions] = useState<Ambition[]>([]);

  const toggleAmbition = useCallback((ambition: Ambition) => {
    setAmbitions((prev) => {
      const exists = prev.find((a) => a.rewardId === ambition.rewardId);
      if (exists) return prev.filter((a) => a.rewardId !== ambition.rewardId);
      return [...prev, ambition];
    });
  }, []);

  const removeAmbition = useCallback((rewardId: string) => {
    setAmbitions((prev) => prev.filter((a) => a.rewardId !== rewardId));
  }, []);

  const isAmbition = useCallback(
    (rewardId: string) => ambitions.some((a) => a.rewardId === rewardId),
    [ambitions]
  );

  return (
    <AmbitionsContext.Provider value={{ ambitions, toggleAmbition, removeAmbition, isAmbition }}>
      {children}
    </AmbitionsContext.Provider>
  );
}

export function useAmbitions() {
  const ctx = useContext(AmbitionsContext);
  if (!ctx) throw new Error('useAmbitions must be used within AmbitionsProvider');
  return ctx;
}
