import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type DemoTier = 'none' | 'bronze' | 'silver' | 'gold';

interface DemoModeState {
  isEnabled: boolean;
  statusTier: DemoTier;
  groundballLocked: number;
  selectionsMax: number;
  selectionsUsed: number;
  freeSwapsRemaining: number;
  claimsBalance: number;
  bonusSelections: number;
}

interface DemoModeContextValue {
  demoMode: DemoModeState;
  isDemoMode: boolean;
  enableDemoMode: (tier?: DemoTier) => void;
  disableDemoMode: () => void;
  toggleDemoMode: () => void;
  setDemoTier: (tier: DemoTier) => void;
}

// Realistic demo presets for investor demos
const DEMO_PRESETS: Record<DemoTier, Omit<DemoModeState, 'isEnabled'>> = {
  none: {
    statusTier: 'none',
    groundballLocked: 0,
    selectionsMax: 0,
    selectionsUsed: 0,
    freeSwapsRemaining: 0,
    claimsBalance: 10,
    bonusSelections: 0,
  },
  bronze: {
    statusTier: 'bronze',
    groundballLocked: 150,
    selectionsMax: 2,
    selectionsUsed: 1,
    freeSwapsRemaining: 1,
    claimsBalance: 75,
    bonusSelections: 0,
  },
  silver: {
    statusTier: 'silver',
    groundballLocked: 300,
    selectionsMax: 4,
    selectionsUsed: 2,
    freeSwapsRemaining: 1,
    claimsBalance: 150,
    bonusSelections: 1,
  },
  gold: {
    statusTier: 'gold',
    groundballLocked: 750,
    selectionsMax: 7,
    selectionsUsed: 4,
    freeSwapsRemaining: 3,
    claimsBalance: 500,
    bonusSelections: 2,
  },
};

const STORAGE_KEY = 'groundball_demo_mode';

const DemoModeContext = createContext<DemoModeContextValue | undefined>(undefined);

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [demoMode, setDemoMode] = useState<DemoModeState>(() => {
    // Load from localStorage on init
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return { isEnabled: false, ...DEMO_PRESETS[parsed.tier as DemoTier || 'gold'] };
        } catch {
          // Ignore parsing errors
        }
      }
    }
    return {
      isEnabled: false,
      ...DEMO_PRESETS.gold,
    };
  });

  // Persist tier selection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tier: demoMode.statusTier }));
    }
  }, [demoMode.statusTier]);

  const enableDemoMode = useCallback((tier: DemoTier = 'gold') => {
    setDemoMode({
      isEnabled: true,
      ...DEMO_PRESETS[tier],
    });
  }, []);

  const disableDemoMode = useCallback(() => {
    setDemoMode(prev => ({ ...prev, isEnabled: false }));
  }, []);

  const toggleDemoMode = useCallback(() => {
    setDemoMode(prev => ({
      ...prev,
      isEnabled: !prev.isEnabled,
    }));
  }, []);

  const setDemoTier = useCallback((tier: DemoTier) => {
    setDemoMode(prev => ({
      ...prev,
      ...DEMO_PRESETS[tier],
    }));
  }, []);

  return (
    <DemoModeContext.Provider
      value={{
        demoMode,
        isDemoMode: demoMode.isEnabled,
        enableDemoMode,
        disableDemoMode,
        toggleDemoMode,
        setDemoTier,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
}

export default DemoModeContext;
