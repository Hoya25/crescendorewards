import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Star, Sparkles, Shirt, Video, Heart, ArrowLeft, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type Category = 'all' | 'experiences' | 'gear' | 'apparel' | 'services' | 'giveback';

interface GroundballReward {
  id: string;
  title: string;
  description: string | null;
  sponsor: string | null;
  category: string | null;
  tier: string | null;
  required_status: string | null;
  image_url: string | null;
  image_emoji: string | null;
  multiplier_text: string | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  quantity_available: number | null;
}

const categories: { key: Category; label: string; emoji: string; icon: typeof Trophy }[] = [
  { key: 'all', label: 'All Rewards', emoji: '🏆', icon: Trophy },
  { key: 'experiences', label: 'Experiences', emoji: '⭐', icon: Star },
  { key: 'gear', label: 'Gear', emoji: '🥍', icon: Sparkles },
  { key: 'apparel', label: 'Apparel', emoji: '👕', icon: Shirt },
  { key: 'services', label: 'Services', emoji: '📹', icon: Video },
  { key: 'giveback', label: 'Give Back', emoji: '💚', icon: Heart },
];

const tierConfig: Record<string, { emoji: string; label: string; gradient: string; border: string }> = {
  gold: { emoji: '🥇', label: 'Gold', gradient: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/30' },
  silver: { emoji: '🥈', label: 'Silver', gradient: 'from-slate-400/20 to-slate-500/10', border: 'border-slate-400/30' },
  bronze: { emoji: '🥉', label: 'Bronze', gradient: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/30' },
  any: { emoji: '💚', label: 'Any Tier', gradient: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/30' },
};

export default function GroundballRewardsPage() {
  const { profile } = useUnifiedUser();
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');

  // Fetch GROUNDBALL rewards
  const { data: rewards, isLoading } = useQuery({
    queryKey: ['groundball-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groundball_rewards')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('title', { ascending: true });
      
      if (error) throw error;
      return data as GroundballReward[];
    },
  });

  // Filter rewards by category
  const filteredRewards = rewards?.filter(reward => 
    selectedCategory === 'all' || reward.category === selectedCategory
  ) || [];

  const crescendoData = profile?.crescendo_data as { locked_nctr?: number } | null;
  const nctrLocked = crescendoData?.locked_nctr || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-emerald-500/20 bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">🥍</span> GROUNDBALL
                </h1>
                <p className="text-sm text-slate-400">Impact Engine</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-4 py-2">
              <Lock className="h-4 w-4 text-amber-400" />
              <span className="font-semibold text-amber-400">{nctrLocked.toLocaleString()}</span>
              <span className="text-xs text-slate-400">NCTR Locked</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-emerald-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30">
              🥍 GROUNDBALL Impact Engine
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Earn Your Way In
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Rewards, gear, and experiences you earn through contribution—not purchase.
            </p>
            
            <div className="flex flex-wrap justify-center gap-6 md:gap-12">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-emerald-400">$0</div>
                <div className="text-sm text-slate-400">Cost to Join</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-emerald-400">{rewards?.length || 0}</div>
                <div className="text-sm text-slate-400">Rewards Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-emerald-400">∞</div>
                <div className="text-sm text-slate-400">Ways to Earn</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="sticky top-[73px] z-40 border-b border-emerald-500/20 bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <Button
                key={cat.key}
                variant={selectedCategory === cat.key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  'whitespace-nowrap rounded-full transition-all',
                  selectedCategory === cat.key
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <span className="mr-1.5">{cat.emoji}</span>
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Rewards Grid */}
      <section className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-slate-900/50 border-slate-700">
                <Skeleton className="h-32 rounded-t-lg" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRewards.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🥍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No rewards in this category</h3>
            <p className="text-slate-400">Check back soon or explore other categories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRewards.map((reward) => {
              const status = reward.required_status || 'any';
              const tier = tierConfig[status] || tierConfig.any;
              
              return (
                <Card
                  key={reward.id}
                  className={cn(
                    'group relative overflow-hidden bg-slate-900/50 border-slate-700 hover:border-emerald-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/10',
                    tier.border
                  )}
                >
                  {/* Tier gradient header */}
                  <div className={cn('h-24 relative bg-gradient-to-br', tier.gradient)}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-5xl">{reward.image_emoji || '🎁'}</span>
                    </div>
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge variant="secondary" className="bg-slate-900/80 text-white text-xs">
                        {tier.emoji} {tier.label} Status
                      </Badge>
                    </div>
                    
                    {reward.is_featured && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-amber-500 text-white text-xs">
                          ⭐ Featured
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4 space-y-3">
                    {/* Sponsor */}
                    {reward.sponsor && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                        {reward.sponsor}
                      </Badge>
                    )}
                    
                    {/* Title */}
                    <h3 className="font-semibold text-white text-lg leading-tight">
                      {reward.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-sm text-slate-400 line-clamp-2">
                      {reward.description}
                    </p>
                    
                    {/* Multiplier badge */}
                    {reward.multiplier_text && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                        ✨ {reward.multiplier_text}
                      </Badge>
                    )}
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Lock className="h-4 w-4 text-emerald-400" />
                        <span className="font-medium text-emerald-400">{tier.label} Status Required</span>
                      </div>
                      
                      <Button
                        size="sm"
                        className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        Claim
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* How to Earn Section */}
      <section className="container mx-auto px-4 py-12 border-t border-emerald-500/20">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-white mb-4">How to Earn GROUNDBALL</h3>
          <p className="text-slate-400 mb-8">
            Contribute to the lacrosse community and earn tokens for rewards.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="text-3xl mb-2">🥍</div>
              <div className="font-semibold text-white">Donate Gear</div>
              <div className="text-sm text-slate-400">Contribute to Gear Vault</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="text-3xl mb-2">📣</div>
              <div className="font-semibold text-white">Share & Engage</div>
              <div className="text-sm text-slate-400">Grow the community</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="text-3xl mb-2">🎯</div>
              <div className="font-semibold text-white">Complete Missions</div>
              <div className="text-sm text-slate-400">Seasonal challenges</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
