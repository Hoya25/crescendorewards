import React, { createContext, useContext, useState, useCallback } from 'react';

interface DemoModeState {
  isEnabled: boolean;
  statusTier: 'bronze' | 'silver' | 'gold';
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
  enableDemoMode: (tier?: 'bronze' | 'silver' | 'gold') => void;
  disableDemoMode: () => void;
  toggleDemoMode: () => void;
  setDemoTier: (tier: 'bronze' | 'silver' | 'gold') => void;
}

const DEMO_PRESETS: Record<'bronze' | 'silver' | 'gold', Omit<DemoModeState, 'isEnabled'>> = {
  bronze: {
    statusTier: 'bronze',
    groundballLocked: 100,
    selectionsMax: 2,
    selectionsUsed: 0,
    freeSwapsRemaining: 1,
    claimsBalance: 25,
    bonusSelections: 0,
  },
  silver: {
    statusTier: 'silver',
    groundballLocked: 250,
    selectionsMax: 4,
    selectionsUsed: 0,
    freeSwapsRemaining: 1,
    claimsBalance: 50,
    bonusSelections: 0,
  },
  gold: {
    statusTier: 'gold',
    groundballLocked: 500,
    selectionsMax: 7,
    selectionsUsed: 0,
    freeSwapsRemaining: 2,
    claimsBalance: 100,
    bonusSelections: 0,
  },
};

const DemoModeContext = createContext<DemoModeContextValue | undefined>(undefined);

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [demoMode, setDemoMode] = useState<DemoModeState>({
    isEnabled: false,
    ...DEMO_PRESETS.gold,
  });

  const enableDemoMode = useCallback((tier: 'bronze' | 'silver' | 'gold' = 'gold') => {
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

  const setDemoTier = useCallback((tier: 'bronze' | 'silver' | 'gold') => {
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
