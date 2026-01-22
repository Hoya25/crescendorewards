import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  syncWalletPortfolio, 
  linkWalletToProfile, 
  getPortfolioData,
  calculatePortfolioTotals,
  PortfolioData 
} from "@/lib/portfolio-sync";

interface UsePortfolioSyncOptions {
  userId: string | undefined;
  onSyncSuccess?: () => void;
  onSyncError?: (error: string) => void;
}

export function usePortfolioSync({ userId, onSyncSuccess, onSyncError }: UsePortfolioSyncOptions) {
  const queryClient = useQueryClient();

  // Query for fetching current portfolio data
  const portfolioQuery = useQuery({
    queryKey: ['wallet-portfolio', userId],
    queryFn: async () => {
      if (!userId) return null;
      return getPortfolioData(userId);
    },
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
  });

  // Calculate totals from portfolio data
  const totals = portfolioQuery.data 
    ? calculatePortfolioTotals(portfolioQuery.data)
    : { total_balance: 0, total_360_locked: 0, total_90_locked: 0, total_unlocked: 0 };

  // Mutation for syncing portfolio with optimistic updates
  const syncMutation = useMutation({
    mutationFn: async ({ 
      walletAddress, 
      portfolioData, 
      source = 'crescendo' 
    }: { 
      walletAddress: string; 
      portfolioData: PortfolioData;
      source?: 'the_garden' | 'crescendo' | 'manual_sync';
    }) => {
      if (!userId) throw new Error('User ID required');
      return syncWalletPortfolio(userId, walletAddress, portfolioData, source);
    },
    
    // Optimistic update - immediately update the UI
    onMutate: async ({ walletAddress, portfolioData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['wallet-portfolio', userId] });
      await queryClient.cancelQueries({ queryKey: ['unified-user'] });

      // Snapshot current data for rollback
      const previousPortfolio = queryClient.getQueryData(['wallet-portfolio', userId]);
      const previousUser = queryClient.getQueryData(['unified-user']);

      // Optimistically update portfolio
      queryClient.setQueryData(['wallet-portfolio', userId], (old: any[] | null) => {
        if (!old) return [{ 
          wallet_address: walletAddress, 
          ...portfolioData,
          user_id: userId,
          last_synced_at: new Date().toISOString()
        }];
        
        const existingIndex = old.findIndex(p => p.wallet_address?.toLowerCase() === walletAddress.toLowerCase());
        if (existingIndex >= 0) {
          const updated = [...old];
          updated[existingIndex] = { 
            ...updated[existingIndex], 
            ...portfolioData,
            last_synced_at: new Date().toISOString()
          };
          return updated;
        }
        return [...old, { 
          wallet_address: walletAddress, 
          ...portfolioData,
          user_id: userId,
          last_synced_at: new Date().toISOString()
        }];
      });

      return { previousPortfolio, previousUser };
    },

    // Rollback on error
    onError: (error, variables, context) => {
      if (context?.previousPortfolio) {
        queryClient.setQueryData(['wallet-portfolio', userId], context.previousPortfolio);
      }
      if (context?.previousUser) {
        queryClient.setQueryData(['unified-user'], context.previousUser);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      toast.error('Portfolio sync failed', { description: errorMessage });
      onSyncError?.(errorMessage);
    },

    // Refetch on success to ensure consistency
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Portfolio synced', { description: 'Your balances are up to date' });
        onSyncSuccess?.();
        
        // Invalidate related queries to refetch fresh data
        queryClient.invalidateQueries({ queryKey: ['wallet-portfolio', userId] });
        queryClient.invalidateQueries({ queryKey: ['unified-user'] });
      } else {
        toast.error('Sync issue', { description: result.error });
        onSyncError?.(result.error || 'Unknown error');
      }
    },
  });

  // Mutation for linking wallet
  const linkWalletMutation = useMutation({
    mutationFn: async (walletAddress: string) => {
      if (!userId) throw new Error('User ID required');
      return linkWalletToProfile(userId, walletAddress);
    },

    onMutate: async (walletAddress) => {
      await queryClient.cancelQueries({ queryKey: ['unified-user'] });
      const previousUser = queryClient.getQueryData(['unified-user']);

      // Optimistically update wallet address
      queryClient.setQueryData(['unified-user'], (old: any) => {
        if (!old) return old;
        return { ...old, wallet_address: walletAddress };
      });

      return { previousUser };
    },

    onError: (error, variables, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(['unified-user'], context.previousUser);
      }
      toast.error('Failed to link wallet');
    },

    onSuccess: (result) => {
      if (result.success) {
        toast.success('Wallet linked successfully');
        queryClient.invalidateQueries({ queryKey: ['unified-user'] });
      } else {
        toast.error('Link failed', { description: result.error });
      }
    },
  });

  return {
    // Portfolio data
    portfolio: portfolioQuery.data,
    totals,
    isLoading: portfolioQuery.isLoading,
    isError: portfolioQuery.isError,
    refetch: portfolioQuery.refetch,

    // Sync mutation
    syncPortfolio: syncMutation.mutate,
    syncPortfolioAsync: syncMutation.mutateAsync,
    isSyncing: syncMutation.isPending,

    // Link wallet mutation
    linkWallet: linkWalletMutation.mutate,
    linkWalletAsync: linkWalletMutation.mutateAsync,
    isLinking: linkWalletMutation.isPending,
  };
}
