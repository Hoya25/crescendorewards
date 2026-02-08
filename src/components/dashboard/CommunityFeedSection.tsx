import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ContentCard, type ContentItem } from '@/components/discover/ContentCard';
import { Button } from '@/components/ui/button';
import { ChevronRight, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

export function CommunityFeedSection() {
  const navigate = useNavigate();

  const { data: content = [], isLoading } = useQuery({
    queryKey: ['community-feed-homepage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_submissions')
        .select('*')
        .in('status', ['published', 'featured'])
        .order('submitted_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as ContentItem[];
    },
  });

  // Smart mixing: featured first, then interleave source types
  const feed = useMemo(() => {
    if (content.length === 0) return [];

    const featured = content.filter(c => c.is_featured);
    const rest = content.filter(c => !c.is_featured);

    // Group by source type for interleaving
    const bySource: Record<string, ContentItem[]> = {};
    rest.forEach(item => {
      const key = item.source_type;
      if (!bySource[key]) bySource[key] = [];
      bySource[key].push(item);
    });

    // Round-robin interleave
    const interleaved: ContentItem[] = [];
    const sources = Object.keys(bySource);
    let maxLen = Math.max(...sources.map(s => bySource[s].length), 0);
    for (let i = 0; i < maxLen; i++) {
      for (const src of sources) {
        if (bySource[src][i]) interleaved.push(bySource[src][i]);
      }
    }

    return [...featured, ...interleaved].slice(0, 8);
  }, [content]);

  if (isLoading) {
    return (
      <section className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-video rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (feed.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Compass className="w-4 h-4 text-primary" />
          Fresh from the Community
        </h2>
        <Button variant="ghost" size="sm" onClick={() => navigate('/discover')} className="gap-1 h-7 text-xs">
          See All <ChevronRight className="w-3 h-3" />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {feed.map(item => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
