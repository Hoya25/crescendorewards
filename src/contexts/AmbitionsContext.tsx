import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Ambition {
  rewardId: string;
  rewardName: string;
  claimable: boolean;
  tierRequired: string;
  distance?: string;
}

interface AmbitionsContextValue {
  ambitions: Ambition[];
  toggleAmbition: (ambition: Ambition) => void;
  removeAmbition: (rewardId: string) => void;
  isAmbition: (rewardId: string) => boolean;
  isLoading: boolean;
}

const AmbitionsContext = createContext<AmbitionsContextValue | null>(null);

const toastStyle = {
  background: '#131313',
  color: '#E2FF6D',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '13px',
  borderRadius: '0px',
  border: 'none',
};

const errorToastStyle = {
  ...toastStyle,
  color: '#FF6B6B',
};

export function AmbitionsProvider({ children }: { children: ReactNode }) {
  const [ambitions, setAmbitions] = useState<Ambition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuthContext();

  // Fetch active ambitions on auth change
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setAmbitions([]);
      return;
    }

    const fetchAmbitions = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('member_ambitions')
        .select('reward_id, reward_name, is_claimable, reward_tier_required')
        .eq('user_id', user.id)
        .is('removed_at', null);

      if (error) {
        console.error('Failed to load ambitions:', error);
      } else if (data) {
        setAmbitions(
          data.map((row) => ({
            rewardId: row.reward_id,
            rewardName: row.reward_name,
            claimable: row.is_claimable,
            tierRequired: row.reward_tier_required,
          }))
        );
      }
      setIsLoading(false);
    };

    fetchAmbitions();
  }, [isAuthenticated, user?.id]);

  const toggleAmbition = useCallback(
    async (ambition: Ambition) => {
      if (!user?.id) return;

      const exists = ambitions.some((a) => a.rewardId === ambition.rewardId);

      if (exists) {
        // Soft-delete: set removed_at
        const { error } = await supabase
          .from('member_ambitions')
          .update({ removed_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('reward_id', ambition.rewardId)
          .is('removed_at', null);

        if (error) {
          toast('Couldn\'t save ambition. Try again.', { duration: 3000, style: errorToastStyle });
          return;
        }

        setAmbitions((prev) => prev.filter((a) => a.rewardId !== ambition.rewardId));
        toast('Ambition removed.', { duration: 3000, style: toastStyle });
      } else {
        // Insert new ambition
        const { error } = await supabase.from('member_ambitions').insert({
          user_id: user.id,
          reward_id: ambition.rewardId,
          reward_name: ambition.rewardName,
          reward_tier_required: ambition.tierRequired || 'Bronze',
          is_claimable: ambition.claimable,
        });

        if (error) {
          // Unique constraint violation = already tracking
          if (error.code === '23505') {
            toast('Already tracking this ambition.', { duration: 3000, style: toastStyle });
          } else {
            toast('Couldn\'t save ambition. Try again.', { duration: 3000, style: errorToastStyle });
          }
          return;
        }

        setAmbitions((prev) => [...prev, ambition]);
        toast(`Wingman: ${ambition.rewardName} — on my radar.`, { duration: 3000, style: toastStyle });
      }
    },
    [ambitions, user?.id]
  );

  const removeAmbition = useCallback(
    async (rewardId: string) => {
      if (!user?.id) return;

      const { error } = await supabase
        .from('member_ambitions')
        .update({ removed_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('reward_id', rewardId)
        .is('removed_at', null);

      if (!error) {
        setAmbitions((prev) => prev.filter((a) => a.rewardId !== rewardId));
      }
    },
    [user?.id]
  );

  const isAmbition = useCallback(
    (rewardId: string) => ambitions.some((a) => a.rewardId === rewardId),
    [ambitions]
  );

  return (
    <AmbitionsContext.Provider value={{ ambitions, toggleAmbition, removeAmbition, isAmbition, isLoading }}>
      {children}
    </AmbitionsContext.Provider>
  );
}

export function useAmbitions() {
  const ctx = useContext(AmbitionsContext);
  if (!ctx) throw new Error('useAmbitions must be used within AmbitionsProvider');
  return ctx;
}
