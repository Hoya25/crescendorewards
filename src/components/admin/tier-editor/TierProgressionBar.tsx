import { cn } from '@/lib/utils';

interface TierBase {
  id: string;
  tier_name: string;
  display_name: string;
  badge_emoji: string;
  badge_color: string;
  sort_order: number;
}

interface TierProgressionBarProps<T extends TierBase> {
  tiers: T[];
  selectedTierId?: string;
  onSelectTier?: (tier: T) => void;
}

export function TierProgressionBar<T extends TierBase>({ 
  tiers, 
  selectedTierId, 
  onSelectTier 
}: TierProgressionBarProps<T>) {
  const sortedTiers = [...tiers].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="flex items-center w-full overflow-x-auto pb-2">
      {sortedTiers.map((tier, index) => (
        <div key={tier.id} className="flex items-center flex-shrink-0">
          <button
            onClick={() => onSelectTier?.(tier)}
            className={cn(
              "flex flex-col items-center p-3 rounded-lg transition-all min-w-[100px]",
              selectedTierId === tier.id
                ? "bg-primary/10 ring-2 ring-primary"
                : "hover:bg-muted/50"
            )}
          >
            <span 
              className="text-2xl mb-1 w-10 h-10 flex items-center justify-center rounded-full"
              style={{ backgroundColor: `${tier.badge_color}20` }}
            >
              {tier.badge_emoji}
            </span>
            <span 
              className="text-xs font-medium"
              style={{ color: tier.badge_color }}
            >
              {tier.display_name}
            </span>
          </button>
          
          {index < sortedTiers.length - 1 && (
            <div className="w-8 h-0.5 bg-border mx-1 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
