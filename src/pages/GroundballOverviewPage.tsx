// GROUNDBALL Impact Engine Overview Page
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Gift, 
  Package, 
  TrendingUp, 
  Users, 
  Sparkles,
  ArrowRight,
  Coins
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGroundballStatus } from '@/hooks/useGroundballStatus';
import { GroundballStatusBadge } from '@/components/groundball/GroundballStatusBadge';
import { GroundballSecondaryNav } from '@/components/groundball/GroundballSecondaryNav';

export default function GroundballOverviewPage() {
  const {
    status,
    rewards,
    selections,
    isLoading,
    totalSlots,
    usedSlots,
    freeSwaps,
    bonusSlots,
    claimsBalance,
  } = useGroundballStatus();

  const availableSlots = totalSlots - usedSlots;
  const featuredRewards = rewards.filter(r => r.is_featured).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
      {/* Header with Secondary Nav */}
      <header className="sticky top-0 z-50 border-b border-emerald-500/20 bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">🥍</span> GROUNDBALL
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Lacrosse community impact rewards
              </p>
            </div>
            
            {/* Claims Balance */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30">
              <Coins className="w-5 h-5 text-amber-400" />
              <span className="font-medium text-amber-400">{claimsBalance} Claims</span>
            </div>
          </div>
          
          <GroundballSecondaryNav />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Status Card */}
        <section>
          <GroundballStatusBadge size="lg" showProgress showSelections />
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-white">{usedSlots}</div>
              <div className="text-sm text-slate-400">Active Rewards</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-emerald-400">{availableSlots}</div>
              <div className="text-sm text-slate-400">Slots Available</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-white">{freeSwaps}</div>
              <div className="text-sm text-slate-400">Free Swaps</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-amber-400">+{bonusSlots}</div>
              <div className="text-sm text-slate-400">Bonus Slots</div>
            </CardContent>
          </Card>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/groundball/rewards" className="block">
            <Card className="bg-gradient-to-br from-emerald-900/50 to-emerald-950/50 border-emerald-500/30 hover:border-emerald-500/50 transition-all h-full">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                  <Gift className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Browse Rewards</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Explore {rewards.length}+ rewards available
                </p>
                <Button className="bg-emerald-600 hover:bg-emerald-700 mt-auto">
                  View Catalog <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/groundball/my-rewards" className="block">
            <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 border-slate-700 hover:border-slate-600 transition-all h-full">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-slate-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">My Rewards</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Manage your {selections.length} active selections
                </p>
                <Button variant="outline" className="border-slate-600 mt-auto">
                  Manage <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/groundball/gear-vault" className="block">
            <Card className="bg-gradient-to-br from-amber-900/30 to-amber-950/30 border-amber-500/30 hover:border-amber-500/50 transition-all h-full">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                  <Package className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Gear Vault</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Donate or claim lacrosse equipment
                </p>
                <Button variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 mt-auto">
                  Explore <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </section>

        {/* Featured Rewards */}
        {featuredRewards.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Featured Rewards
              </h2>
              <Link to="/groundball/rewards" className="text-sm text-emerald-400 hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredRewards.map((reward) => (
                <Card key={reward.id} className="bg-slate-900/50 border-slate-800 overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{reward.image_emoji || '🎁'}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white truncate">{reward.title}</h4>
                        {reward.sponsor && (
                          <p className="text-xs text-slate-400">by {reward.sponsor}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          {reward.required_status && reward.required_status !== 'any' && (
                            <Badge variant="secondary" className="text-xs">
                              {reward.required_status}+
                            </Badge>
                          )}
                          {reward.cadence && (
                            <Badge variant="outline" className="text-xs border-slate-600">
                              {reward.cadence}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* How It Works */}
        <section className="pt-8 border-t border-slate-800">
          <h2 className="text-lg font-semibold text-white mb-6 text-center">How GROUNDBALL Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-medium text-white mb-2">Earn GROUNDBALL</h3>
              <p className="text-sm text-slate-400">
                Contribute to the lacrosse community through gear donations, engagement, and missions
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-medium text-white mb-2">Lock for Status</h3>
              <p className="text-sm text-slate-400">
                Lock your tokens to unlock Bronze, Silver, and Gold status tiers
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                <Gift className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-medium text-white mb-2">Access Rewards</h3>
              <p className="text-sm text-slate-400">
                Select from exclusive experiences, gear, and give-back opportunities
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
