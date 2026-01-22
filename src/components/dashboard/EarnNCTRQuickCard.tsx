import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEarningOpportunities } from "@/hooks/useEarningOpportunities";
import { Skeleton } from "@/components/ui/skeleton";
import * as LucideIcons from "lucide-react";
import { EarningOpportunity } from "@/types/earning";

function getIconComponent(iconName: string | undefined): React.ElementType {
  if (!iconName) return Sparkles;
  const icons = LucideIcons as unknown as Record<string, React.ElementType>;
  const IconComponent = icons[iconName];
  return IconComponent || Sparkles;
}

function OpportunityItem({ opportunity }: { opportunity: EarningOpportunity }) {
  const navigate = useNavigate();
  const hasLogoImage = opportunity.iconUrl && opportunity.iconUrl.length > 0;
  const IconComponent = getIconComponent(opportunity.iconName);
  
  const handleClick = () => {
    if (opportunity.ctaUrl) {
      if (opportunity.opensInNewTab) {
        window.open(opportunity.ctaUrl, '_blank');
      } else {
        navigate(opportunity.ctaUrl);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
    >
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
        style={{ backgroundColor: opportunity.backgroundColor || 'hsl(var(--primary))' }}
      >
        {hasLogoImage ? (
          <img 
            src={opportunity.iconUrl} 
            alt={opportunity.name}
            className="w-full h-full object-contain p-1.5"
          />
        ) : (
          <IconComponent className="w-5 h-5 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{opportunity.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {opportunity.earnPotential || opportunity.shortDescription}
        </p>
      </div>
      {opportunity.opensInNewTab ? (
        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
      ) : (
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
      )}
    </button>
  );
}

export function EarnNCTRQuickCard() {
  const navigate = useNavigate();
  const { featured, active, isLoading, error } = useEarningOpportunities();
  
  // Get top 3 opportunities - prioritize featured, then by sort order
  const topOpportunities = featured.length >= 3 
    ? featured.slice(0, 3) 
    : [...featured, ...active.filter(o => !o.isFeatured)].slice(0, 3);

  if (error) return null;

  return (
    <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-green-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            Earn NCTR
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/earn')}
            className="gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : topOpportunities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No earning opportunities available
          </p>
        ) : (
          <div className="space-y-1">
            {topOpportunities.map((opportunity) => (
              <OpportunityItem key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
