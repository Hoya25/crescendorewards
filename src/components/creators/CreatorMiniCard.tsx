import { ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlatformBadge, PLATFORM_LABELS } from './PlatformIcon';
import type { FeaturedCreator } from '@/types/creators';

const CATEGORY_ICONS: Record<string, string> = {
  gaming: '🎮',
  music: '🎵',
  fitness: '💪',
  recovery: '🧘',
  education: '🎓',
  entertainment: '🎭',
  lifestyle: '✨',
  tech: '💻',
  other: '🌐',
};

interface CreatorMiniCardProps {
  creator: FeaturedCreator;
}

export function CreatorMiniCard({ creator }: CreatorMiniCardProps) {
  const categoryEmoji = CATEGORY_ICONS[creator.category || 'other'] || '🌐';

  return (
    <div className="flex flex-col items-center text-center p-4 rounded-xl border bg-card hover:shadow-md transition-shadow">
      {/* Photo with platform badge */}
      <div className="relative mb-3">
        <img
          src={creator.image_url}
          alt={creator.name}
          className="w-20 h-20 rounded-full object-cover border-2 border-border shadow-sm"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
        />
        <PlatformBadge platform={creator.platform} size={16} />
      </div>

      {/* Name */}
      <div className="flex items-center gap-1 mb-0.5">
        <span className="font-semibold text-sm text-foreground">{creator.name}</span>
        {creator.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
      </div>

      {/* Handle */}
      {creator.handle && (
        <span className="text-xs text-muted-foreground mb-1">{creator.handle}</span>
      )}

      {/* Category */}
      {creator.category && (
        <span className="text-xs text-muted-foreground mb-3">
          {categoryEmoji} {creator.category.charAt(0).toUpperCase() + creator.category.slice(1)}
        </span>
      )}

      {/* Visit Profile button */}
      {creator.profile_url && (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs h-8"
          onClick={() => window.open(creator.profile_url!, '_blank')}
        >
          Visit Profile
          <ExternalLink className="w-3 h-3 ml-1" />
        </Button>
      )}
    </div>
  );
}
