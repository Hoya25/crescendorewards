import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authMode: 'signin' | 'signup';
  setAuthMode: (mode: 'signin' | 'signup') => void;
  // Profile completion for wallet users
  showProfileCompletion: boolean;
  setShowProfileCompletion: (show: boolean) => void;
  walletAddress: string | null;
  needsProfileCompletion: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const pendingSignupRedirect = useRef(false);

  // Check if user needs to complete their profile (wallet users without real email/name)
  const checkProfileCompletion = async (authUser: User) => {
    try {
      const email = authUser.email;
      const fullName = authUser.user_metadata?.full_name;
      
      // Check if this is a wallet-generated email
      const isWalletEmail = email?.includes('@wallet.crescendo.app');
      
      if (isWalletEmail) {
        // Get the profile to check if they have real name/email
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, wallet_address')
          .eq('id', authUser.id)
          .single();
        
        if (profile) {
          setWalletAddress(profile.wallet_address);
          
          // Check if profile has real name and non-wallet email
          const hasRealName = profile.full_name && 
            !profile.full_name.startsWith('User 0x');
          const hasRealEmail = profile.email && 
            !profile.email.includes('@wallet.crescendo.app');
          
          if (!hasRealName || !hasRealEmail) {
            setNeedsProfileCompletion(true);
            // Show modal on first load only
            setShowProfileCompletion(true);
          } else {
            setNeedsProfileCompletion(false);
          }
        }
      } else {
        setNeedsProfileCompletion(false);
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
    }
  };

  // Ensure unified profile exists for new users
  const ensureUnifiedProfile = async (authUser: User) => {
    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('unified_profiles')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking unified profile:', fetchError);
        return;
      }

      if (!existingProfile) {
        console.log('Creating unified profile for new user:', authUser.id);
        
        const { data: defaultTier } = await supabase
          .from('status_tiers')
          .select('id')
          .eq('tier_name', 'droplet')
          .single();

        const { data: newProfile, error: insertError } = await supabase
          .from('unified_profiles')
          .insert({
            auth_user_id: authUser.id,
            email: authUser.email,
            display_name: authUser.user_metadata?.full_name || null,
            current_tier_id: defaultTier?.id || null,
            crescendo_data: {
              claims_balance: 0,
              available_nctr: 100,
              role: 'member'
            },
            garden_data: {},
            last_active_crescendo: new Date().toISOString()
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Error creating unified profile:', insertError);
        } else if (newProfile) {
          console.log('Unified profile created successfully');
          // Mark for post-signup redirect
          pendingSignupRedirect.current = true;

          // Try to assign Founding 111
          try {
            const { data: foundingResult } = await supabase.rpc('assign_founding_111', {
              p_user_id: newProfile.id
            });
            
            const result = foundingResult as Record<string, unknown> | null;
            
            // Show toasts after a brief delay to let the UI settle
            setTimeout(() => {
              toast.success('Welcome to Crescendo! You earned 625 NCTR just for joining. 🎉');
              if (result?.success && result?.founding_number) {
                toast.success(`You're Founding Member #${result.founding_number}! 🎉`, {
                  duration: 6000,
                });
              }
              // Navigate to bounties
              window.location.href = '/bounties';
            }, 500);
          } catch (err) {
            console.error('Error assigning founding 111:', err);
            setTimeout(() => {
              toast.success('Welcome to Crescendo! You earned 625 NCTR just for joining. 🎉');
              window.location.href = '/bounties';
            }, 500);
          }
        }
      }
    } catch (error) {
      console.error('Error in ensureUnifiedProfile:', error);
    }
  };

  // Track login activity by updating last_active_crescendo
  const trackLoginActivity = async (authUserId: string) => {
    try {
      const { error } = await supabase
        .from('unified_profiles')
        .update({ last_active_crescendo: new Date().toISOString() })
        .eq('auth_user_id', authUserId);
      
      if (error) {
        console.error('Error tracking login activity:', error);
      }
    } catch (error) {
      console.error('Error in trackLoginActivity:', error);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // On sign in or sign up, ensure unified profile exists and track login
        if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          // Use setTimeout to avoid potential Supabase auth deadlock
          setTimeout(() => {
            ensureUnifiedProfile(session.user);
            checkProfileCompletion(session.user);
            // Track login activity on SIGNED_IN event
            if (event === 'SIGNED_IN') {
              trackLoginActivity(session.user.id);
            }
          }, 0);
        }

        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => {
          ensureUnifiedProfile(session.user);
          checkProfileCompletion(session.user);
          // Track activity on session restore (returning user)
          trackLoginActivity(session.user.id);
        }, 0);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setNeedsProfileCompletion(false);
    setWalletAddress(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAuthenticated: !!user,
        signOut,
        showAuthModal,
        setShowAuthModal,
        authMode,
        setAuthMode,
        showProfileCompletion,
        setShowProfileCompletion,
        walletAddress,
        needsProfileCompletion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
