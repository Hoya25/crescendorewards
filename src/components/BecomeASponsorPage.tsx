import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, Sparkles, Briefcase, User, Heart, Users,
  Gift, Crown, Award, Sliders, TrendingUp, ArrowRight,
  Check, ChevronDown
} from 'lucide-react';
import { useSponsor } from '@/hooks/useSponsor';
import { useSponsorships } from '@/hooks/useSponsorships';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { 
  SPONSOR_TYPE_CONFIG, 
  SPONSOR_TIER_CONFIG,
  CONTRIBUTION_MODEL_CONFIG,
  MEMBER_TIER_DISPLAY,
  type SponsorType 
} from '@/types/sponsorship';

const ICON_MAP: Record<string, React.ElementType> = {
  Building2, Sparkles, Briefcase, User, Heart, Users,
  Gift, Crown, Award, Sliders, TrendingUp,
};

const SPONSOR_TYPE_DETAILS: Record<SponsorType, { title: string; description: string }> = {
  brand: { title: 'Brand', description: 'Offer discounts, products, and exclusive access' },
  creator: { title: 'Creator', description: 'Reward your fans with exclusive content and experiences' },
  employer: { title: 'Employer', description: 'Reach qualified candidates and sponsor workforce development' },
  individual: { title: 'Individual', description: 'Give back to the community with personal contributions' },
  nonprofit: { title: 'Nonprofit', description: 'Distribute grants and scholarships to verified recipients' },
  organization: { title: 'Organization', description: 'Support your community with meaningful rewards' },
};

const TIER_PRICING_EXAMPLE = [
  { tier: 'diamond', price: 'FREE', sponsorCovers: '100%' },
  { tier: 'platinum', price: 'FREE', sponsorCovers: '100%' },
  { tier: 'gold', price: '25 Claims', sponsorCovers: '75%' },
  { tier: 'silver', price: '50 Claims', sponsorCovers: '50%' },
  { tier: 'bronze', price: '100 Claims', sponsorCovers: '0%' },
];

export function BecomeASponsorPage() {
  const navigate = useNavigate();
  const { profile } = useUnifiedUser();
  const { submitApplication } = useSponsor();
  const { featuredSponsors } = useSponsorships();
  
  const [formData, setFormData] = useState({
    type: '' as SponsorType | '',
    company_name: '',
    contact_name: profile?.display_name || '',
    contact_email: profile?.email || '',
    website_url: '',
    description: '',
    intended_contribution: '',
    agreed: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.agreed) return;
    
    setSubmitting(true);
    const success = await submitApplication({
      type: formData.type,
      company_name: formData.company_name,
      contact_name: formData.contact_name,
      contact_email: formData.contact_email,
      website_url: formData.website_url || undefined,
      description: formData.description || undefined,
      intended_contribution: formData.intended_contribution || undefined,
    });
    setSubmitting(false);
    
    if (success) {
      setSubmitted(true);
    }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <CardTitle>Application Submitted!</CardTitle>
            <CardDescription>
              We'll review your application within 24-48 hours and get back to you via email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/sponsors')} className="w-full">
              View Sponsor Directory
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">Partner With Us</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Become a Sponsor
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Reach engaged community members who earn access, not buy it. 
            Connect with verified participants who've proven their commitment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => scrollToSection('application')}>
              Apply Now <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => scrollToSection('models')}>
              Learn More <ChevronDown className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Sponsor Types Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Anyone Can Sponsor</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Whether you're a global brand or an individual contributor, there's a place for you.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(Object.keys(SPONSOR_TYPE_CONFIG) as SponsorType[]).map((type) => {
              const config = SPONSOR_TYPE_CONFIG[type];
              const details = SPONSOR_TYPE_DETAILS[type];
              const Icon = ICON_MAP[config.icon];
              
              return (
                <Card key={type} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{details.title}</CardTitle>
                    <CardDescription>{details.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <Separator />

      {/* Contribution Models Section */}
      <section id="models" className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Flexible Ways to Contribute</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Choose the model that works best for your goals and budget.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(CONTRIBUTION_MODEL_CONFIG).map(([key, config]) => {
              const Icon = ICON_MAP[config.icon];
              const details: Record<string, string[]> = {
                contribute: ['List rewards, members spend Claims', 'You receive NCTR when claimed', 'Zero upfront cost'],
                full_sponsor: ['Fund free access for all members', 'Maximum brand exposure', 'Pay per claim or monthly'],
                tier_sponsor: ['Free for top tiers, Claims for others', 'Reward loyal members', 'Flexible budget allocation'],
                hybrid: ['Discounted pricing by tier', 'Balance reach and budget', 'Customizable structure'],
                revenue_share: ['Pay only on conversions', 'Performance-based', 'Zero risk'],
              };
              
              return (
                <Card key={key}>
                  <CardHeader>
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{config.label}</CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {details[key]?.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-emerald-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tier Pricing Example */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How Tier-Based Sponsorship Works</h2>
          <p className="text-center text-muted-foreground mb-12">
            Example: "Pro Tool Kit" sponsored by a brand partner
          </p>
          
          <Card>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Member Tier</th>
                      <th className="text-left py-3 px-4">Price</th>
                      <th className="text-left py-3 px-4">Sponsor Covers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TIER_PRICING_EXAMPLE.map((row) => {
                      const tierInfo = MEMBER_TIER_DISPLAY[row.tier];
                      return (
                        <tr key={row.tier} className="border-b last:border-0">
                          <td className="py-3 px-4">
                            <span className="font-medium">
                              {tierInfo?.emoji} {tierInfo?.label}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {row.price === 'FREE' ? (
                              <Badge variant="default" className="bg-emerald-500">FREE</Badge>
                            ) : (
                              <span className="text-muted-foreground">{row.price}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{row.sponsorCovers}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Sponsorship Tiers */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Sponsorship Levels</h2>
          <p className="text-center text-muted-foreground mb-12">
            Higher tiers unlock more visibility and features
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(SPONSOR_TIER_CONFIG).map(([key, config]) => (
              <Card key={key} className={key === 'gold' ? 'border-primary ring-2 ring-primary/20' : ''}>
                <CardHeader>
                  <Badge className={config.bgColor + ' ' + config.color + ' border-0'}>
                    {config.label}
                  </Badge>
                  <CardTitle className="text-2xl mt-2">
                    {config.minMonthly === 0 ? 'Free' : `$${config.minMonthly.toLocaleString()}/mo`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      List rewards
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      Basic analytics
                    </li>
                    {config.minMonthly >= 500 && (
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        Featured placement
                      </li>
                    )}
                    {config.minMonthly >= 2000 && (
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        Newsletter feature
                      </li>
                    )}
                    {config.minMonthly >= 5000 && (
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        Category exclusivity
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Current Sponsors */}
      {featuredSponsors.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Join These Sponsors</h2>
            <div className="flex flex-wrap justify-center gap-8">
              {featuredSponsors.map((sponsor) => (
                <div key={sponsor.id} className="flex items-center gap-2">
                  {sponsor.logo_url ? (
                    <img src={sponsor.logo_url} alt={sponsor.name} className="h-8 object-contain" />
                  ) : (
                    <span className="font-semibold">{sponsor.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Separator />

      {/* Application Form */}
      <section id="application" className="py-16 px-4 bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Apply to Become a Sponsor</h2>
          <p className="text-center text-muted-foreground mb-8">
            Fill out the form below and we'll get back to you within 24-48 hours.
          </p>
          
          {!profile && (
            <Card className="mb-6 border-primary/50 bg-primary/5">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm">Sign in for a faster application</span>
                <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                  Sign In
                </Button>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="type">Sponsor Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as SponsorType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sponsor type" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(SPONSOR_TYPE_CONFIG) as SponsorType[]).map((type) => (
                        <SelectItem key={type} value={type}>
                          {SPONSOR_TYPE_CONFIG[type].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company / Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">Contact Name *</Label>
                    <Input
                      id="contact_name"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email *</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website_url">Website (optional)</Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    placeholder="https://"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Tell us about yourself</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of your company or brand..."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="intended_contribution">What rewards would you offer?</Label>
                  <Textarea
                    id="intended_contribution"
                    value={formData.intended_contribution}
                    onChange={(e) => setFormData({ ...formData, intended_contribution: e.target.value })}
                    placeholder="Describe the rewards or experiences you'd like to sponsor..."
                    rows={3}
                  />
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="agreed"
                    checked={formData.agreed}
                    onCheckedChange={(checked) => setFormData({ ...formData, agreed: !!checked })}
                  />
                  <Label htmlFor="agreed" className="text-sm text-muted-foreground cursor-pointer">
                    I agree to the sponsor terms and understand that my application will be reviewed
                  </Label>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={!formData.type || !formData.company_name || !formData.contact_email || !formData.agreed || submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            {[
              { q: 'How much does it cost?', a: 'It depends on your contribution model. You can list rewards for free with our "Contribute" model, or choose to fully sponsor rewards for members.' },
              { q: 'How do I get paid?', a: 'For contributed rewards, you receive NCTR tokens when members claim your rewards. These can be used within our ecosystem or converted.' },
              { q: 'Can individuals sponsor?', a: 'Yes! Anyone can become a sponsor. Individual contributors are welcome to support the community with personal contributions.' },
              { q: 'How are members verified?', a: 'Members earn access through active participation in the community. They lock tokens to demonstrate long-term commitment.' },
              { q: 'What\'s the approval process?', a: 'We review all applications within 24-48 hours. Approved sponsors can immediately start listing rewards.' },
            ].map((faq, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
