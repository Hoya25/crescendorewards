import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Mail, AlertCircle, Wallet, CheckCircle2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { z } from 'zod';

interface WalletProfileCompletionModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  userId: string;
  walletAddress: string;
}

const profileSchema = z.object({
  firstName: z.string()
    .trim()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z.string()
    .trim()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  email: z.string()
    .trim()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
});

const MERGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/merge-wallet-user`;

export function WalletProfileCompletionModal({
  open,
  onClose,
  onComplete,
  userId,
  walletAddress,
}: WalletProfileCompletionModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; email?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate input
    const result = profileSchema.safeParse({ firstName, lastName, email });
    if (!result.success) {
      const fieldErrors: { firstName?: string; lastName?: string; email?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'firstName') fieldErrors.firstName = err.message;
        if (err.path[0] === 'lastName') fieldErrors.lastName = err.message;
        if (err.path[0] === 'email') fieldErrors.email = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      // Get auth session for authenticated request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Your session expired. Please sign in again to continue.');
      }

      // Call the merge-wallet-user edge function to handle merging or updating
      const response = await fetch(MERGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          wallet_user_id: userId,
          target_email: result.data.email,
          wallet_address: walletAddress,
          first_name: result.data.firstName,
          last_name: result.data.lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again or contact support.');
      }

      if (data.merged) {
        toast.success('Wallet linked to your existing account! 🎉');
        // User was merged - they should sign out and sign back in with their email
        await supabase.auth.signOut();
        toast.info('Please sign in with your email to continue.');
      } else {
        toast.success('Profile updated successfully!');
      }
      
      onComplete();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const truncatedWallet = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            Add your name and email to unlock all features and receive reward notifications.
          </DialogDescription>
        </DialogHeader>

        <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors -mt-2 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

        <div className="space-y-4">
          {/* Wallet Connected Badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <Wallet className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{truncatedWallet}</span>
            <span className="text-xs text-muted-foreground">connected</span>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your name and email are required to claim rewards and receive important updates.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                  className={errors.firstName ? 'border-destructive' : ''}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="flex items-center gap-2">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                  className={errors.lastName ? 'border-destructive' : ''}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                Skip for now
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
