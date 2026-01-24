import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Target, Zap, Crown } from 'lucide-react';

interface BenefitTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  tiers: {
    bronze: TierValues;
    silver: TierValues;
    gold: TierValues;
    platinum: TierValues;
    diamond: TierValues;
  };
}

interface TierValues {
  earning_multiplier: number;
  claims_per_year: number;
  claims_per_month: number;
  unlimited_claims: boolean;
  discount_percent: number;
  priority_support: boolean;
  early_access: boolean;
  vip_events: boolean;
  concierge_service: boolean;
  free_shipping: boolean;
}

interface BenefitTemplatesProps {
  onApplyTemplate: (template: BenefitTemplate) => void;
}

const templates: BenefitTemplate[] = [
  {
    id: 'standard',
    name: 'Standard Progression',
    description: 'Balanced multipliers and claims with gradual upgrades',
    icon: <Sparkles className="h-5 w-5" />,
    tiers: {
      bronze: { earning_multiplier: 1.1, claims_per_year: 1, claims_per_month: 0, unlimited_claims: false, discount_percent: 0, priority_support: false, early_access: false, vip_events: false, concierge_service: false, free_shipping: false },
      silver: { earning_multiplier: 1.25, claims_per_year: 4, claims_per_month: 0, unlimited_claims: false, discount_percent: 10, priority_support: true, early_access: false, vip_events: false, concierge_service: false, free_shipping: false },
      gold: { earning_multiplier: 1.4, claims_per_year: 12, claims_per_month: 1, unlimited_claims: false, discount_percent: 15, priority_support: true, early_access: true, vip_events: true, concierge_service: false, free_shipping: false },
      platinum: { earning_multiplier: 1.6, claims_per_year: 24, claims_per_month: 2, unlimited_claims: false, discount_percent: 20, priority_support: true, early_access: true, vip_events: true, concierge_service: true, free_shipping: true },
      diamond: { earning_multiplier: 2.0, claims_per_year: 0, claims_per_month: 0, unlimited_claims: true, discount_percent: 25, priority_support: true, early_access: true, vip_events: true, concierge_service: true, free_shipping: true },
    }
  },
  {
    id: 'rewards-focused',
    name: 'Rewards Focused',
    description: 'Higher claim limits with moderate multipliers',
    icon: <Target className="h-5 w-5" />,
    tiers: {
      bronze: { earning_multiplier: 1.05, claims_per_year: 2, claims_per_month: 0, unlimited_claims: false, discount_percent: 5, priority_support: false, early_access: false, vip_events: false, concierge_service: false, free_shipping: false },
      silver: { earning_multiplier: 1.15, claims_per_year: 6, claims_per_month: 0, unlimited_claims: false, discount_percent: 10, priority_support: true, early_access: false, vip_events: false, concierge_service: false, free_shipping: false },
      gold: { earning_multiplier: 1.25, claims_per_year: 0, claims_per_month: 2, unlimited_claims: false, discount_percent: 15, priority_support: true, early_access: true, vip_events: false, concierge_service: false, free_shipping: true },
      platinum: { earning_multiplier: 1.35, claims_per_year: 0, claims_per_month: 4, unlimited_claims: false, discount_percent: 20, priority_support: true, early_access: true, vip_events: true, concierge_service: false, free_shipping: true },
      diamond: { earning_multiplier: 1.5, claims_per_year: 0, claims_per_month: 0, unlimited_claims: true, discount_percent: 30, priority_support: true, early_access: true, vip_events: true, concierge_service: true, free_shipping: true },
    }
  },
  {
    id: 'earnings-focused',
    name: 'Earnings Focused',
    description: 'Higher multipliers with moderate claim limits',
    icon: <Zap className="h-5 w-5" />,
    tiers: {
      bronze: { earning_multiplier: 1.2, claims_per_year: 1, claims_per_month: 0, unlimited_claims: false, discount_percent: 0, priority_support: false, early_access: false, vip_events: false, concierge_service: false, free_shipping: false },
      silver: { earning_multiplier: 1.5, claims_per_year: 2, claims_per_month: 0, unlimited_claims: false, discount_percent: 5, priority_support: true, early_access: false, vip_events: false, concierge_service: false, free_shipping: false },
      gold: { earning_multiplier: 1.8, claims_per_year: 6, claims_per_month: 0, unlimited_claims: false, discount_percent: 10, priority_support: true, early_access: true, vip_events: false, concierge_service: false, free_shipping: false },
      platinum: { earning_multiplier: 2.2, claims_per_year: 12, claims_per_month: 1, unlimited_claims: false, discount_percent: 15, priority_support: true, early_access: true, vip_events: true, concierge_service: false, free_shipping: true },
      diamond: { earning_multiplier: 3.0, claims_per_year: 24, claims_per_month: 2, unlimited_claims: false, discount_percent: 20, priority_support: true, early_access: true, vip_events: true, concierge_service: true, free_shipping: true },
    }
  },
  {
    id: 'premium-heavy',
    name: 'Premium Heavy',
    description: 'Big jumps at Platinum/Diamond levels',
    icon: <Crown className="h-5 w-5" />,
    tiers: {
      bronze: { earning_multiplier: 1.0, claims_per_year: 1, claims_per_month: 0, unlimited_claims: false, discount_percent: 0, priority_support: false, early_access: false, vip_events: false, concierge_service: false, free_shipping: false },
      silver: { earning_multiplier: 1.1, claims_per_year: 2, claims_per_month: 0, unlimited_claims: false, discount_percent: 5, priority_support: false, early_access: false, vip_events: false, concierge_service: false, free_shipping: false },
      gold: { earning_multiplier: 1.2, claims_per_year: 4, claims_per_month: 0, unlimited_claims: false, discount_percent: 10, priority_support: true, early_access: false, vip_events: false, concierge_service: false, free_shipping: false },
      platinum: { earning_multiplier: 2.0, claims_per_year: 0, claims_per_month: 3, unlimited_claims: false, discount_percent: 25, priority_support: true, early_access: true, vip_events: true, concierge_service: true, free_shipping: true },
      diamond: { earning_multiplier: 3.0, claims_per_year: 0, claims_per_month: 0, unlimited_claims: true, discount_percent: 40, priority_support: true, early_access: true, vip_events: true, concierge_service: true, free_shipping: true },
    }
  },
];

export function BenefitTemplates({ onApplyTemplate }: BenefitTemplatesProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-1">Quick Apply Templates</h3>
        <p className="text-sm text-muted-foreground">
          Select a template to auto-populate tier values. You can customize after applying.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map(template => (
          <Card key={template.id} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {template.icon}
                </div>
                <CardTitle className="text-base">{template.name}</CardTitle>
              </div>
              <CardDescription className="text-xs">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1 mb-3">
                <Badge variant="outline" className="text-xs">
                  {template.tiers.diamond.earning_multiplier}x max
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {template.tiers.diamond.unlimited_claims ? '∞' : template.tiers.diamond.claims_per_month + '/mo'} claims
                </Badge>
              </div>
              <Button 
                size="sm" 
                variant="secondary" 
                className="w-full"
                onClick={() => onApplyTemplate(template)}
              >
                Apply Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export type { BenefitTemplate, TierValues };
