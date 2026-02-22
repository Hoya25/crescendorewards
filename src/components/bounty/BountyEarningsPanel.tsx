import { ShoppingBag, Users, Flame, Target, Shirt, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBountyEarningsHistory, type EarningsEntry } from '@/hooks/useBountyEarningsHistory';
import { formatDistanceToNow } from 'date-fns';

const SOURCE_ICONS: Record<string, { icon: React.ElementType; emoji: string }> = {
  bounty: { icon: Target, emoji: '🎯' },
  purchase: { icon: ShoppingBag, emoji: '🛍️' },
  merch: { icon: Shirt, emoji: '👕' },
  referral: { icon: Users, emoji: '👥' },
  signup_bonus: { icon: Sparkles, emoji: '🎁' },
  shopping: { icon: ShoppingBag, emoji: '🛍️' },
  profile_completion: { icon: Sparkles, emoji: '✅' },
};

function getSourceDisplay(source: string) {
  return SOURCE_ICONS[source] ?? { icon: Sparkles, emoji: '✨' };
}

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-green-500/20 text-green-400',
  pending: 'bg-amber-500/20 text-amber-400',
  rejected: 'bg-red-500/20 text-red-400',
};

export function BountyEarningsPanel({ open }: { open: boolean }) {
  const { data: entries, isLoading } = useBountyEarningsHistory(open);

  if (!open) return null;

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300 ease-out"
      style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(226,255,109,0.15)' }}
    >
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-sm font-bold text-white">Earnings History</h3>
        <span className="text-[10px] text-white/40 uppercase tracking-wider">All Sources</span>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full bg-white/5" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-3/4 bg-white/5" />
                <Skeleton className="h-2 w-1/2 bg-white/5" />
              </div>
              <Skeleton className="h-4 w-16 bg-white/5" />
            </div>
          ))}
        </div>
      ) : !entries || entries.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm text-white/40">No earnings yet. Complete a bounty to get started!</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[320px]">
          <div className="p-2">
            {entries.map((entry: EarningsEntry) => {
              const display = getSourceDisplay(entry.source);
              const statusClass = STATUS_STYLES[entry.status] ?? STATUS_STYLES.approved;

              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="text-base w-8 text-center">{display.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium truncate">{entry.title}</p>
                    <p className="text-[10px] text-white/30">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {entry.status !== 'approved' && (
                      <Badge className={`text-[9px] font-bold border-0 px-1.5 py-0 h-4 ${statusClass}`}>
                        {entry.status}
                      </Badge>
                    )}
                    <span className="text-xs font-bold" style={{ color: '#E2FF6D' }}>
                      +{Number(entry.amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
