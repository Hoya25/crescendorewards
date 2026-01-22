import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  // Ensure unified profile exists for new users
  const ensureUnifiedProfile = async (authUser: User) => {
    try {
      // Check if unified profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('unified_profiles')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking unified profile:', fetchError);
        return;
      }

      // If no profile exists, create one
      if (!existingProfile) {
        console.log('Creating unified profile for new user:', authUser.id);
        
        // Get default tier (Droplet)
        const { data: defaultTier } = await supabase
          .from('status_tiers')
          .select('id')
          .eq('tier_name', 'droplet')
          .single();

        const { error: insertError } = await supabase
          .from('unified_profiles')
          .insert({
            auth_user_id: authUser.id,
            email: authUser.email,
            display_name: authUser.user_metadata?.full_name || null,
            current_tier_id: defaultTier?.id || null,
            crescendo_data: {
              claims_balance: 0,
              available_nctr: 100, // Welcome bonus
              role: 'member'
            },
            garden_data: {},
            last_active_crescendo: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error creating unified profile:', insertError);
        } else {
          console.log('Unified profile created successfully');
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
