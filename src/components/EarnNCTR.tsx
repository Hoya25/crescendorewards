import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { NCTRLogo } from '@/components/NCTRLogo';
import { EarningOpportunityCard } from '@/components/earning/EarningOpportunityCard';
import { useEarningOpportunities } from '@/hooks/useEarningOpportunities';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { CATEGORY_CONFIG, EarningCategory } from '@/types/earning';
import { SEO } from '@/components/SEO';
import { cn } from '@/lib/utils';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  TrendingUp, Coins, ArrowLeft, RefreshCw, Sparkles, 
  ShoppingBag, Smartphone, Users, Rocket, Handshake, AlertCircle,
  ExternalLink, Mail, Info, Gift
} from 'lucide-react';

const categoryIcons: Record<EarningCategory | 'all', React.ElementType> = {
  all: Coins,
  shopping: ShoppingBag,
  apps: Smartphone,
  partners: Handshake,
  community: Users,
  impact: Rocket,
};

export function EarnNCTR() {
  const navigate = useNavigate();
  const { total360Locked, tier } = useUnifiedUser();
  const { featured, active, comingSoon, isLoading, error, refresh } = useEarningOpportunities();
  const [selectedCategory, setSelectedCategory] = useState<EarningCategory | 'all'>('all');

  const filteredOpportunities = selectedCategory === 'all' 
    ? active.filter(o => !o.isFeatured)
    : active.filter(o => o.category === selectedCategory && !o.isFeatured);

  const categories = ['all', ...Object.keys(CATEGORY_CONFIG)] as (EarningCategory | 'all')[];

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
        <SEO title="Earn NCTR" description="Multiple ways to earn NCTR tokens" />
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Failed to load opportunities</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={refresh} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <SEO title="Earn NCTR" description="Multiple ways to earn NCTR tokens" />
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Back button + Title */}
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="h-9 px-3"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              
              <div className="h-6 w-px bg-border hidden sm:block" />
              
              <div>
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  Get Free Claims
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Multiple ways to earn free claims
                </p>
              </div>
            </div>
            
            {/* Right: 360LOCK Badge - Mobile Compact */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className="flex md:hidden items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/50 cursor-pointer hover:bg-muted transition-all duration-200"
                    onClick={() => navigate('/profile')}
                  >
                    {tier ? (
                      <span className="text-lg">{tier.badge_emoji}</span>
                    ) : (
                      <NCTRLogo className="w-4 h-4" />
                    )}
                    <div className="text-right">
                      <p className="font-bold text-sm leading-tight">
                        <AnimatedCounter value={total360Locked} className="font-bold" />
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-tight">360LOCK</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-medium mb-1">
                    {tier ? `${tier.badge_emoji} ${tier.display_name}` : 'Your 360LOCK'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {total360Locked.toLocaleString()} NCTR locked for 360 days. Tap to view your full profile and tier benefits.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Right: 360LOCK Badge - Desktop Full */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-xl bg-muted/50 border border-border/50 cursor-pointer hover:bg-muted hover:border-primary/20 transition-all duration-200"
                    onClick={() => navigate('/profile')}
                  >
                    <NCTRLogo className="w-5 h-5" />
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>Your 360LOCK</span>
                        <Info className="w-3 h-3" />
                      </div>
                      <p className="font-bold text-sm">
                        <AnimatedCounter value={total360Locked} className="font-bold" /> NCTR
                      </p>
                    </div>
                    {tier && (
                      <Badge 
                        variant="outline"
                        className="ml-1"
                        style={{ borderColor: tier.badge_color, color: tier.badge_color }}
                      >
                        {tier.badge_emoji} {tier.display_name}
                      </Badge>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-medium mb-1">What is 360LOCK?</p>
                  <p className="text-xs text-muted-foreground">
                    NCTR tokens locked for 360 days. Higher locks mean better membership tier, 
                    lower reward costs, and exclusive benefits.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Value Proposition Banner */}
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-t border-primary/10">
          <div className="container mx-auto px-4 py-2.5">
            <p className="text-center text-sm text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 inline-block mr-1.5 text-primary" />
              Every purchase and action earns you <span className="font-medium text-foreground">NCTR toward free rewards</span>
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Featured Opportunities Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Start Earning Now</h2>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map(opportunity => (
                <EarningOpportunityCard 
                  key={opportunity.id}
                  opportunity={opportunity}
                  variant="featured"
                />
              ))}
            </div>
          )}
        </section>

        {/* Section Divider */}
        <div className="relative my-12">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
        </div>

        {/* All Opportunities Section */}
        <section className="bg-muted/30 -mx-4 px-4 py-8 rounded-2xl">
          {/* Header with filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h2 className="text-xl font-bold">All Ways to Earn</h2>
            
            {/* Scrollable filter tabs */}
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              <div className="flex gap-2 pb-2 sm:pb-0">
                {categories.map(cat => {
                  const Icon = categoryIcons[cat];
                  const label = cat === 'all' ? 'All' : CATEGORY_CONFIG[cat].label;
                  const isActive = selectedCategory === cat;
                  
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap",
                        "transition-all duration-200 ease-in-out",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-background/80 text-muted-foreground hover:bg-accent hover:text-foreground border border-border/50"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Opportunity cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : filteredOpportunities.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredOpportunities.map(opportunity => (
                <EarningOpportunityCard 
                  key={opportunity.id}
                  opportunity={opportunity}
                  variant="standard"
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-background/50">
              <CardContent className="py-12 text-center">
                {(() => {
                  const Icon = categoryIcons[selectedCategory];
                  const categoryLabel = selectedCategory === 'all' 
                    ? 'earning' 
                    : CATEGORY_CONFIG[selectedCategory].label.toLowerCase();
                  return (
                    <>
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Icon className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">
                        No {categoryLabel} opportunities yet
                      </h3>
                      <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        Check back soon or explore other ways to earn free claims
                      </p>
                      {selectedCategory !== 'all' && (
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setSelectedCategory('all')}
                        >
                          View All Opportunities
                        </Button>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </section>

        {/* Coming Soon Section */}
        {comingSoon.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Rocket className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-bold text-muted-foreground">Coming Soon</h2>
              <Badge variant="secondary" className="ml-2">
                {comingSoon.length} upcoming
              </Badge>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {comingSoon.map(opportunity => (
                <EarningOpportunityCard 
                  key={opportunity.id}
                  opportunity={opportunity}
                  variant="standard"
                />
              ))}
            </div>
          </section>
        )}

        {/* Partner CTA Section */}
        <section>
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-bold mb-2">
                Have an idea for earning NCTR?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Partner brands and apps can integrate with the NCTR ecosystem. 
                We're always looking for new ways to help our community earn.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => navigate('/become-sponsor')}
                >
                  Become a Sponsor
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  className="gap-2"
                  onClick={() => window.open('mailto:partnerships@nctr.live', '_blank')}
                >
                  <Mail className="w-4 h-4" />
                  Contact Us
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
