import { useAccount, useSignMessage } from 'wagmi';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useWalletAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const authenticateWallet = async () => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet first');
      return { success: false };
    }

    try {
      // Create a message for the user to sign
      const message = `Sign this message to authenticate with Crescendo\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;
      
      // Request signature
      const signature = await signMessageAsync({ 
        message,
        account: address
      });

      // Check if user already exists with this wallet
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', address.toLowerCase())
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (existingProfile) {
        // User exists, get their auth user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && user.id === existingProfile.id) {
          toast.success('Wallet connected successfully! 🎉');
          return { success: true, isNewUser: false };
        }
      }

      // Check if current user has an account and needs to link wallet
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // User is logged in, link wallet to existing account
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ wallet_address: address.toLowerCase() })
          .eq('id', user.id);

        if (updateError) throw updateError;

        toast.success('Wallet linked to your account! 🎉');
        return { success: true, isNewUser: false };
      }

      // New user with wallet only - create account
      // For wallet-only users, we'll create a temporary email
      const walletEmail = `${address.toLowerCase()}@wallet.crescendo.app`;
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: walletEmail,
        password: signature, // Use signature as password
        options: {
          data: {
            full_name: `User ${address.slice(0, 6)}...${address.slice(-4)}`,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) throw signUpError;

      if (signUpData.user) {
        // Update profile with wallet address
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ wallet_address: address.toLowerCase() })
          .eq('id', signUpData.user.id);

        if (updateError) throw updateError;

        toast.success('Account created with wallet! Welcome to Crescendo! 🎉');
        return { success: true, isNewUser: true };
      }

      return { success: false };
    } catch (error: any) {
      console.error('Wallet auth error:', error);
      
      if (error.message?.includes('User rejected')) {
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
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_address: address.toLowerCase() })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Wallet linked successfully! 🎉');
      return true;
    } catch (error) {
      console.error('Link wallet error:', error);
      toast.error('Failed to link wallet');
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
