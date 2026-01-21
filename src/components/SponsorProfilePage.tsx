import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, ExternalLink, CheckCircle, Gift, Users, 
  Building2, Sparkles, Briefcase, User, Heart,
  Twitter, Instagram, Globe
} from 'lucide-react';
import { useSponsorships } from '@/hooks/useSponsorships';
import { VisualRewardCard } from '@/components/rewards/VisualRewardCard';
import { 
  SPONSOR_TYPE_CONFIG, 
  SPONSOR_TIER_CONFIG,
  type Sponsor,
  type SponsoredReward,
  type SponsorType 
} from '@/types/sponsorship';

const ICON_MAP: Record<string, React.ElementType> = {
  Building2, Sparkles, Briefcase, User, Heart, Users,
};

export function SponsorProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { getSponsorBySlug, getSponsorRewards } = useSponsorships();
  
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [rewards, setRewards] = useState<SponsoredReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [rewardsFilter, setRewardsFilter] = useState('all');

  useEffect(() => {
    const loadSponsor = async () => {
      if (!slug) return;
      
      setLoading(true);
      const sponsorData = await getSponsorBySlug(slug);
      setSponsor(sponsorData);
      
      if (sponsorData) {
        const rewardsData = await getSponsorRewards(sponsorData.id);
        setRewards(rewardsData);
      }
      
      setLoading(false);
    };
    
    loadSponsor();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Cover skeleton */}
        <Skeleton className="h-48 w-full" />
        
        <div className="max-w-6xl mx-auto px-4 -mt-16">
          <div className="flex items-end gap-6 mb-6">
            <Skeleton className="w-32 h-32 rounded-xl" />
            <div className="space-y-2 pb-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!sponsor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold mb-2">Sponsor Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This sponsor profile doesn't exist or is no longer active.
            </p>
            <Button onClick={() => navigate('/sponsors')}>
              View All Sponsors
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = ICON_MAP[SPONSOR_TYPE_CONFIG[sponsor.type]?.icon] || Building2;
  const tierConfig = SPONSOR_TIER_CONFIG[sponsor.tier];
  
  const filteredRewards = rewards.filter(r => {
    if (rewardsFilter === 'all') return true;
    if (rewardsFilter === 'free') {
      const tierCosts = r.status_tier_claims_cost;
      return tierCosts && Object.values(tierCosts).some(cost => cost === 0);
    }
    if (rewardsFilter === 'available') return r.stock_quantity === null || r.stock_quantity > 0;
    return true;
  });

  const socialLinks = sponsor.social_links || {};

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image */}
      <div 
        className="h-48 md:h-64 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20"
        style={sponsor.cover_image_url ? {
          backgroundImage: `url(${sponsor.cover_image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      />
      
      {/* Profile Header */}
      <div className="max-w-6xl mx-auto px-4 -mt-16 relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute -top-8 left-4 bg-background/80 backdrop-blur"
          onClick={() => navigate('/sponsors')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sponsors
        </Button>
        
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-6">
          <Avatar className="w-32 h-32 rounded-xl border-4 border-background shadow-lg">
            <AvatarImage src={sponsor.logo_url || undefined} alt={sponsor.name} />
            <AvatarFallback className="rounded-xl bg-primary/10">
              <Icon className="w-16 h-16 text-primary" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{sponsor.name}</h1>
              {sponsor.is_verified && (
                <CheckCircle className="w-6 h-6 text-primary" />
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="outline">
                {SPONSOR_TYPE_CONFIG[sponsor.type]?.label}
              </Badge>
              <Badge className={`${tierConfig?.bgColor} ${tierConfig?.color} border-0`}>
                {tierConfig?.label}
              </Badge>
            </div>
            
            {sponsor.description && (
              <p className="text-muted-foreground max-w-2xl">
                {sponsor.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {sponsor.website_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4 mr-2" />
                  Website
                </a>
              </Button>
            )}
            {socialLinks.twitter && (
              <Button variant="ghost" size="icon" asChild>
                <a href={`https://twitter.com/${socialLinks.twitter}`} target="_blank" rel="noopener noreferrer">
                  <Twitter className="w-4 h-4" />
                </a>
              </Button>
            )}
            {socialLinks.instagram && (
              <Button variant="ghost" size="icon" asChild>
                <a href={`https://instagram.com/${socialLinks.instagram}`} target="_blank" rel="noopener noreferrer">
                  <Instagram className="w-4 h-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{rewards.length}</div>
              <div className="text-sm text-muted-foreground">Rewards</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{sponsor.total_claims || 0}</div>
              <div className="text-sm text-muted-foreground">Total Claims</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                ${(sponsor.total_sponsored_value || 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Value Sponsored</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {new Date(sponsor.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
              <div className="text-sm text-muted-foreground">Member Since</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Rewards */}
        <section className="pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Rewards by {sponsor.name}</h2>
          </div>
          
          <Tabs value={rewardsFilter} onValueChange={setRewardsFilter} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All ({rewards.length})</TabsTrigger>
              <TabsTrigger value="free">Free for You</TabsTrigger>
              <TabsTrigger value="available">Available Now</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {filteredRewards.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No rewards yet</h3>
                <p className="text-muted-foreground">
                  This sponsor hasn't added any rewards yet. Check back soon!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRewards.map((reward) => (
                <VisualRewardCard
                  key={reward.id}
                  reward={{
                    id: reward.id,
                    title: reward.title,
                    description: reward.description,
                    category: reward.category,
                    cost: reward.cost,
                    image_url: reward.image_url || null,
                    stock_quantity: reward.stock_quantity || null,
                    is_active: reward.is_active,
                    is_featured: false,
                    is_sponsored: reward.is_sponsored,
                    sponsor_name: sponsor.name,
                    sponsor_logo_url: sponsor.logo_url,
                    status_tier_claims_cost: reward.status_tier_claims_cost,
                  }}
                  isInFavorites={false}
                  onToggleFavorites={() => {}}
                  onClick={() => navigate(`/rewards/${reward.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
