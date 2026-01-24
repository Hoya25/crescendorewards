import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Clock, Settings, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { AlliancePartner } from './PartnerBenefitCard';
import { PLATFORM_COLORS, PLATFORM_NAMES } from '@/utils/creatorPlatforms';

export interface MemberActiveBenefit {
  id: string;
  user_id: string;
  partner_id: string;
  status: string;
  activated_at: string | null;
  expires_at: string | null;
  redemption_code: string | null;
  can_swap_after: string | null;
  slots_used: number;
  created_at: string;
  selected_creator_name?: string | null;
  selected_creator_url?: string | null;
  selected_creator_platform?: string | null;
  partner?: AlliancePartner;
}

interface ActiveBenefitCardProps {
  benefit: MemberActiveBenefit;
  onManage: (benefit: MemberActiveBenefit) => void;
}

export function ActiveBenefitCard({ benefit, onManage }: ActiveBenefitCardProps) {
  const partner = benefit.partner;
  
  if (!partner) {
    return null;
  }

  const canSwapDate = benefit.can_swap_after ? new Date(benefit.can_swap_after) : null;
  const canSwapNow = canSwapDate ? canSwapDate <= new Date() : true;
  const isCreatorSub = partner.is_creator_subscription;
  const platform = benefit.selected_creator_platform || partner.creator_platform;
  const platformColor = platform ? PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS] : undefined;
  const platformName = platform ? PLATFORM_NAMES[platform as keyof typeof PLATFORM_NAMES] : undefined;

  return (
    <Card className="border-green-500/30 bg-green-50/30 dark:bg-green-900/10">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Logo */}
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

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-sm">{partner.name}</h3>
              {isCreatorSub && platformName && (
                <Badge 
                  className="text-white text-[10px]"
                  style={{ backgroundColor: platformColor }}
                >
                  {platformName}
                </Badge>
              )}
              <Badge className="bg-green-600 hover:bg-green-600 text-white text-[10px]">
                <Check className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{partner.benefit_title}</p>
            
            {/* Selected creator info for creator subscriptions */}
            {isCreatorSub && benefit.selected_creator_name && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Supporting:</span>
                <span className="text-sm font-medium">{benefit.selected_creator_name}</span>
                {benefit.selected_creator_url && (
                  <a 
                    href={benefit.selected_creator_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
            
            {/* Swap availability */}
            {!canSwapNow && canSwapDate && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Can swap after {format(canSwapDate, 'MMM d, yyyy')}
              </div>
            )}

            {/* Change creator option when swap is available */}
            {isCreatorSub && canSwapNow && benefit.selected_creator_name && (
              <div className="mt-2">
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-xs"
                  onClick={() => onManage(benefit)}
                >
                  Change creator
                </Button>
              </div>
            )}
          </div>

          {/* Manage button */}
          <Button 
            variant="ghost" 
            size="sm"
            className="flex-shrink-0"
            onClick={() => onManage(benefit)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Redemption code if available */}
        {benefit.redemption_code && benefit.status === 'active' && (
          <div className="mt-3 p-2 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Your Code:</p>
            <code className="text-sm font-mono font-bold">{benefit.redemption_code}</code>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
