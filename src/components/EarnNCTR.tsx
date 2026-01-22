import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { NCTRLogo } from '@/components/NCTRLogo';
import { EarningOpportunityCard } from '@/components/earning/EarningOpportunityCard';
import { useEarningOpportunities } from '@/hooks/useEarningOpportunities';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { CATEGORY_CONFIG, EarningCategory } from '@/types/earning';
import { SEO } from '@/components/SEO';
import { 
  TrendingUp, Coins, ArrowLeft, RefreshCw, Sparkles, 
  ShoppingBag, Smartphone, Users, Rocket, Handshake, AlertCircle,
  ExternalLink, Mail
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
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  Get Free Claims
                </h1>
                <p className="text-sm text-muted-foreground">
                  Multiple ways to earn free claims
                </p>
              </div>
            </div>
            
            {/* User's NCTR Balance */}
            <div 
              className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate('/profile')}
            >
              <NCTRLogo className="w-5 h-5" />
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Your 360LOCK</p>
                <p className="font-bold">{total360Locked.toLocaleString()}</p>
              </div>
              {tier && (
                <Badge 
                  variant="outline"
                  style={{ borderColor: tier.badge_color, color: tier.badge_color }}
                >
                  {tier.badge_emoji}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-10">
        {/* Featured Opportunities Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Start Earning Now</h2>
          </div>
          
          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
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

        {/* All Opportunities Section */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold">All Ways to Earn</h2>
            
            <Tabs 
              value={selectedCategory} 
              onValueChange={(v) => setSelectedCategory(v as EarningCategory | 'all')}
            >
              <TabsList className="h-9">
                {categories.map(cat => {
                  const Icon = categoryIcons[cat];
                  const label = cat === 'all' ? 'All' : CATEGORY_CONFIG[cat].label;
                  return (
                    <TabsTrigger key={cat} value={cat} className="gap-1.5 text-xs">
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : filteredOpportunities.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredOpportunities.map(opportunity => (
                <EarningOpportunityCard 
                  key={opportunity.id}
                  opportunity={opportunity}
                  variant="standard"
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  No opportunities in this category yet. Check back soon!
                </p>
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
