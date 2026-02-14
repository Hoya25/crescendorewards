import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Sparkles, Wallet, Gift, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { NCTRLogo } from './NCTRLogo';
import { Separator } from './ui/separator';

interface AuthModalProps {
  mode: 'signin' | 'signup';
  onClose: () => void;
  onSuccess: () => void;
  onToggleMode: () => void;
}

export function AuthModal({ mode, onClose, onSuccess, onToggleMode }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { authenticateWallet, isConnected } = useWalletAuth();
  const [walletLoading, setWalletLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const validateName = (name: string) => {
    return name.trim().length >= 1 && name.trim().length <= 50;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (mode === 'signup') {
      if (!validateName(firstName)) {
        setError('Please enter your first name');
        return;
      }
      if (!validateName(lastName)) {
        setError('Please enter your last name');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        
        // Get referral code from sessionStorage (set by InviteLandingPage) or URL params
        const storedReferralCode = sessionStorage.getItem('referral_code');
        const storedLinkType = sessionStorage.getItem('referral_link_type') || 'standard';
        const urlParams = new URLSearchParams(window.location.search);
        const urlReferralCode = urlParams.get('ref');
        const referralCode = storedReferralCode || urlReferralCode;
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              referred_by_code: referralCode || undefined,
              referral_link_type: referralCode ? storedLinkType : undefined,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('This email is already registered. Please sign in instead.');
          } else {
            setError(signUpError.message);
          }
          return;
        }

        if (data.user) {
          // Clear referral data from session storage after successful signup
          sessionStorage.removeItem('referral_code');
          sessionStorage.removeItem('referral_link_type');
          
          toast.success('Account created successfully! Welcome to Crescendo! 🎉');
          onSuccess();
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.');
          } else {
            setError(signInError.message);
          }
          return;
        }

        if (data.user) {
          toast.success('Welcome back! 👋');
          onSuccess();
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletAuth = async () => {
    if (!isConnected) {
      toast.error('Please select a wallet using the button below');
      return;
    }

    setWalletLoading(true);
    try {
      const result = await authenticateWallet();
      if (result.success) {
        onSuccess();
      }
    } finally {
      setWalletLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            {mode === 'signin' ? 'Welcome Back' : 'Join Crescendo'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {mode === 'signin' ? 'Sign in to your account' : 'Create an account to unlock exclusive rewards'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Signup Bonus Banner */}
          {mode === 'signup' && (
            <div className="bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-1">
                    Welcome Bonus: 100 <NCTRLogo size="sm" />
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">Plus earn rewards on signup!</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Email & Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={mode === 'signup' ? 'Create a password (min 6 characters)' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>{mode === 'signin' ? 'Sign In' : 'Create Account'}</>
              )}
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="text-center">
            <button
              type="button"
              onClick={onToggleMode}
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              disabled={loading}
            >
              {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          {/* Wallet Connect Section */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openConnectModal,
                  mounted,
                }) => {
                  const ready = mounted;
                  const connected = ready && account && chain;

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        style: {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {!connected ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={openConnectModal}
                        >
                          <Wallet className="mr-2 h-4 w-4" />
                          Continue with Wallet
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="default"
                          className="w-full"
                          onClick={handleWalletAuth}
                          disabled={walletLoading}
                        >
                          {walletLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Wallet className="mr-2 h-4 w-4" />
                          )}
                          {mode === 'signin' ? 'Sign in' : 'Sign up'} with Wallet
                        </Button>
                      )}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
