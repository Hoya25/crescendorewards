import { Trophy, Lock, Users, Crown, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useReferralLeaderboard } from '@/hooks/useReferralLeaderboard';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatMonth(monthStr: string): string {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const idx = parseInt(month, 10) - 1;
  return `${MONTH_NAMES[idx] || month} ${year}`;
}

export default function LeaderboardPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { data, isLoading, toggleOptIn, isToggling } = useReferralLeaderboard();

  const top10 = data?.top_10 || [];
  const currentUser = data?.current_user;
  const isOptedIn = currentUser?.opted_in ?? false;
  const userInTop10 = top10.some((e) => e.is_current_user);
  const userRank = currentUser?.rank;

  const handleToggle = async (checked: boolean) => {
    if (!user) {
      toast.error('Sign in to join the leaderboard');
      return;
    }
    try {
      await toggleOptIn(checked);
      toast.success(checked ? 'You joined the leaderboard!' : 'You left the leaderboard');
    } catch {
      toast.error('Failed to update preference');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div
        className="rounded-xl p-5 sm:p-6"
        style={{ background: 'linear-gradient(135deg, hsl(240 10% 10%), hsl(240 10% 16%))' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="h-6 w-6" style={{ color: '#E2FF6D' }} />
              Referral Leaderboard
            </h1>
            <p className="text-sm text-white/60 max-w-md">
              Top recruiters this month — resets monthly
            </p>
            {data?.month && (
              <p className="text-xs text-white/40 mt-1">{formatMonth(data.month)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Bonus Banner */}
      <div
        className="rounded-lg p-4 flex items-center gap-3"
        style={{ backgroundColor: '#E2FF6D15', border: '1px solid #E2FF6D30' }}
      >
        <Crown className="h-5 w-5 shrink-0" style={{ color: '#E2FF6D' }} />
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Monthly Bonus</p>
          <p className="text-xs text-muted-foreground">
            Top 10 earn <span className="font-black" style={{ color: '#E2FF6D' }}>5,000 NCTR</span> (360LOCK) each month
          </p>
        </div>
        <Badge
          className="text-[10px] font-bold border-0 gap-1 px-2 py-0.5 shrink-0"
          style={{ backgroundColor: '#E2FF6D', color: '#1A1A2E' }}
        >
          <Lock className="h-3 w-3" /> 360LOCK
        </Badge>
      </div>

      {/* Opt-in Card */}
      {user && (
        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-foreground">Join Leaderboard</p>
              <p className="text-xs text-muted-foreground">
                {isOptedIn
                  ? 'Your display name is visible to other members on the leaderboard.'
                  : 'Your display name will be visible to other members. No personal info is shared.'}
              </p>
            </div>
            <Switch
              checked={isOptedIn}
              onCheckedChange={handleToggle}
              disabled={isToggling}
            />
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Table */}
      <Card className="border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="grid grid-cols-[40px_1fr_80px_100px] gap-2 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
            <span>Rank</span>
            <span>Member</span>
            <span className="text-center">Referrals</span>
            <span className="text-center">Purchases</span>
          </div>
        </div>

        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : top10.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Users className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No leaderboard entries yet this month.</p>
              <p className="text-xs text-muted-foreground/60">Be the first to refer and climb the ranks!</p>
            </div>
          ) : (
            top10.map((entry) => (
              <div
                key={entry.rank}
                className={`grid grid-cols-[40px_1fr_80px_100px] gap-2 items-center px-4 py-3 ${
                  entry.is_current_user
                    ? 'bg-[#E2FF6D]/10 border-l-2'
                    : ''
                }`}
                style={entry.is_current_user ? { borderLeftColor: '#E2FF6D' } : {}}
              >
                <span className={`text-sm font-black ${entry.rank <= 3 ? '' : 'text-muted-foreground'}`}
                  style={entry.rank <= 3 ? { color: '#E2FF6D' } : {}}
                >
                  {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                </span>
                <span className="text-sm font-medium text-foreground truncate">
                  {entry.handle ? `@${entry.handle}` : entry.display_name || 'Anonymous'}
                  {entry.is_current_user && (
                    <span className="text-[10px] ml-1.5 text-muted-foreground">(you)</span>
                  )}
                </span>
                <span className="text-sm text-center text-muted-foreground">{entry.referral_count}</span>
                <span className="text-sm text-center font-bold" style={{ color: '#E2FF6D' }}>
                  {entry.paid_referrals}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Current user row if not in top 10 */}
        {user && !userInTop10 && currentUser && (
          <div className="border-t-2 border-dashed border-border">
            {isOptedIn ? (
              <div
                className="grid grid-cols-[40px_1fr_80px_100px] gap-2 items-center px-4 py-3 bg-[#E2FF6D]/5 border-l-2"
                style={{ borderLeftColor: '#E2FF6D' }}
              >
                <span className="text-sm text-muted-foreground font-bold">
                  {userRank ? `#${userRank}` : '—'}
                </span>
                <span className="text-sm font-medium text-foreground truncate">
                  {currentUser.handle ? `@${currentUser.handle}` : currentUser.display_name || 'You'}{' '}
                  <span className="text-[10px] text-muted-foreground">(you)</span>
                </span>
                <span className="text-sm text-center text-muted-foreground">{currentUser.referral_count}</span>
                <span className="text-sm text-center font-bold" style={{ color: '#E2FF6D' }}>
                  {currentUser.paid_referrals}
                </span>
              </div>
            ) : (
              <div className="px-4 py-4 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  You're not on the leaderboard yet — opt in above to compete
                </p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* CTA to bounties */}
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => navigate('/bounties')}
      >
        <ArrowRight className="h-4 w-4" />
        Back to Bounty Board
      </Button>
    </div>
  );
}
