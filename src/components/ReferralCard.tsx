import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Users, Copy, Check, Share2, Gift, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { NCTRLogo } from './NCTRLogo';

interface ReferralStats {
  totalReferrals: number;
  totalEarned: number;
  signupBonus: number;
  hasClaimedSignupBonus: boolean;
}

interface ReferralCardProps {
  stats: ReferralStats;
  referralCode: string;
}

export function ReferralCard({ stats, referralCode }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);

  const referralLink = `https://crescendo.app/signup?ref=${referralCode}`;

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
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/80 dark:bg-gray-900/50 rounded-lg p-4 border border-violet-200/50 dark:border-violet-800/50">
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{stats.totalReferrals}</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Referrals</div>
          </div>
          <div className="bg-white/80 dark:bg-gray-900/50 rounded-lg p-4 border border-violet-200/50 dark:border-violet-800/50">
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{stats.totalEarned}</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">NCTR Earned</div>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Your Referral Link</label>
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              500 <NCTRLogo className="inline-block h-3 w-auto" /> per referral
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

        {/* Share Button */}
        <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white" onClick={() => handleCopy(referralLink)}>
          <Share2 className="w-4 h-4 mr-2" />
          Share Your Link
        </Button>

        {/* Info Text */}
        <p className="text-xs text-neutral-600 dark:text-neutral-400 text-center">
          Your friend gets 100 NCTR welcome bonus. You both earn 500 NCTR when they join!
        </p>
      </CardContent>
    </Card>
  );
}
