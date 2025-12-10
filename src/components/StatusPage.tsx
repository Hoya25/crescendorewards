import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Zap, Gift, Tag, Check, Lock, ShoppingCart, Sparkles, Ticket, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NCTRLogo } from './NCTRLogo';

interface StatusPageProps {
  onBack: () => void;
}

interface StatusTier {
  level: number;
  name: string;
  requirement: number;
  description: string;
  multiplier: number;
  claims: string;
  discount: number;
  benefits: string[];
  nftBadges: string[];
  color: string;
  bgColor: string;
}

const statusTiers: StatusTier[] = [
  {
    level: 1,
    name: 'Bronze',
    requirement: 1000,
    description: 'Unlock your first tier with enhanced earning potential',
    multiplier: 1.1,
    claims: '1 annual claim',
    discount: 5,
    benefits: [
      'Access to bronze reward catalog',
      '1 reward claim per year',
      'Priority customer support',
      'Earn 1.1x NCTR on all activities',
      '5% discount on partner brands'
    ],
    nftBadges: ['Digital Rewards Access', 'Event Access'],
    color: 'hsl(142 76% 36%)',
    bgColor: 'hsl(142 76% 96%)'
  },
  {
    level: 2,
    name: 'Silver',
    requirement: 2500,
    description: 'Unlock enhanced benefits with quarterly claim privileges',
    multiplier: 1.25,
    claims: '4 annual claims',
    discount: 10,
    benefits: [
      'Access to premium reward catalog',
      '4 reward claims per year',
      'Early access to new rewards',
      'Earn 1.25x NCTR on all activities',
      '10% discount on partner brands'
    ],
    nftBadges: ['Digital Rewards Access', 'Event Access'],
    color: 'hsl(199 89% 48%)',
    bgColor: 'hsl(199 89% 96%)'
  },
  {
    level: 3,
    name: 'Gold',
    requirement: 5000,
    description: 'Experience elite status with monthly claims and exclusive perks',
    multiplier: 1.4,
    claims: '1 monthly claim',
    discount: 15,
    benefits: [
      'Access to exclusive reward catalog',
      '1 reward claim per month',
      'VIP event invitations',
      'Earn 1.4x NCTR on all activities',
      '15% discount on partner brands',
      'Dedicated account manager',
      'Buy\'r Premium membership'
    ],
    nftBadges: ['Digital Rewards Access', 'Event Access', 'VIP Experiences'],
    color: 'hsl(271 91% 65%)',
    bgColor: 'hsl(271 91% 96%)'
  },
  {
    level: 4,
    name: 'Platinum',
    requirement: 10000,
    description: 'Reach platinum status with bi-monthly claims and premium benefits',
    multiplier: 1.6,
    claims: '2 monthly claims',
    discount: 20,
    benefits: [
      'Access to platinum reward catalog',
      '2 reward claims per month',
      'Exclusive platinum events',
      'Earn 1.6x NCTR on all activities',
      '20% discount on partner brands',
      'Personal concierge service',
      'Priority shipping',
      'Buy\'r Premium membership'
    ],
    nftBadges: ['Digital Rewards Access', 'Event Access', 'VIP Experiences', 'Platinum Concierge'],
    color: 'hsl(43 96% 56%)',
    bgColor: 'hsl(43 96% 96%)'
  },
  {
    level: 5,
    name: 'Diamond',
    requirement: 25000,
    description: 'Ultimate status with unlimited benefits and white-glove service',
    multiplier: 2.0,
    claims: 'Unlimited',
    discount: 25,
    benefits: [
      'Access to diamond reward catalog',
      'Unlimited reward claims',
      'Exclusive diamond experiences',
      'Earn 2x NCTR on all activities',
      '25% discount on partner brands',
      'White-glove concierge service',
      'Free expedited shipping',
      'Early access to all new features',
      'Buy\'r Premium membership'
    ],
    nftBadges: ['Digital Rewards Access', 'Event Access', 'VIP Experiences', 'Diamond Elite'],
    color: 'hsl(180 100% 50%)',
    bgColor: 'hsl(180 100% 96%)'
  }
];

export function StatusPage({ onBack }: StatusPageProps) {
  const { profile } = useAuth();
  
  const currentLevel = profile?.level || 0;
  const lockedNCTR = profile?.locked_nctr || 0;
  
  const currentTier = statusTiers.find(t => t.level === currentLevel) || statusTiers[0];
  const nextTier = statusTiers.find(t => t.level === currentLevel + 1);
  
  const progressToNext = nextTier 
    ? Math.min((lockedNCTR / nextTier.requirement) * 100, 100)
    : 100;
  const remainingNCTR = nextTier ? Math.max(nextTier.requirement - lockedNCTR, 0) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
              <Trophy className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Status Levels & Benefits</h1>
              <p className="text-muted-foreground">Build your status, unlock greater rewards</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Current Status Card */}
        <Card className="border-2" style={{ borderColor: currentTier.color }}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div 
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold text-white"
                  style={{ backgroundColor: currentTier.color }}
                >
                  {currentTier.level}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Your Current Status</p>
                  <h2 className="text-4xl font-bold mb-2">{currentTier.name}</h2>
                  <p className="text-muted-foreground flex items-center gap-1">
                    {lockedNCTR.toLocaleString()} <NCTRLogo size="xs" /> locked in 360LOCK
                  </p>
                </div>
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 md:ml-auto">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Multiplier</p>
                    <p className="text-2xl font-bold">{currentTier.multiplier}x</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Claims</p>
                    <p className="text-xl font-bold">{currentTier.claims}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Tag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Discount</p>
                    <p className="text-2xl font-bold">{currentTier.discount}%</p>
                  </div>
                </div>
              </div>
            </div>

            {nextTier && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Progress to {nextTier.name}</span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    {remainingNCTR.toLocaleString()} <NCTRLogo size="xs" /> to go
                  </span>
                </div>
                <Progress value={progressToNext} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">{lockedNCTR.toLocaleString()} <NCTRLogo size="xs" /></span>
                  <span className="flex items-center gap-1">{nextTier.requirement.toLocaleString()} <NCTRLogo size="xs" /></span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Roadmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Your Status Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 overflow-x-auto pb-4">
              {statusTiers.map((tier, index) => {
                const isCompleted = currentLevel > tier.level;
                const isCurrent = currentLevel === tier.level;
                const isLocked = currentLevel < tier.level;
                
                return (
                  <div key={tier.level} className="flex items-center">
                    <div className="flex flex-col items-center gap-2 min-w-[120px]">
                      <div className="relative">
                        <div 
                          className={cn(
                            "w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold transition-all",
                            isCompleted && "opacity-100",
                            isCurrent && "opacity-100 ring-2 ring-offset-2",
                            isLocked && "opacity-40"
                          )}
                          style={{ 
                            backgroundColor: isLocked ? 'hsl(var(--muted))' : tier.color,
                            color: 'white'
                          }}
                        >
                          {isCompleted ? <Check className="w-8 h-8" /> : tier.level}
                        </div>
                        {isCurrent && (
                          <div 
                            className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: tier.color, color: 'white' }}
                          >
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{tier.name}</p>
                        <p className="text-xs text-muted-foreground">{tier.requirement.toLocaleString()} NCTR</p>
                      </div>
                    </div>
                    {index < statusTiers.length - 1 && (
                      <div className="w-12 h-0.5 bg-border mx-2 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* How Status Levels Work */}
        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              How Status Levels Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1 flex items-center gap-1">
                    Earn <NCTRLogo size="sm" /> Tokens
                  </h3>
                  <p className="text-sm text-muted-foreground">Complete activities, refer friends, and engage with partner brands</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Commit to 360LOCK</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
                    Lock your <NCTRLogo size="xs" /> for 360 days to build your member status level
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Unlock Benefits</h3>
                  <p className="text-sm text-muted-foreground">Each level brings multipliers, monthly claims, and exclusive perks</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Individual Tier Details */}
        {statusTiers.map((tier) => {
          const isCurrent = currentLevel === tier.level;
          const isUnlocked = currentLevel >= tier.level;
          const canUpgrade = currentLevel === tier.level - 1;
          
          return (
            <Card 
              key={tier.level} 
              className={cn(
                "transition-all",
                isCurrent && "border-2"
              )}
              style={isCurrent ? { borderColor: tier.color } : {}}
            >
              <CardContent className="p-6 space-y-6">
                {/* Tier Header */}
                <div className="flex items-center gap-4">
                  <div 
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white"
                    style={{ backgroundColor: tier.color }}
                  >
                    {tier.level}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-3xl font-bold">{tier.name}</h3>
                      {isCurrent && (
                        <Badge className="bg-primary">Your Level</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{tier.description}</p>
                  </div>
                </div>

                {/* Commitment Requirements */}
                <div 
                  className="rounded-lg p-4"
                  style={{ backgroundColor: tier.bgColor }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4" />
                    <h4 className="font-semibold">Commitment Requirements</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">360LOCK (360 days)</p>
                  <p className="text-3xl font-bold">{tier.requirement.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">NCTR minimum</p>
                </div>

                {/* Key Benefits Overview */}
                <div>
                  <h4 className="font-semibold mb-4">Key Benefits Overview</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                          <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">Earnings Multiplier</p>
                        <p className="text-2xl font-bold mb-1">{tier.multiplier}x</p>
                        <p className="text-xs text-muted-foreground">+{((tier.multiplier - 1) * 100)}% boost on all earnings</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                          <Gift className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">Reward Claims</p>
                        <p className="text-xl font-bold mb-1">{tier.claims}</p>
                        <p className="text-xs text-muted-foreground">
                          {tier.level === 5 ? 'No limits' : `Claim up to ${tier.claims.split(' ')[0]}/year`}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                          <Tag className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          Brand Discount 
                          <span className="w-3 h-3 rounded-full bg-muted flex items-center justify-center text-[8px]">i</span>
                        </p>
                        <p className="text-2xl font-bold mb-1">{tier.discount}%</p>
                        <p className="text-xs text-muted-foreground">Off all partner brands</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Complete Benefits Package */}
                <div>
                  <h4 className="font-semibold mb-4">Complete Benefits Package</h4>
                  <Card>
                    <CardContent className="p-4">
                      <div className="grid md:grid-cols-2 gap-3">
                        {tier.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-3 h-3 text-green-600" />
                            </div>
                            <span className="text-sm flex items-center gap-1 flex-wrap">
                              {benefit.split('NCTR').map((part, i) => (
                                i === 0 ? part : (
                                  <span key={i} className="inline-flex items-center gap-1">
                                    <NCTRLogo size="xs" />
                                    {part}
                                  </span>
                                )
                              ))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Status NFT */}
                <div 
                  className="rounded-lg p-4"
                  style={{ backgroundColor: tier.bgColor }}
                >
                  <div className="flex items-start gap-3">
                    <Trophy className="w-6 h-6 text-primary" />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{tier.name} Status NFT on Base</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Unlock token-gated access to digital rewards, exclusive subscriptions, and member-only experiences
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {tier.nftBadges.map((badge, idx) => {
                          const icons = [Ticket, Ticket, Crown, Sparkles];
                          const Icon = icons[idx] || Ticket;
                          return (
                            <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                              <Icon className="w-3 h-3" />
                              {badge}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upgrade Section */}
                {canUpgrade && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-4">Instant Upgrade to {tier.name}</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Upgrade Cost</p>
                          <p className="text-3xl font-bold">$100</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            {tier.requirement.toLocaleString()} NCTR will be credited to your 360LOCK account
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-green-600 hover:bg-green-700">
                            <Check className="w-3 h-3 mr-1" />
                            $100 credit applied
                          </Badge>
                          <Button size="lg" className="gap-2">
                            <ShoppingCart className="w-4 h-4" />
                            Buy for $100
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          );
        })}
      </main>
    </div>
  );
}
