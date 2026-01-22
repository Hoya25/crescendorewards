import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EarningOpportunity } from '@/types/earning';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Leaf, ShoppingBag, Zap, Target, Users, Rocket, Gift, 
  ExternalLink, Clock, TrendingUp, Coins, Store, Smartphone,
  Handshake, Star, ArrowRight
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Leaf, ShoppingBag, Zap, Target, Users, Rocket, Gift,
  TrendingUp, Coins, Store, Smartphone, Handshake, Star,
};

interface EarningOpportunityCardProps {
  opportunity: EarningOpportunity;
  variant?: 'featured' | 'standard' | 'compact';
}

export function EarningOpportunityCard({ 
  opportunity, 
  variant = 'standard' 
}: EarningOpportunityCardProps) {
  const navigate = useNavigate();
  const IconComponent = iconMap[opportunity.iconName] || Gift;
  const hasLogoImage = opportunity.iconUrl && opportunity.iconUrl.length > 0;

  const handleClick = () => {
    if (opportunity.isComingSoon) {
      toast.info("Coming soon!", {
        description: "We'll notify you when this is ready."
      });
      return;
    }

    if (!opportunity.ctaUrl) return;

    if (opportunity.ctaUrl.startsWith('/')) {
      navigate(opportunity.ctaUrl);
    } else if (opportunity.opensInNewTab) {
      window.open(opportunity.ctaUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = opportunity.ctaUrl;
    }
  };

  if (variant === 'featured') {
    return (
      <Card 
        className={cn(
          "relative overflow-hidden border-0 cursor-pointer transition-all duration-300",
          "hover:-translate-y-1 hover:shadow-xl group h-full",
          "rounded-2xl min-w-[280px]",
          opportunity.isComingSoon && "opacity-75"
        )}
        style={{ 
          background: `linear-gradient(135deg, ${opportunity.backgroundColor}15, ${opportunity.backgroundColor}30)`,
          borderLeft: `4px solid ${opportunity.backgroundColor}`
        }}
        onClick={handleClick}
      >
        {opportunity.isComingSoon && (
          <div className="absolute top-4 right-4 z-10">
            <Badge variant="secondary" className="gap-1 bg-muted/90">
              <Clock className="w-3 h-3" />
              {opportunity.comingSoonText || 'Coming Soon'}
            </Badge>
          </div>
        )}
        
        <CardContent className="p-6 flex flex-col h-full">
          {/* Icon */}
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-lg overflow-hidden mb-4"
            style={{ backgroundColor: hasLogoImage ? 'transparent' : opportunity.backgroundColor }}
          >
            {hasLogoImage ? (
              <img 
                src={opportunity.iconUrl} 
                alt={opportunity.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <IconComponent className="w-7 h-7 text-white" />
            )}
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
            {opportunity.name}
          </h3>
          
          {/* Earn potential badge */}
          {opportunity.earnPotential && (
            <Badge 
              variant="outline" 
              className="w-fit mb-3 border-primary/30 text-primary text-xs"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              {opportunity.earnPotential}
            </Badge>
          )}
          
          {/* Description */}
          <p className="text-muted-foreground text-sm flex-1 mb-4">
            {opportunity.shortDescription || opportunity.description}
          </p>

          {/* CTA Button - pill shaped */}
          <Button 
            className={cn(
              "w-full rounded-full gap-2 font-medium whitespace-nowrap",
              "transition-all duration-200"
            )}
            style={{ 
              backgroundColor: opportunity.isComingSoon ? undefined : opportunity.backgroundColor,
              color: opportunity.isComingSoon ? undefined : 'white'
            }}
            variant={opportunity.isComingSoon ? "outline" : "default"}
            disabled={opportunity.isComingSoon}
          >
            {opportunity.ctaText}
            {!opportunity.isComingSoon && opportunity.ctaUrl?.startsWith('http') && (
              <ExternalLink className="w-4 h-4 shrink-0" />
            )}
            {!opportunity.isComingSoon && !opportunity.ctaUrl?.startsWith('http') && (
              <ArrowRight className="w-4 h-4 shrink-0" />
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <div 
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50",
          opportunity.isComingSoon && "opacity-60"
        )}
        onClick={handleClick}
      >
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
          style={{ backgroundColor: hasLogoImage ? 'transparent' : `${opportunity.backgroundColor}20` }}
        >
          {hasLogoImage ? (
            <img 
              src={opportunity.iconUrl} 
              alt={opportunity.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <IconComponent 
              className="w-5 h-5" 
              style={{ color: opportunity.backgroundColor }} 
            />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{opportunity.name}</span>
            {opportunity.isComingSoon && (
              <Badge variant="secondary" className="text-xs">Soon</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {opportunity.shortDescription || opportunity.earnPotential}
          </p>
        </div>
        
        <Button 
          size="sm" 
          variant="ghost"
          disabled={opportunity.isComingSoon}
        >
          {opportunity.ctaUrl?.startsWith('http') ? (
            <ExternalLink className="w-4 h-4" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </Button>
      </div>
    );
  }

  // Standard variant
  return (
    <Card 
      className={cn(
        "relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group h-full",
        opportunity.isComingSoon && "opacity-70"
      )}
      onClick={handleClick}
    >
      {opportunity.isComingSoon && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="secondary" className="gap-1 text-xs">
            <Clock className="w-3 h-3" />
            Soon
          </Badge>
        </div>
      )}

      <CardContent className="p-5 flex flex-col h-full">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-md overflow-hidden"
          style={{ backgroundColor: hasLogoImage ? 'transparent' : opportunity.backgroundColor }}
        >
          {hasLogoImage ? (
            <img 
              src={opportunity.iconUrl} 
              alt={opportunity.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <IconComponent className="w-6 h-6 text-white" />
          )}
        </div>
        
        <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
          {opportunity.name}
        </h3>
        
        {opportunity.earnPotential && (
          <Badge 
            variant="outline" 
            className="w-fit mb-2 text-xs border-primary/30 text-primary"
          >
            {opportunity.earnPotential}
          </Badge>
        )}
        
        <p className="text-muted-foreground text-sm flex-1 line-clamp-3 mb-4">
          {opportunity.shortDescription || opportunity.description}
        </p>
        
        <Button 
          size="sm"
          className="w-full gap-1"
          style={{ 
            backgroundColor: opportunity.isComingSoon ? undefined : opportunity.backgroundColor,
            color: opportunity.isComingSoon ? undefined : 'white'
          }}
          variant={opportunity.isComingSoon ? "outline" : "default"}
          disabled={opportunity.isComingSoon}
        >
          {opportunity.ctaText}
          {!opportunity.isComingSoon && opportunity.ctaUrl?.startsWith('http') && (
            <ExternalLink className="w-3 h-3" />
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
