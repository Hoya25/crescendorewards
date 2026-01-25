import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Check, ExternalLink } from 'lucide-react';

// Tier order for comparison
const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

// Tier colors
const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  bronze: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-700' },
  silver: { bg: 'bg-slate-100 dark:bg-slate-800/50', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-600' },
  gold: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-400 dark:border-yellow-600' },
  platinum: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-400 dark:border-cyan-600' },
  diamond: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-400 dark:border-purple-600' },
};

// Platform colors for creator subs
const PLATFORM_COLORS: Record<string, { bg: string; text: string }> = {
  twitch: { bg: 'bg-purple-600', text: 'text-white' },
  youtube: { bg: 'bg-red-600', text: 'text-white' },
  patreon: { bg: 'bg-[#FF424D]', text: 'text-white' },
};

export interface AlliancePartner {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  short_description: string | null;
  category: string;
  benefit_title: string;
  benefit_description: string;
  monthly_value: number;
  min_tier: string;
  is_diamond_exclusive: boolean;
  slot_cost: number;
  activation_type: string;
  activation_instructions: string | null;
  activation_url: string | null;
  is_creator_subscription: boolean;
  creator_platform: string | null;
  creator_channel_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  total_activations: number;
  hide_value?: boolean;
}

interface PartnerBenefitCardProps {
  partner: AlliancePartner;
  userTier: string;
  isActivated: boolean;
  onActivate: (partner: AlliancePartner) => void;
}

export function PartnerBenefitCard({ 
  partner, 
  userTier, 
  isActivated,
  onActivate 
}: PartnerBenefitCardProps) {
  const userTierIndex = TIER_ORDER.indexOf(userTier.toLowerCase());
  const requiredTierIndex = TIER_ORDER.indexOf(partner.min_tier.toLowerCase());
  const isLocked = userTierIndex < requiredTierIndex;
  const tierColors = TIER_COLORS[partner.min_tier.toLowerCase()] || TIER_COLORS.bronze;

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-200",
      isLocked && "opacity-60",
      !isLocked && !isActivated && "hover:shadow-md hover:border-primary/30",
      isActivated && "border-green-500/50 bg-green-50/50 dark:bg-green-900/10"
    )}>
      {/* Lock overlay for locked benefits */}
      {isLocked && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <div className="text-center p-4">
            <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Requires {partner.min_tier.charAt(0).toUpperCase() + partner.min_tier.slice(1)}
            </p>
          </div>
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Header: Logo + Name */}
        <div className="flex items-start gap-3">
          {/* Logo placeholder */}
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
            {partner.logo_url ? (
              <img 
                src={partner.logo_url} 
                alt={partner.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-muted-foreground">
                {partner.name.charAt(0)}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm truncate">{partner.name}</h3>
              {/* Creator platform badge */}
              {partner.is_creator_subscription && partner.creator_platform && (
                <Badge 
                  className={cn(
                    "text-[10px] px-1.5 py-0",
                    PLATFORM_COLORS[partner.creator_platform]?.bg || 'bg-muted',
                    PLATFORM_COLORS[partner.creator_platform]?.text || 'text-foreground'
                  )}
                >
                  {partner.creator_platform.charAt(0).toUpperCase() + partner.creator_platform.slice(1)}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {partner.short_description || partner.benefit_title}
            </p>
          </div>
        </div>

        {/* Benefit Title */}
        <div className="text-sm font-medium">{partner.benefit_title}</div>

        {/* Footer: Value + Tier + Action */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            {/* Monthly value - only show if not hidden */}
            {!partner.hide_value && partner.monthly_value > 0 && (
              <Badge variant="secondary" className="text-xs">
                ${partner.monthly_value}/mo value
              </Badge>
            )}

            {/* Required tier */}
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs capitalize",
                tierColors.bg,
                tierColors.text,
                tierColors.border
              )}
            >
              {partner.min_tier}+
            </Badge>
          </div>

          {/* Action button */}
          {isActivated ? (
            <Badge className="bg-green-600 hover:bg-green-600 text-white">
              <Check className="w-3 h-3 mr-1" />
              Active
            </Badge>
          ) : !isLocked ? (
            <Button 
              size="sm" 
              variant="default"
              className="h-7 text-xs"
              onClick={() => onActivate(partner)}
            >
              Activate
            </Button>
          ) : null}
        </div>

        {/* External link for creator subs */}
        {partner.is_creator_subscription && partner.creator_channel_url && !isLocked && (
          <a 
            href={partner.creator_channel_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            View Channel
          </a>
        )}
      </CardContent>
    </Card>
  );
}
