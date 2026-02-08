import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, UserCircle, Users, Play, Star, Eye, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  source_type: string;
  source_name: string | null;
  reward_id: string | null;
  content_type: string;
  rating: number | null;
  view_count: number;
  helpful_count: number;
  submitted_at: string;
  is_featured: boolean;
}

const SOURCE_CONFIG: Record<string, { icon: typeof Building2; label: string; emoji: string; className: string }> = {
  sponsor: { icon: Building2, label: 'Sponsor', emoji: '🏢', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  contributor: { icon: UserCircle, label: 'Contributor', emoji: '👤', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  member: { icon: Users, label: 'Member', emoji: '👥', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
};

const TYPE_ICONS: Record<string, typeof Play> = {
  video: Play,
  review: Star,
  tip: Lightbulb,
};

function getYouTubeThumbnail(url: string): string | null {
  try {
    const parsed = new URL(url);
    let videoId: string | null = null;
    if (parsed.hostname.includes('youtube.com')) videoId = parsed.searchParams.get('v');
    else if (parsed.hostname.includes('youtu.be')) videoId = parsed.pathname.slice(1);
    if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  } catch {}
  return null;
}

interface ContentCardProps {
  item: ContentItem;
  className?: string;
}

export function ContentCard({ item, className }: ContentCardProps) {
  const navigate = useNavigate();
  const source = SOURCE_CONFIG[item.source_type] || SOURCE_CONFIG.member;
  const TypeIcon = TYPE_ICONS[item.content_type];

  const thumbnail = item.thumbnail_url || (item.media_url ? getYouTubeThumbnail(item.media_url) : null);
  const isVideo = item.content_type === 'video' || (item.media_url && /youtube|youtu\.be|vimeo/i.test(item.media_url));

  const handleClick = () => {
    if (item.reward_id) {
      navigate(`/rewards/${item.reward_id}`);
    }
  };

  return (
    <Card
      className={cn(
        "group overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 border-border/50",
        item.is_featured && "ring-1 ring-primary/30",
        className
      )}
      onClick={handleClick}
    >
      {/* Thumbnail */}
      {thumbnail ? (
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img src={thumbnail} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
            </div>
          )}
          {item.is_featured && (
            <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
              Featured
            </Badge>
          )}
        </div>
      ) : (
        <div className={cn(
          "aspect-video flex items-center justify-center",
          "bg-gradient-to-br from-muted to-muted/50"
        )}>
          {TypeIcon && <TypeIcon className="w-8 h-8 text-muted-foreground/40" />}
        </div>
      )}

      <CardContent className="p-3 space-y-2">
        {/* Source badge */}
        <Badge variant="outline" className={cn("text-[10px] gap-1 font-medium", source.className)}>
          <span>{source.emoji}</span>
          {item.source_type === 'sponsor' ? `From ${item.source_name || 'Sponsor'}` :
           item.source_type === 'contributor' ? `By ${item.source_name || 'Contributor'}` :
           `Review by ${item.source_name || 'Member'}`}
        </Badge>

        {/* Title + rating */}
        <div>
          <h3 className="font-semibold text-sm line-clamp-2 text-foreground">{item.title}</h3>
          {item.rating && (
            <div className="flex items-center gap-1 mt-0.5">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={cn("h-3 w-3", s <= item.rating! ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> {item.view_count}
          </span>
          {item.helpful_count > 0 && (
            <span>👍 {item.helpful_count}</span>
          )}
          <span className="ml-auto">
            {new Date(item.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
