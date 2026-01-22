import { supabase } from "@/integrations/supabase/client";

export interface PortfolioData {
  nctr_balance?: number;
  nctr_360_locked?: number;
  nctr_90_locked?: number;
  nctr_unlocked?: number;
  locks?: Array<{
    amount: number;
    lock_type: '90' | '360';
    locked_at: string;
    unlocks_at: string;
  }>;
}

export interface SyncResult {
  success: boolean;
  tier_id?: string;
  error?: string;
}

/**
 * Syncs wallet portfolio data and automatically recalculates user tier.
 * Use this function from both The Garden and Crescendo for consistent behavior.
 * 
 * The database trigger `trigger_recalculate_tier` will automatically
 * update the user's status tier when nctr_360_locked changes.
 */
export async function syncWalletPortfolio(
  userId: string,
  walletAddress: string,
  portfolioData: PortfolioData,
  source: 'the_garden' | 'crescendo' | 'manual_sync' = 'crescendo'
): Promise<SyncResult> {
  try {
    const { error: upsertError } = await supabase
      .from('wallet_portfolio')
      .upsert({
        user_id: userId,
        wallet_address: walletAddress.toLowerCase(),
        nctr_balance: portfolioData.nctr_balance ?? 0,
        nctr_360_locked: portfolioData.nctr_360_locked ?? 0,
        nctr_90_locked: portfolioData.nctr_90_locked ?? 0,
        nctr_unlocked: portfolioData.nctr_unlocked ?? 0,
        locks: portfolioData.locks ?? [],
        last_synced_at: new Date().toISOString(),
        sync_source: source,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'wallet_address'
      });

    if (upsertError) {
      console.error('[Portfolio Sync] Upsert error:', upsertError);
      return { success: false, error: upsertError.message };
    }

    // The trigger handles tier recalculation, but we can also call it explicitly
    // for immediate feedback if needed
    const { data: tierId, error: tierError } = await supabase
      .rpc('calculate_user_tier', { p_user_id: userId });

    if (tierError) {
      console.warn('[Portfolio Sync] Tier calculation warning:', tierError);
      // Don't fail the sync if tier calculation has issues
    }

    console.log(`[Portfolio Sync] Successfully synced portfolio for user ${userId} from ${source}`);
    
    return { 
      success: true, 
      tier_id: tierId ?? undefined 
    };
  } catch (error) {
    console.error('[Portfolio Sync] Unexpected error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Links a wallet address to a user's unified profile.
 * Call this when a user connects a new wallet.
 */
export async function linkWalletToProfile(
  userId: string,
  walletAddress: string
): Promise<SyncResult> {
  try {
    const { error } = await supabase
      .from('unified_profiles')
      .update({ 
        wallet_address: walletAddress.toLowerCase(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('[Portfolio Sync] Link wallet error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Portfolio Sync] Linked wallet ${walletAddress} to user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('[Portfolio Sync] Unexpected error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Fetches the current portfolio data for a user.
 */
export async function getPortfolioData(userId: string) {
  const { data, error } = await supabase
    .from('wallet_portfolio')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('[Portfolio Sync] Fetch error:', error);
    return null;
  }

  return data;
}

/**
 * Calculates totals across all wallets for a user.
 */
export function calculatePortfolioTotals(portfolios: Array<{
  nctr_balance?: number | null;
  nctr_360_locked?: number | null;
  nctr_90_locked?: number | null;
  nctr_unlocked?: number | null;
}>) {
  return portfolios.reduce((acc, p) => ({
    total_balance: acc.total_balance + (p.nctr_balance ?? 0),
    total_360_locked: acc.total_360_locked + (p.nctr_360_locked ?? 0),
    total_90_locked: acc.total_90_locked + (p.nctr_90_locked ?? 0),
    total_unlocked: acc.total_unlocked + (p.nctr_unlocked ?? 0)
  }), {
    total_balance: 0,
    total_360_locked: 0,
    total_90_locked: 0,
    total_unlocked: 0
  });
}
