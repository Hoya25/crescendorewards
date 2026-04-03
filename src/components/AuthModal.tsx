import { useState } from 'react';
import { Button } from './ui/button';
import { track } from '@/lib/track';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent } from './ui/dialog';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AuthModalProps {
  mode: 'signin' | 'signup';
  onClose: () => void;
  onSuccess: () => void;
  onToggleMode: () => void;
  prefilledEmail?: string | null;
}

export function AuthModal({ mode: _mode, onClose, onSuccess, onToggleMode: _onToggleMode, prefilledEmail }: AuthModalProps) {
  const [email, setEmail] = useState(prefilledEmail || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bhFound, setBhFound] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const isFromBH = !!prefilledEmail;

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) => password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Try signing in with existing Crescendo auth account
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (!signInError && data.user) {
        track('login_completed');
        toast.success('Welcome back! 👋');
        onSuccess();
        return;
      }

      // Step 2: Sign-in failed — check if they have a BH profile via verify-universal-auth
      if (signInError) {
        setStatusMessage('Checking your NCTR account...');

        try {
          const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/verify-universal-auth`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-sync-secret': 'pending-client-check',
              },
              body: JSON.stringify({
                email: email.trim(),
                bh_user_id: 'pending',
                display_name: 'pending',
              }),
            }
          );

          // If the edge function rejects (401 for wrong secret), fall back to 
          // checking unified_profiles directly via the anon client
          let profileExists = false;

          if (response.ok) {
            const result = await response.json();
            profileExists = result.exists === true;
          } else {
            // Fallback: check unified_profiles directly (anon read)
            const { data: directCheck } = await supabase
              .from('unified_profiles')
              .select('id, display_name')
              .eq('email', email.trim().toLowerCase())
              .maybeSingle();
            profileExists = !!directCheck;
          }

          if (profileExists) {
            // BH account found — create Crescendo auth account with their password
            setBhFound(true);
            setStatusMessage('Your NCTR account was found! Creating your Crescendo access...');

            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: email.trim(),
              password,
              options: {
                emailRedirectTo: `${window.location.origin}/`,
              },
            });

            if (signUpError) {
              if (signUpError.message.includes('already registered')) {
                setError('This email is already registered on Crescendo. Try a different password, or use password reset.');
              } else {
                setError(signUpError.message);
              }
              setStatusMessage('');
              return;
            }

            if (signUpData.user) {
              track('universal_auth_signup');
              toast.success('Welcome to Crescendo! Your NCTR account is linked. 🎉');
              onSuccess();
            }
          } else {
            // No account found anywhere
            setError('');
            setStatusMessage('');
            setBhFound(false);
            setError('No NCTR account found with this email. Join the Alliance on Bounty Hunter first!');
          }
        } catch (fetchErr) {
          console.error('Universal auth check failed:', fetchErr);
          // If fetch fails entirely, show the original sign-in error
          if (signInError.message.includes('Invalid login credentials')) {
            setError('Incorrect email or password. If you signed up on Bounty Hunter, make sure you\'re using the same email.');
          } else if (signInError.message.includes('Email not confirmed')) {
            setError('Please verify your email first. Check your inbox for a confirmation link.');
          } else {
            setError('Something went wrong. Please try again.');
          }
        }
      }
    } catch (err) {
      setError('Something unexpected happened. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[420px] p-0 border-0 overflow-hidden"
        style={{
          backgroundColor: '#1A1A1A',
          borderRadius: '0px',
        }}
      >
        <div className="px-8 pt-10 pb-8 flex flex-col items-center">
          {/* NCTR Logo */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: '36px',
                letterSpacing: '0.08em',
                color: '#E2FF6D',
                lineHeight: 1,
              }}
            >
              CRESCENDO
            </div>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                color: '#8A8A88',
                letterSpacing: '0.02em',
              }}
            >
              Your status. Your rewards.
            </p>
          </div>

          {/* BH Welcome Banner */}
          {isFromBH && !statusMessage && !bhFound && (
            <div
              className="w-full mb-4 p-3"
              style={{
                backgroundColor: 'rgba(226, 255, 109, 0.1)',
                border: '1px solid rgba(226, 255, 109, 0.25)',
              }}
            >
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#E2FF6D' }}>
                Welcome from Bounty Hunter — sign in with your BH password
              </p>
            </div>
          )}

          {statusMessage && (
            <div
              className="w-full mb-4 p-3 flex items-center gap-2"
              style={{
                backgroundColor: 'rgba(226, 255, 109, 0.08)',
                border: '1px solid rgba(226, 255, 109, 0.2)',
              }}
            >
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E2FF6D' }} />
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#E2FF6D' }}>
                {statusMessage}
              </p>
            </div>
          )}

          {/* BH Found Banner */}
          {bhFound && !statusMessage && (
            <div
              className="w-full mb-4 p-3"
              style={{
                backgroundColor: 'rgba(226, 255, 109, 0.08)',
                border: '1px solid rgba(226, 255, 109, 0.2)',
              }}
            >
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#E2FF6D' }}>
                ✓ NCTR account linked successfully
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              className="w-full mb-4 p-3 flex items-start gap-2"
              style={{
                backgroundColor: 'rgba(220, 38, 38, 0.08)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
              <div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#EF4444' }}>
                  {error}
                </p>
                {error.includes('Bounty Hunter') && (
                  <a
                    href="https://bountyhunter.nctr.live/auth"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '13px',
                      color: '#E2FF6D',
                      textDecoration: 'underline',
                      textUnderlineOffset: '2px',
                    }}
                  >
                    Go to Bounty Hunter <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#8A8A88', fontWeight: 500 }}
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your NCTR email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                style={{
                  backgroundColor: '#252525',
                  border: '1px solid #3A3A3A',
                  borderRadius: '0px',
                  color: '#FFFFFF',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px',
                }}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#8A8A88', fontWeight: 500 }}
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                style={{
                  backgroundColor: '#252525',
                  border: '1px solid #3A3A3A',
                  borderRadius: '0px',
                  color: '#FFFFFF',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px',
                }}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              style={{
                backgroundColor: '#E2FF6D',
                color: '#131313',
                borderRadius: '0px',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase' as const,
                height: '44px',
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in with your NCTR account'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="w-full my-6 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: '#3A3A3A' }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#5A5A58' }}>
              NEW TO NCTR?
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#3A3A3A' }} />
          </div>

          {/* Join on BH Link */}
          <a
            href="https://bountyhunter.nctr.live/auth"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 transition-colors"
            style={{
              border: '1px solid #3A3A3A',
              borderRadius: '0px',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              color: '#CCCCCC',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#E2FF6D';
              e.currentTarget.style.color = '#E2FF6D';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#3A3A3A';
              e.currentTarget.style.color = '#CCCCCC';
            }}
          >
            Don't have an account? Join on Bounty Hunter
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Footer */}
          <p
            className="mt-6 text-center"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '11px',
              color: '#5A5A58',
              lineHeight: 1.5,
            }}
          >
            Crescendo is part of the NCTR Alliance.
            <br />
            One account across all NCTR apps.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
