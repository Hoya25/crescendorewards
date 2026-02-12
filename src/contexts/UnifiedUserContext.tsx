import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from './AuthContext';

// Types for the unified user system
export interface StatusTier {
  id: string;
  tier_name: string;
  display_name: string;
  badge_emoji: string;
  badge_color: string;
  min_nctr_360_locked: number;
  max_nctr_360_locked: number | null;
  benefits: string[];
  sort_order: number;
  is_active: boolean;
  earning_multiplier?: number;
}

export interface WalletPortfolio {
  id: string;
  wallet_address: string;
  nctr_balance: number;
  nctr_360_locked: number;
  nctr_90_locked: number;
  nctr_unlocked: number;
  locks: Array<{
    amount: number;
    lock_type: string;
    lock_date: string;
    unlock_date: string;
  }>;
  last_synced_at: string;
  sync_source: string | null;
}

export interface UnifiedProfile {
  id: string;
  auth_user_id: string;
  wallet_address: string | null;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  current_tier_id: string | null;
  tier_calculated_at: string | null;
  garden_data: Record<string, any>;
  crescendo_data: {
    claims_balance?: number;
    role?: 'member' | 'contributor' | 'admin';
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
  last_active_garden: string | null;
  last_active_crescendo: string | null;
}

export interface UnifiedUser {
  profile: UnifiedProfile | null;
  tier: StatusTier | null;
  portfolio: WalletPortfolio[] | null;
  allTiers: StatusTier[];
  nextTier: StatusTier | null;
  progressToNextTier: number; // 0-100 percentage
  total360Locked: number;
}

interface UnifiedUserContextType extends UnifiedUser {
  loading: boolean;
  error: Error | null;
  refreshUnifiedProfile: () => Promise<void>;
  createUnifiedProfile: () => Promise<void>;
  updateUnifiedProfile: (updates: Partial<UnifiedProfile>) => Promise<void>;
  syncWalletPortfolio: (walletAddress: string, data: Partial<WalletPortfolio>) => Promise<void>;
}

const UnifiedUserContext = createContext<UnifiedUserContextType | undefined>(undefined);

export function UnifiedUserProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<UnifiedProfile | null>(null);
  const [tier, setTier] = useState<StatusTier | null>(null);
  const [portfolio, setPortfolio] = useState<WalletPortfolio[] | null>(null);
  const [allTiers, setAllTiers] = useState<StatusTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Calculate total 360LOCK from all wallets, with fallback to crescendo_data
  const portfolioTotal360 = portfolio?.reduce((sum, w) => sum + (w.nctr_360_locked || 0), 0) || 0;
  const crescendoLocked = (profile?.crescendo_data?.locked_nctr as number) || 0;
  const crescendoAvailable = (profile?.crescendo_data?.available_nctr as number) || 0;
  
  // Use wallet_portfolio if available, otherwise fall back to crescendo_data
  const total360Locked = portfolioTotal360 > 0 ? portfolioTotal360 : crescendoLocked;

  // Calculate next tier and progress
  const nextTier = allTiers.find(t => 
    t.is_active && 
    t.min_nctr_360_locked > total360Locked
  ) || null;

  const progressToNextTier = (() => {
    if (!tier || !nextTier) return 100;
    const currentMin = tier.min_nctr_360_locked;
    const nextMin = nextTier.min_nctr_360_locked;
    const range = nextMin - currentMin;
    if (range <= 0) return 100;
    const progress = ((total360Locked - currentMin) / range) * 100;
    return Math.min(100, Math.max(0, progress));
  })();

  // Fetch all status tiers
  const fetchAllTiers = useCallback(async () => {
    try {
      const { data, error: tierError } = await supabase
        .from('status_tiers')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (tierError) throw tierError;
      
      // Parse benefits from JSON
      const parsedTiers = (data || []).map(t => ({
        ...t,
        benefits: Array.isArray(t.benefits) 
          ? t.benefits as string[]
          : typeof t.benefits === 'string' 
            ? JSON.parse(t.benefits) 
            : []
      }));
      
      setAllTiers(parsedTiers as StatusTier[]);
    } catch (err) {
      console.error('Error fetching tiers:', err);
    }
  }, []);

  // Fetch unified profile with tier and portfolio
  const fetchUnifiedProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setTier(null);
      setPortfolio(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch unified profile
      const { data: profileData, error: profileError } = await supabase
        .from('unified_profiles')
        .select(`
          *,
          status_tiers (*)
        `)
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        const { status_tiers: tierData, ...profileOnly } = profileData;
        setProfile(profileOnly as UnifiedProfile);
        
        if (tierData) {
          const parsedTier = {
            ...tierData,
            benefits: Array.isArray(tierData.benefits) 
              ? tierData.benefits as string[]
              : typeof tierData.benefits === 'string'
                ? JSON.parse(tierData.benefits)
                : []
          };
          setTier(parsedTier as StatusTier);
        } else {
          setTier(null);
        }

        // Fetch wallet portfolio
        const { data: portfolioData, error: portfolioError } = await supabase
          .from('wallet_portfolio')
          .select('*')
          .eq('user_id', profileOnly.id);

        if (portfolioError) throw portfolioError;
        
        const parsedPortfolio = (portfolioData || []).map(p => ({
          ...p,
          locks: Array.isArray(p.locks) 
            ? p.locks 
            : typeof p.locks === 'string'
              ? JSON.parse(p.locks)
              : []
        }));
        
        setPortfolio(parsedPortfolio as WalletPortfolio[]);
      } else {
        setProfile(null);
        setTier(null);
        setPortfolio(null);
      }
    } catch (err) {
      console.error('Error fetching unified profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create unified profile if it doesn't exist
  const createUnifiedProfile = useCallback(async () => {
    if (!user) return;

    try {
      // Get default tier (Droplet)
      const defaultTier = allTiers.find(t => t.tier_name === 'droplet') || allTiers[0];

      const { data, error: insertError } = await supabase
        .from('unified_profiles')
        .insert({
          auth_user_id: user.id,
          email: user.email,
          display_name: user.user_metadata?.full_name || null,
          current_tier_id: defaultTier?.id || null,
          crescendo_data: {
            claims_balance: 0,
            role: 'member'
          },
          garden_data: {},
          last_active_crescendo: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      await fetchUnifiedProfile();
    } catch (err) {
      console.error('Error creating unified profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to create profile'));
    }
  }, [user, allTiers, fetchUnifiedProfile]);

  // Update unified profile
  const updateUnifiedProfile = useCallback(async (updates: Partial<UnifiedProfile>) => {
    if (!profile) return;

    try {
      const { error: updateError } = await supabase
        .from('unified_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          last_active_crescendo: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;
      
      await fetchUnifiedProfile();
    } catch (err) {
      console.error('Error updating unified profile:', err);
      throw err;
    }
  }, [profile, fetchUnifiedProfile]);

  // Sync wallet portfolio
  const syncWalletPortfolio = useCallback(async (
    walletAddress: string, 
    data: Partial<WalletPortfolio>
  ) => {
    if (!profile) return;

    try {
      const { error: upsertError } = await supabase
        .from('wallet_portfolio')
        .upsert({
          user_id: profile.id,
          wallet_address: walletAddress,
          ...data,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,wallet_address'
        });

      if (upsertError) throw upsertError;
      
      await fetchUnifiedProfile();
    } catch (err) {
      console.error('Error syncing wallet portfolio:', err);
      throw err;
    }
  }, [profile, fetchUnifiedProfile]);

  // Initial fetch
  useEffect(() => {
    fetchAllTiers();
  }, [fetchAllTiers]);

  useEffect(() => {
    if (user) {
      fetchUnifiedProfile();
    } else {
      setProfile(null);
      setTier(null);
      setPortfolio(null);
      setLoading(false);
    }
  }, [user, fetchUnifiedProfile]);

  // Real-time subscription to wallet_portfolio changes
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`wallet_portfolio_${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_portfolio',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log('Portfolio updated via realtime:', payload);
          // Refresh the profile to get updated data
          fetchUnifiedProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, fetchUnifiedProfile]);

  return (
    <UnifiedUserContext.Provider
      value={{
        profile,
        tier,
        portfolio,
        allTiers,
        nextTier,
        progressToNextTier,
        total360Locked,
        loading,
        error,
        refreshUnifiedProfile: fetchUnifiedProfile,
        createUnifiedProfile,
        updateUnifiedProfile,
        syncWalletPortfolio,
      }}
    >
      {children}
    </UnifiedUserContext.Provider>
  );
}

export function useUnifiedUser() {
  const context = useContext(UnifiedUserContext);
  if (context === undefined) {
    throw new Error('useUnifiedUser must be used within a UnifiedUserProvider');
  }
  return context;
}
