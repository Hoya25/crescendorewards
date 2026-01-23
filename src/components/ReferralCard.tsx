import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Users, Copy, Check, Share2, Gift, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { NCTRLogo } from './NCTRLogo';
import { Skeleton } from './ui/skeleton';
import { useReferralSettings } from '@/hooks/useReferralSettings';
import { generateReferralLink } from '@/lib/referral-links';

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  totalEarned: number;
  signupBonus: number;
  hasClaimedSignupBonus: boolean;
}

interface ReferralCardProps {
  stats: ReferralStats;
  referralCode: string;
  isLoading?: boolean;
}

export function ReferralCard({ stats, referralCode, isLoading }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const { data: referralSettings } = useReferralSettings();

  // Always use production domain for referral links
  const referralLink = generateReferralLink(referralCode);
  const allocation360Lock = referralSettings?.allocation360Lock ?? 500;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border-2 border-violet-200/50 dark:border-violet-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Referral Program
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 360LOCK Allocation CTA Banner */}
        <div className="bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 dark:from-emerald-900/40 dark:via-teal-900/40 dark:to-cyan-900/40 rounded-xl p-5 border-2 border-emerald-300 dark:border-emerald-700 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/50 to-transparent rounded-bl-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                  360LOCK Allocation
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">Per successful referral</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                {allocation360Lock.toLocaleString()}
                <NCTRLogo size="md" />
              </div>
            </div>
            <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-4">
              <strong>You AND your friend</strong> each receive {allocation360Lock.toLocaleString()} NCTR locked for 360 days. 
              Build your tier status faster by referring friends!
            </p>
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md" 
              onClick={() => handleCopy(referralLink)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share & Earn 360LOCK
            </Button>
          </div>
        </div>

        {/* Signup Bonus Banner */}
        {!stats.hasClaimedSignupBonus && (
          <div className="bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <div className="font-semibold text-amber-900 dark:text-amber-100">Welcome Bonus Available!</div>
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
              Claim your <span className="font-bold">{stats.signupBonus} NCTR</span> signup bonus
            </p>
            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
              Claim Now
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/80 dark:bg-gray-900/50 rounded-lg p-4 border border-violet-200/50 dark:border-violet-800/50">
            {isLoading ? (
              <Skeleton className="h-8 w-12 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{stats.totalReferrals}</div>
            )}
            <div className="text-xs text-muted-foreground">Total Referrals</div>
          </div>
          <div className="bg-white/80 dark:bg-gray-900/50 rounded-lg p-4 border border-violet-200/50 dark:border-violet-800/50">
            {isLoading ? (
              <Skeleton className="h-8 w-12 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{stats.successfulReferrals}</div>
            )}
            <div className="text-xs text-muted-foreground">Successful</div>
          </div>
          <div className="bg-white/80 dark:bg-gray-900/50 rounded-lg p-4 border border-violet-200/50 dark:border-violet-800/50">
            {isLoading ? (
              <Skeleton className="h-8 w-12 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{stats.totalEarned}</div>
            )}
            <div className="text-xs text-muted-foreground">NCTR Earned</div>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Your Referral Link</label>
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {allocation360Lock.toLocaleString()} <NCTRLogo size="xs" /> 360LOCK
            </Badge>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-violet-200 dark:border-violet-800 rounded-lg"
            />
            <Button
              onClick={() => handleCopy(referralLink)}
              variant="outline"
              size="icon"
              className="border-violet-200 dark:border-violet-800"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Info Text */}
        <p className="text-xs text-neutral-600 dark:text-neutral-400 text-center">
          Your friend gets {stats.signupBonus} NCTR welcome bonus + {allocation360Lock.toLocaleString()} NCTR 360LOCK. 
          You earn {allocation360Lock.toLocaleString()} NCTR 360LOCK when they join!
        </p>
      </CardContent>
    </Card>
  );
}

