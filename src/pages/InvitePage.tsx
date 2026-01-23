import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, Copy, Check, Share2, Gift, Lock, Sparkles, ArrowLeft, 
  Trophy, Twitter, MessageCircle, Mail, Link2, TrendingUp, Target,
  ChevronRight, UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { NCTRLogo } from '@/components/NCTRLogo';
import { Skeleton } from '@/components/ui/skeleton';
import { useReferralSettings } from '@/hooks/useReferralSettings';
import { useReferralStats } from '@/hooks/useReferralStats';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

// Milestones for gamification
const MILESTONES = [
  { count: 1, reward: 'First Friend Bonus', bonus: 100, icon: '🎉' },
  { count: 3, reward: 'Social Butterfly', bonus: 250, icon: '🦋' },
  { count: 5, reward: 'Community Builder', bonus: 500, icon: '🏗️' },
  { count: 10, reward: 'Influencer Status', bonus: 1000, icon: '⭐' },
  { count: 25, reward: 'Ambassador Elite', bonus: 2500, icon: '👑' },
];

export default function InvitePage() {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { data: referralSettings } = useReferralSettings();
  const { data: stats, isLoading } = useReferralStats();
  const { profile } = useUnifiedUser();

  const crescendoData = profile?.crescendo_data || {};
  const referralCode = crescendoData.referral_code || 'LOADING';
  const allocation360Lock = referralSettings?.allocation360Lock ?? 500;
  
  // Use window.location.origin for dynamic domain
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://crescendo-nctr-live.lovable.app';
  const referralLink = `${baseUrl}/signup?ref=${referralCode}`;

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

  const handleShare = (platform: string) => {
    const text = `Join me on Crescendo and earn ${allocation360Lock} NCTR in 360LOCK! 🚀`;
    const url = referralLink;
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'discord':
        handleCopy(`${text} ${url}`);
        toast.success('Link copied! Paste it in Discord');
        return;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent('Join me on Crescendo!')}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
        break;
      default:
        handleCopy(url);
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  // Calculate milestone progress
  const totalReferrals = stats?.totalReferrals || 0;
  const currentMilestone = MILESTONES.find(m => totalReferrals < m.count) || MILESTONES[MILESTONES.length - 1];
  const prevMilestone = MILESTONES[MILESTONES.indexOf(currentMilestone) - 1];
  const progressToMilestone = prevMilestone 
    ? ((totalReferrals - prevMilestone.count) / (currentMilestone.count - prevMilestone.count)) * 100
    : (totalReferrals / currentMilestone.count) * 100;

  return (
    <SidebarProvider>
      <SEO 
        title="Invite Friends"
        description="Invite friends to Crescendo and earn NCTR rewards. Both you and your friend get 360LOCK bonuses!"
      />
      <div className="min-h-screen w-full flex bg-neutral-50 dark:bg-neutral-950">
        <AppSidebar />
        
        <div className="flex-1 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <SidebarTrigger className="md:hidden" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </div>

            {/* Hero Section */}
            <div className="relative mb-8 rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 text-primary-foreground">
              <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <UserPlus className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Invite Friends</h1>
                    <p className="text-white/80">Earn together, grow together</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-white/10 backdrop-blur rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-5 h-5 text-emerald-300" />
                      <span className="font-semibold">You Earn</span>
                    </div>
                    <div className="text-4xl font-bold flex items-center gap-2">
                      {allocation360Lock.toLocaleString()}
                      <NCTRLogo size="md" />
                    </div>
                    <p className="text-sm text-white/70 mt-1">in 360LOCK per referral</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-5 h-5 text-amber-300" />
                      <span className="font-semibold">Friend Gets</span>
                    </div>
                    <div className="text-4xl font-bold flex items-center gap-2">
                      {allocation360Lock.toLocaleString()}
                      <NCTRLogo size="md" />
                    </div>
                    <p className="text-sm text-white/70 mt-1">welcome bonus in 360LOCK</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Link Card */}
            <Card className="mb-6 border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-primary" />
                  Your Personal Invite Link
                </CardTitle>
                <CardDescription>
                  Share this link with friends to earn rewards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 px-4 py-3 text-sm bg-muted border rounded-lg font-mono"
                  />
                  <Button
                    onClick={() => handleCopy(referralLink)}
                    size="lg"
                    className="gap-2"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                
                {/* Quick Share Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handleShare('twitter')}
                    className="gap-2 flex-1 min-w-[140px]"
                  >
                    <Twitter className="w-4 h-4" />
                    Twitter / X
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleShare('discord')}
                    className="gap-2 flex-1 min-w-[140px]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Discord
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleShare('email')}
                    className="gap-2 flex-1 min-w-[140px]"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                  {isLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto" />
                  ) : (
                    <p className="text-3xl font-bold">{stats?.totalReferrals || 0}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Total Invited</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Check className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                  {isLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto" />
                  ) : (
                    <p className="text-3xl font-bold">{stats?.successfulReferrals || 0}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Successful</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Lock className="w-6 h-6 mx-auto mb-2 text-violet-500" />
                  {isLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto" />
                  ) : (
                    <p className="text-3xl font-bold flex items-center justify-center gap-1">
                      {stats?.totalEarned || 0}
                      <NCTRLogo size="sm" />
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">360LOCK Earned</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Trophy className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                  <p className="text-3xl font-bold">{currentMilestone?.icon}</p>
                  <p className="text-xs text-muted-foreground">Next Milestone</p>
                </CardContent>
              </Card>
            </div>

            {/* Milestone Progress */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Referral Milestones
                </CardTitle>
                <CardDescription>
                  Unlock bonus rewards as you invite more friends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>{totalReferrals} referrals</span>
                    <span className="font-medium">{currentMilestone?.count} for {currentMilestone?.reward}</span>
                  </div>
                  <Progress value={Math.min(progressToMilestone, 100)} className="h-3" />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {MILESTONES.map((milestone) => {
                    const achieved = totalReferrals >= milestone.count;
                    return (
                      <div 
                        key={milestone.count}
                        className={`p-3 rounded-lg text-center border-2 transition-all ${
                          achieved 
                            ? 'bg-primary/10 border-primary' 
                            : 'bg-muted/30 border-transparent'
                        }`}
                      >
                        <span className="text-2xl">{milestone.icon}</span>
                        <p className="text-xs font-medium mt-1">{milestone.count} friends</p>
                        <p className="text-[10px] text-muted-foreground">+{milestone.bonus} NCTR</p>
                        {achieved && (
                          <Badge variant="default" className="mt-1 text-[10px]">
                            <Check className="w-3 h-3 mr-1" />
                            Done
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl font-bold text-primary">1</span>
                    </div>
                    <h3 className="font-semibold mb-1">Share Your Link</h3>
                    <p className="text-sm text-muted-foreground">
                      Copy your unique referral link and share it with friends
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl font-bold text-primary">2</span>
                    </div>
                    <h3 className="font-semibold mb-1">Friend Joins</h3>
                    <p className="text-sm text-muted-foreground">
                      When they sign up using your link, they're connected to you
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl font-bold text-primary">3</span>
                    </div>
                    <h3 className="font-semibold mb-1">Both Earn</h3>
                    <p className="text-sm text-muted-foreground">
                      You and your friend each receive {allocation360Lock} NCTR in 360LOCK
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* View Analytics Link */}
            <div className="mt-6 text-center">
              <Button 
                variant="outline" 
                onClick={() => navigate('/referrals')}
                className="gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                View Detailed Analytics
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Bottom padding for mobile nav */}
            <div className="h-24 md:hidden" />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
