import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface LockDecisionRequest {
  baseAmount: number;
  sourceType: 'bounty' | 'shopping' | 'merch' | 'referral' | 'signup' | 'profile' | 'other';
  sourceName: string;
  requires360Lock?: boolean;
  lockMultiplier?: number;
}

interface LockDecisionResult {
  lockType: '90lock' | '360lock';
  baseAmount: number;
  finalAmount: number;
  multiplier: number;
}

interface LockDecisionContextType {
  showLockDecision: (request: LockDecisionRequest) => Promise<LockDecisionResult | null>;
  isOpen: boolean;
}

const LockDecisionContext = createContext<LockDecisionContextType | undefined>(undefined);

export function LockDecisionProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<LockDecisionRequest | null>(null);
  const [resolver, setResolver] = useState<{
    resolve: (result: LockDecisionResult | null) => void;
  } | null>(null);

  const showLockDecision = useCallback((req: LockDecisionRequest): Promise<LockDecisionResult | null> => {
    return new Promise((resolve) => {
      setRequest(req);
      setResolver({ resolve });
    });
  }, []);

  const handleComplete = useCallback((result: LockDecisionResult | null) => {
    resolver?.resolve(result);
    setResolver(null);
    setRequest(null);
  }, [resolver]);

  return (
    <LockDecisionContext.Provider value={{ showLockDecision, isOpen: !!request }}>
      {children}
      {request && (
        <LockDecisionModalInner
          request={request}
          onComplete={handleComplete}
        />
      )}
    </LockDecisionContext.Provider>
  );
}

export function useLockDecision() {
  const context = useContext(LockDecisionContext);
  if (!context) {
    throw new Error('useLockDecision must be used within a LockDecisionProvider');
  }
  return context;
}

// Forward declaration — actual component in LockDecisionModal.tsx
// We import it lazily to avoid circular deps
import { LockDecisionModalInner } from '@/components/lock-decision/LockDecisionModal';
