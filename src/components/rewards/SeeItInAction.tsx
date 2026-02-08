import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Play, Film } from 'lucide-react';
import { VideoPlayerModal } from './VideoPlayerModal';
import { formatDistanceToNow } from 'date-fns';

interface SeeItInActionProps {
  rewardId: string;
}

function getThumbnailFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    // YouTube thumbnail
    const ytId = u.hostname.includes('youtube.com')
      ? u.searchParams.get('v')
      : u.hostname === 'youtu.be'
        ? u.pathname.slice(1)
        : null;
    if (ytId) return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
    // Vimeo — no easy thumbnail without API
  } catch {
    // ignore
  }
  return null;
}

const TYPE_LABELS: Record<string, string> = {
  tutorial: 'Tutorial',
  video: 'Video',
  unboxing: 'Unboxing',
  review: 'Review',
  testimonial: 'Testimonial',
};

export function SeeItInAction({ rewardId }: SeeItInActionProps) {
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);

  const { data: videoContent = [] } = useQuery({
    queryKey: ['reward-videos', rewardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_submissions')
        .select('*')
        .eq('reward_id', rewardId)
        .in('status', ['published', 'featured'])
        .in('content_type', ['video', 'tutorial', 'unboxing'])
        .order('is_featured', { ascending: false })
        .order('submitted_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!rewardId,
  });

  if (videoContent.length === 0) return null;

  return (
    <>
      <div className="space-y-3">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Film className="w-5 h-5 text-primary" />
          See It in Action
        </h3>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {videoContent.map(content => {
            const thumbnail = content.thumbnail_url || getThumbnailFromUrl(content.media_url);
            const sourceBadge = content.source_type === 'sponsor'
              ? `🏢 From ${content.source_name}`
              : `👤 ${content.source_name}`;

            return (
              <Card
                key={content.id}
                className="flex-shrink-0 w-56 cursor-pointer group overflow-hidden hover:ring-2 hover:ring-primary/40 transition-all"
                onClick={() => content.media_url && setActiveVideo({ url: content.media_url, title: content.title })}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  {thumbnail ? (
                    <img src={thumbnail} alt={content.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-5 h-5 text-foreground ml-0.5" />
                    </div>
                  </div>
                  {/* Type badge */}
                  <Badge variant="secondary" className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5">
                    {TYPE_LABELS[content.content_type] || 'Video'}
                  </Badge>
                </div>

                {/* Info */}
                <div className="p-2.5 space-y-1">
                  <p className="text-sm font-medium line-clamp-1">{content.title}</p>
                  <p className="text-xs text-muted-foreground">{sourceBadge}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {activeVideo && (
        <VideoPlayerModal
          open={true}
          onClose={() => setActiveVideo(null)}
          videoUrl={activeVideo.url}
          title={activeVideo.title}
        />
      )}
    </>
  );
}
