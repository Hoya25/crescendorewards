import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Sparkles, Lock, Gift, Trophy, TrendingUp, Star, Users, Zap, Award, CheckCircle2, ExternalLink } from "lucide-react";
import { NCTRLogo } from "./NCTRLogo";
import { CrescendoLogo } from "./CrescendoLogo";
import { ImageWithFallback } from "./ImageWithFallback";

interface LandingPageProps {
  onJoin: () => void;
  onViewRewards: () => void;
  onSignIn: () => void;
  onViewLevelDetail?: (level: number) => void;
}

export function LandingPage({ onJoin, onViewRewards, onSignIn, onViewLevelDetail }: LandingPageProps) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Navigation */}
      <nav className="flex flex-col md:flex-row items-center justify-between p-4 md:p-6 gap-4 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <CrescendoLogo />
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onViewRewards}>
            Rewards
          </Button>
          <Button variant="ghost" onClick={onSignIn}>
            Sign in
          </Button>
          <Button onClick={onJoin} className="bg-violet-600 hover:bg-violet-700 text-white">
            Join Now
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 md:pt-32 pb-12 md:pb-20 px-4 md:px-6 overflow-hidden w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-50 -z-10" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDEyNCwgNTgsIDIzNywgMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40 -z-10" />

        <div className="max-w-7xl mx-auto text-center px-4">
          <Badge className="mb-4 md:mb-6 bg-violet-100 text-violet-700 hover:bg-violet-100">
            Member Built. Member Owned.
          </Badge>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 md:mb-6 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Unlock Exclusive Rewards
          </h1>
          <p className="text-base md:text-xl text-neutral-600 max-w-2xl mx-auto mb-6 md:mb-10 px-4 flex items-center justify-center gap-2 flex-wrap">
            Commit <NCTRLogo size="lg" /> to 360LOCK, claim your status NFT on Base, and access crowdsourced digital rewards from Crescendo brands.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4">
            <Button onClick={onJoin} size="lg" className="bg-violet-600 hover:bg-violet-700 text-white w-full sm:w-auto">
              Join Crescendo
            </Button>
            <Button onClick={onViewRewards} size="lg" variant="outline" className="w-full sm:w-auto">
              View Rewards
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-white dark:bg-gray-950 w-full">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-8 md:mb-16 px-4">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">How It Works</h2>
            <p className="text-neutral-600 dark:text-neutral-400">Three simple steps to unlock your rewards</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-4">
            <Card className="border-2 hover:border-violet-200 transition-colors">
              <CardContent className="pt-8">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 flex items-center justify-center gap-2">
                  Earn and Commit <NCTRLogo size="lg" />
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 flex items-center justify-center gap-1 flex-wrap">
                  Commit your <NCTRLogo size="sm" /> tokens to 360LOCK to build your Crescendo member status and unlock benefits.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-violet-200 transition-colors">
              <CardContent className="pt-8">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-400 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Claim Status Access Pass</h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Claim your status NFT on Base to enable token-gated access to exclusive rewards and experiences.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-violet-200 transition-colors">
              <CardContent className="pt-8">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mb-6">
                  <Gift className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Redeem Rewards</h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Access and redeem exclusive digital rewards crowdsourced from Crescendo brands and partners.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Status Levels Preview */}
      <section className="py-20 px-6 bg-neutral-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Membership Levels</h2>
            <p className="text-neutral-600 dark:text-neutral-400 flex items-center justify-center gap-1">
              Lock <NCTRLogo size="sm" /> in 360LOCK to unlock greater benefits
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {[
              { level: 1, tier: 'Bronze', color: 'from-emerald-400 to-green-500', required: '1K', multiplier: '1.1x' },
              { level: 2, tier: 'Silver', color: 'from-blue-400 to-cyan-500', required: '2.5K', multiplier: '1.25x' },
              { level: 3, tier: 'Gold', color: 'from-purple-400 to-violet-500', required: '5K', multiplier: '1.4x' },
              { level: 4, tier: 'Platinum', color: 'from-amber-400 to-yellow-500', required: '10K', multiplier: '1.5x' },
              { level: 5, tier: 'Diamond', color: 'from-cyan-400 to-blue-600', required: '25K', multiplier: '2x' },
            ].map((tier) => (
              <Card key={tier.level} className="border-2 hover:border-violet-200 transition-all hover:scale-105 cursor-pointer" onClick={() => onViewLevelDetail?.(tier.level)}>
                <CardContent className="pt-6 text-center">
                  <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${tier.color} rounded-2xl flex items-center justify-center mb-4`}>
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">{tier.tier}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">{tier.required} NCTR</p>
                  <Badge variant="secondary" className="text-xs">{tier.multiplier} Earn</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-violet-600 mb-2">500K+</div>
              <p className="text-neutral-600 dark:text-neutral-400">Total Rewards</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-violet-600 mb-2">50+</div>
              <p className="text-neutral-600 dark:text-neutral-400">Brand Partners</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-violet-600 mb-2">10K+</div>
              <p className="text-neutral-600 dark:text-neutral-400">Active Members</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-violet-600 mb-2">$2M+</div>
              <p className="text-neutral-600 dark:text-neutral-400">Rewards Value</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-violet-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Earning?</h2>
          <p className="text-xl mb-10 text-violet-100">
            Join Crescendo today and unlock exclusive rewards from top brands
          </p>
          <Button onClick={onJoin} size="lg" className="bg-white text-violet-600 hover:bg-neutral-100">
            Get Started Now
          </Button>
        </div>
      </section>
    </div>
  );
}
