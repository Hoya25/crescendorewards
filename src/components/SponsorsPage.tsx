import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, Gift, ExternalLink, CheckCircle, 
  Building2, Sparkles, Briefcase, User, Heart, Users,
  ArrowRight
} from 'lucide-react';
import { useSponsorships } from '@/hooks/useSponsorships';
import { 
  SPONSOR_TYPE_CONFIG, 
  SPONSOR_TIER_CONFIG,
  type Sponsor,
  type SponsorType 
} from '@/types/sponsorship';

const ICON_MAP: Record<string, React.ElementType> = {
  Building2, Sparkles, Briefcase, User, Heart, Users,
};

export function SponsorsPage() {
  const navigate = useNavigate();
  const { sponsors, featuredSponsors, loading, getSponsors } = useSponsorships();
  
  const [filteredSponsors, setFilteredSponsors] = useState<Sponsor[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('claims');

  useEffect(() => {
    let result = [...sponsors];
    
    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(s => s.type === typeFilter);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'rewards':
          return (b.total_claims || 0) - (a.total_claims || 0);
        case 'claims':
        default:
          return (b.total_claims || 0) - (a.total_claims || 0);
      }
    });
    
    setFilteredSponsors(result);
  }, [sponsors, typeFilter, searchQuery, sortBy]);

  const getSponsorIcon = (type: SponsorType) => {
    const config = SPONSOR_TYPE_CONFIG[type];
    return ICON_MAP[config?.icon] || Building2;
  };

  const SponsorCard = ({ sponsor }: { sponsor: Sponsor }) => {
    const Icon = getSponsorIcon(sponsor.type);
    const tierConfig = SPONSOR_TIER_CONFIG[sponsor.tier];
    
    return (
      <Card 
        className="hover:border-primary/50 transition-colors cursor-pointer group"
        onClick={() => navigate(`/sponsors/${sponsor.slug}`)}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16 rounded-lg">
              <AvatarImage src={sponsor.logo_url || undefined} alt={sponsor.name} />
              <AvatarFallback className="rounded-lg bg-primary/10">
                <Icon className="w-8 h-8 text-primary" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                  {sponsor.name}
                </h3>
                {sponsor.is_verified && (
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {SPONSOR_TYPE_CONFIG[sponsor.type]?.label}
                </Badge>
                <Badge className={`${tierConfig?.bgColor} ${tierConfig?.color} border-0 text-xs`}>
                  {tierConfig?.label?.split(' ')[0]}
                </Badge>
              </div>
              
              {sponsor.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {sponsor.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  {sponsor.total_claims || 0} claims
                </span>
                {sponsor.website_url && (
                  <ExternalLink className="w-3 h-3" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const FeaturedSponsorCard = ({ sponsor }: { sponsor: Sponsor }) => {
    const Icon = getSponsorIcon(sponsor.type);
    const tierConfig = SPONSOR_TIER_CONFIG[sponsor.tier];
    
    return (
      <Card 
        className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => navigate(`/sponsors/${sponsor.slug}`)}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-20 h-20 rounded-xl">
              <AvatarImage src={sponsor.logo_url || undefined} alt={sponsor.name} />
              <AvatarFallback className="rounded-xl bg-primary/10">
                <Icon className="w-10 h-10 text-primary" />
              </AvatarFallback>
            </Avatar>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold">{sponsor.name}</h3>
                {sponsor.is_verified && (
                  <CheckCircle className="w-5 h-5 text-primary" />
                )}
              </div>
              <Badge className={`${tierConfig?.bgColor} ${tierConfig?.color} border-0`}>
                {tierConfig?.label}
              </Badge>
            </div>
          </div>
          
          {sponsor.description && (
            <p className="text-muted-foreground mb-4 line-clamp-2">
              {sponsor.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {sponsor.total_claims || 0} rewards contributed
            </span>
            <Button variant="ghost" size="sm">
              View Profile <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-12 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Our Sponsors</h1>
              <p className="text-muted-foreground">
                The brands, creators, and community members powering rewards
              </p>
            </div>
            <Button onClick={() => navigate('/become-sponsor')}>
              Become a Sponsor
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Sponsors */}
      {featuredSponsors.length > 0 && (
        <section className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-semibold mb-6">Featured Sponsors</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Skeleton className="w-20 h-20 rounded-xl" />
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-12 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                featuredSponsors.map((sponsor) => (
                  <FeaturedSponsorCard key={sponsor.id} sponsor={sponsor} />
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Sponsor Directory */}
      <section className="py-8 px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search sponsors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claims">Most Claims</SelectItem>
                <SelectItem value="rewards">Most Rewards</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Type Filter Tabs */}
          <Tabs value={typeFilter} onValueChange={setTypeFilter} className="mb-6">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              {(Object.keys(SPONSOR_TYPE_CONFIG) as SponsorType[]).map((type) => (
                <TabsTrigger key={type} value={type}>
                  {SPONSOR_TYPE_CONFIG[type].label}s
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          {/* Sponsors Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Skeleton className="w-16 h-16 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredSponsors.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No sponsors found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Try a different search term' : 'Be the first to join!'}
                </p>
                <Button onClick={() => navigate('/become-sponsor')}>
                  Become a Sponsor
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSponsors.map((sponsor) => (
                <SponsorCard key={sponsor.id} sponsor={sponsor} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
