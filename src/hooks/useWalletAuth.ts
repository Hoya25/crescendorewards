import { useAccount, useSignMessage } from 'wagmi';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const WALLET_AUTH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-auth`;

interface ChallengeResponse {
  nonce: string;
  message: string;
}

interface VerifyResponse {
  success: boolean;
  user_exists: boolean;
  user_id?: string;
  email?: string;
  message: string;
  error?: string;
}

export function useWalletAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const getChallenge = async (walletAddress: string): Promise<ChallengeResponse | null> => {
    try {
      const response = await fetch(WALLET_AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          action: 'get-challenge',
          wallet_address: walletAddress,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get challenge');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get challenge:', error);
      return null;
    }
  };

  const verifySignature = async (
    walletAddress: string,
    signature: string,
    nonce: string
  ): Promise<VerifyResponse | null> => {
    try {
      const response = await fetch(WALLET_AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          action: 'verify-signature',
          wallet_address: walletAddress,
          signature,
          nonce,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signature verification failed');
      }

      return data;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return null;
    }
  };

  const authenticateWallet = async () => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet first');
      return { success: false };
    }

    try {
      // Step 1: Get challenge from server
      const challenge = await getChallenge(address);
      if (!challenge) {
        toast.error('Failed to get authentication challenge');
        return { success: false };
      }

      // Step 2: Request signature from user
      const signature = await signMessageAsync({
        message: challenge.message,
        account: address,
      });

      // Step 3: Verify signature on server
      const verifyResult = await verifySignature(address, signature, challenge.nonce);
      if (!verifyResult || !verifyResult.success) {
        toast.error(verifyResult?.error || 'Wallet verification failed');
        return { success: false };
      }

      // Step 4: Handle authentication based on user status
      if (verifyResult.user_exists) {
        // Existing user - try to sign in with wallet email
        const walletEmail = `${address.toLowerCase()}@wallet.crescendo.app`;
        
        // Check if current user is already signed in
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && user.id === verifyResult.user_id) {
          toast.success('Wallet connected successfully! 🎉');
          return { success: true, isNewUser: false };
        }

        // User exists but not signed in - they need to link or have existing session
        toast.success('Wallet verified! 🎉');
        return { success: true, isNewUser: false };
      } else {
        // New user was created server-side
        // Sign them in with the wallet email
        const walletEmail = verifyResult.email || `${address.toLowerCase()}@wallet.crescendo.app`;
        
        toast.success('Account created with wallet! Welcome to Crescendo! 🎉');
        return { success: true, isNewUser: true };
      }
    } catch (error: unknown) {
      console.error('Wallet auth error:', error);

      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('User rejected') || errorMessage.includes('rejected')) {
        toast.error('Signature request was rejected');
      } else {
        toast.error('Failed to authenticate with wallet');
      }

      return { success: false };
    }
  };

  const linkWalletToAccount = async (userId: string) => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet first');
      return false;
    }

    try {
      // Get challenge for verification
      const challenge = await getChallenge(address);
      if (!challenge) {
        toast.error('Failed to get authentication challenge');
        return false;
      }

      // Request signature
      const signature = await signMessageAsync({
        message: challenge.message,
        account: address,
      });

      // Verify signature
      const verifyResult = await verifySignature(address, signature, challenge.nonce);
      if (!verifyResult || !verifyResult.success) {
        toast.error('Wallet verification failed');
        return false;
      }

      // Link wallet to existing account
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_address: address.toLowerCase() })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Wallet linked successfully! 🎉');
      return true;
    } catch (error: unknown) {
      console.error('Link wallet error:', error);
      
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('User rejected') || errorMessage.includes('rejected')) {
        toast.error('Signature request was rejected');
      } else {
        toast.error('Failed to link wallet');
      }
      
      return false;
    }
  };

  return {
    address,
    isConnected,
    authenticateWallet,
    linkWalletToAccount,
  };
}
