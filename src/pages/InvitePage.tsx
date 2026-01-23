import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Copy, Check, Gift, Lock, Sparkles, ArrowLeft, 
  Trophy, Link2, TrendingUp, ChevronRight, UserPlus, User, Wand2
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
import { SocialShareButtons } from '@/components/referral/SocialShareButtons';
import { MilestoneProgress } from '@/components/referral/MilestoneProgress';
import { SlugSetupCard } from '@/components/referral/SlugSetupCard';
import { useReferralSlug } from '@/hooks/useReferralSlug';
import { 
  generateReferralLink, 
  PRODUCTION_DOMAIN 
} from '@/lib/referral-links';

export default function InvitePage() {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [selectedLinkType, setSelectedLinkType] = useState<'standard' | 'personalized'>('standard');
  const navigate = useNavigate();
  const { data: referralSettings } = useReferralSettings();
  const { data: stats, isLoading } = useReferralStats();
  const { profile } = useUnifiedUser();
  const { currentSlug, isLoadingSlug } = useReferralSlug();

  const crescendoData = profile?.crescendo_data || {};
  const referralCode = crescendoData.referral_code || 'LOADING';
  const allocation360Lock = referralSettings?.allocation360Lock ?? 500;
  
  // Generate links - standard and personalized (with saved slug)
  const standardLink = generateReferralLink(referralCode);
  const personalizedLink = useMemo(() => {
    if (currentSlug) {
      return `${PRODUCTION_DOMAIN}/join/${currentSlug}`;
    }
    return null;
  }, [currentSlug]);
  
  // Get the active referral link based on selection
  const getActiveReferralLink = () => {
    if (selectedLinkType === 'personalized' && personalizedLink) {
      return personalizedLink;
    }
    return standardLink;
  };
  
  const referralLink = getActiveReferralLink();
  
  // Display link for social shares - prefer personalized if available
  const displayLink = personalizedLink || undefined;

  const handleCopy = async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(text);
      toast.success(label ? `${label} copied!` : 'Copied to clipboard!');
      setTimeout(() => setCopiedLink(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  // Calculate milestone progress
  const totalReferrals = stats?.totalReferrals || 0;

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

            {/* Personalized Link Setup Card - Show if no slug yet */}
            {!isLoadingSlug && !currentSlug && (
              <div className="mb-6">
                <SlugSetupCard 
                  onSlugSaved={(slug) => {
                    setSelectedLinkType('personalized');
                    toast.success('Your personalized link is now active!');
                  }} 
                />
              </div>
            )}

            {/* Referral Link Card */}
            <Card className="mb-6 border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-primary" />
                  Your Invite Link
                </CardTitle>
                <CardDescription>
                  Share your link to earn rewards. All links use <span className="font-mono text-xs">crescendo.nctr.live</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Link Type Tabs - Only show if user has personalized link */}
                {personalizedLink ? (
                  <Tabs value={selectedLinkType} onValueChange={(v) => setSelectedLinkType(v as typeof selectedLinkType)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="personalized" className="gap-1.5 text-xs sm:text-sm">
                        <Wand2 className="w-3.5 h-3.5" />
                        Personal Link
                      </TabsTrigger>
                      <TabsTrigger value="standard" className="gap-1.5 text-xs sm:text-sm">
                        <Link2 className="w-3.5 h-3.5" />
                        Standard Link
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="personalized" className="mt-4 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Your memorable personalized invite link
                      </p>
                      <div className="flex gap-2">
                        <Input
                          value={personalizedLink}
                          readOnly
                          className="flex-1 font-mono text-sm"
                        />
                        <Button
                          onClick={() => handleCopy(personalizedLink, 'Personal link')}
                          size="lg"
                          className="gap-2"
                        >
                          {copiedLink === personalizedLink ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                          {copiedLink === personalizedLink ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="standard" className="mt-4 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Your unique referral code link
                      </p>
                      <div className="flex gap-2">
                        <Input
                          value={standardLink}
                          readOnly
                          className="flex-1 font-mono text-sm"
                        />
                        <Button
                          onClick={() => handleCopy(standardLink, 'Standard link')}
                          size="lg"
                          className="gap-2"
                        >
                          {copiedLink === standardLink ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                          {copiedLink === standardLink ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  // No personalized link yet - just show standard
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Your unique referral code link
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={standardLink}
                        readOnly
                        className="flex-1 font-mono text-sm"
                      />
                      <Button
                        onClick={() => handleCopy(standardLink, 'Link')}
                        size="lg"
                        className="gap-2"
                      >
                        {copiedLink === standardLink ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        {copiedLink === standardLink ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Enhanced Social Share Buttons - Pass displayLink for cleaner social shares */}
                <SocialShareButtons 
                  referralLink={referralLink} 
                  allocation={allocation360Lock}
                  displayLink={displayLink}
                />
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
                  <p className="text-3xl font-bold">🎯</p>
                  <p className="text-xs text-muted-foreground">Next Milestone</p>
                </CardContent>
              </Card>
            </div>

            {/* Milestone Progress - Using new component */}
            <div className="mb-6">
              <MilestoneProgress currentReferrals={totalReferrals} />
            </div>

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
