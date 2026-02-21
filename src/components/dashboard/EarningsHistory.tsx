import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Gift, ShoppingBag, Users, CheckCircle2, Zap, Sparkles,
  ChevronRight, TrendingUp, Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { formatDistanceToNow } from 'date-fns';

const PAGE_SIZE = 10;

interface NctrTransaction {
  id: string;
  created_at: string;
  source: string;
  final_amount: number;
  notes: string | null;
  tier_at_time: string | null;
}

const SOURCE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  signup_bonus: { icon: Gift, label: 'Welcome Bonus', color: 'text-pink-400' },
  shopping: { icon: ShoppingBag, label: 'Shopping Earn', color: 'text-emerald-400' },
  referral: { icon: Users, label: 'Referral Reward', color: 'text-blue-400' },
  profile_completion: { icon: CheckCircle2, label: 'Profile Bonus', color: 'text-green-400' },
  bounty: { icon: Zap, label: 'Bounty Reward', color: 'text-amber-400' },
};

function getSourceConfig(source: string) {
  return SOURCE_CONFIG[source] ?? { icon: Sparkles, label: 'NCTR Earned', color: 'text-violet-400' };
}

const TIER_COLORS: Record<string, string> = {
  bronze: 'bg-orange-800/40 text-orange-300',
  silver: 'bg-gray-600/40 text-gray-300',
  gold: 'bg-yellow-700/40 text-yellow-300',
  platinum: 'bg-cyan-800/40 text-cyan-300',
  diamond: 'bg-indigo-800/40 text-indigo-300',
};

export function EarningsHistory({ className = '' }: { className?: string }) {
  const navigate = useNavigate();
  const { profile } = useUnifiedUser();
  const [transactions, setTransactions] = useState<NctrTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalEarned, setTotalEarned] = useState(0);

  const fetchTransactions = useCallback(async (offset = 0, append = false) => {
    if (!profile?.id) return;

    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const { data, error } = await supabase
        .from('nctr_transactions')
        .select('id, created_at, source, final_amount, notes, tier_at_time')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      const rows = (data ?? []) as NctrTransaction[];
      setTransactions((prev) => (append ? [...prev, ...rows] : rows));
      setHasMore(rows.length === PAGE_SIZE);

      // Fetch total earned (only on first load)
      if (offset === 0) {
        const { data: sumData } = await supabase
          .from('nctr_transactions')
          .select('final_amount')
          .eq('user_id', profile.id);

        if (sumData) {
          const sum = sumData.reduce((acc: number, r: any) => acc + (r.final_amount ?? 0), 0);
          setTotalEarned(sum);
        }
      }
    } catch (err) {
      console.error('Error fetching NCTR transactions:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleLoadMore = () => {
    fetchTransactions(transactions.length, true);
  };

  // Loading skeleton
  if (loading) {
    return (
      <Card className={`bg-[#323232] border-[#5A5A58] ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-white">
            <TrendingUp className="w-4 h-4" />
            NCTR Earnings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0 bg-[#5A5A58]" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-full bg-[#5A5A58]" />
                <Skeleton className="h-3 w-20 bg-[#5A5A58]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (transactions.length === 0) {
    return (
      <Card className={`bg-[#323232] border-[#5A5A58] ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-white">
            <TrendingUp className="w-4 h-4" />
            NCTR Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-400">
            <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No earnings yet — start shopping in The Garden to earn your first NCTR</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 gap-1 border-[#5A5A58] text-gray-300 hover:text-white"
              onClick={() => navigate('/brands')}
            >
              Browse Brands <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-[#323232] border-[#5A5A58] ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-white">
              <TrendingUp className="w-4 h-4" />
              NCTR Earnings
            </CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">Your earning history</p>
          </div>
          <span className="text-sm font-bold" style={{ color: '#E2FF6D' }}>
            {totalEarned.toLocaleString()} NCTR
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-auto max-h-[400px]">
          <div className="px-6 pb-4">
            {transactions.map((tx, index) => {
              const config = getSourceConfig(tx.source);
              const Icon = config.icon;
              const tierKey = tx.tier_at_time?.toLowerCase();
              const tierClass = tierKey ? TIER_COLORS[tierKey] : null;

              return (
                <div key={tx.id}>
                  <div className="w-full flex items-start gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-white/5 transition-colors group">
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-full bg-[#5A5A58] flex items-center justify-center flex-shrink-0 ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Label + notes */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-white leading-snug">{config.label}</p>
                        {tierClass && (
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border-0 ${tierClass}`}>
                            {tx.tier_at_time}
                          </Badge>
                        )}
                      </div>
                      {tx.notes && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{tx.notes}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                      </p>
                    </div>

                    {/* Amount */}
                    <span className="text-sm font-semibold flex-shrink-0 mt-0.5" style={{ color: '#E2FF6D' }}>
                      +{tx.final_amount.toLocaleString()} NCTR
                    </span>
                  </div>
                  {index < transactions.length - 1 && (
                    <div className="border-b border-white/5 mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Load More */}
        {hasMore && (
          <div className="px-6 pb-4 pt-2 border-t border-white/5">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-gray-400 hover:text-white"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Loading…
                </>
              ) : (
                <>
                  Load More <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
