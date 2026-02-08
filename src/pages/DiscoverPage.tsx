import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { ContentCard, type ContentItem } from '@/components/discover/ContentCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Compass, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SOURCE_TABS = [
  { value: 'all', label: 'All' },
  { value: 'sponsor', label: 'From Sponsors' },
  { value: 'contributor', label: 'From Contributors' },
  { value: 'member', label: 'Member Reviews' },
];

const TYPE_PILLS = [
  { value: 'all', label: 'All Types' },
  { value: 'video', label: 'Videos' },
  { value: 'tutorial', label: 'Tutorials' },
  { value: 'review', label: 'Reviews' },
  { value: 'tip', label: 'Tips' },
  { value: 'story', label: 'Stories' },
  { value: 'image', label: 'Images' },
];

type SortOption = 'newest' | 'popular' | 'helpful';

export default function DiscoverPage() {
  const [sourceFilter, setSourceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [visibleCount, setVisibleCount] = useState(12);

  const { data: allContent = [], isLoading } = useQuery({
    queryKey: ['discover-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_submissions')
        .select('*')
        .in('status', ['published', 'featured'])
        .order('submitted_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as ContentItem[];
    },
  });

  const filtered = useMemo(() => {
    let items = allContent;

    if (sourceFilter !== 'all') {
      items = items.filter(i => i.source_type === sourceFilter);
    }
    if (typeFilter !== 'all') {
      items = items.filter(i => i.content_type === typeFilter);
    }

    // Sort
    if (sort === 'popular') {
      items = [...items].sort((a, b) => b.view_count - a.view_count);
    } else if (sort === 'helpful') {
      items = [...items].sort((a, b) => b.helpful_count - a.helpful_count);
    }
    // 'newest' is default from query order

    // Prioritize featured
    const featured = items.filter(i => i.is_featured);
    const rest = items.filter(i => !i.is_featured);
    return [...featured, ...rest];
  }, [allContent, sourceFilter, typeFilter, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="flex-1 px-4 md:px-6 pt-2 pb-8">
      <SEO title="Discover" description="Explore community content — videos, reviews, tips, and stories from sponsors, contributors, and members." />
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" />
            Discover
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Videos, reviews, and stories from our community
          </p>
        </div>

        {/* Filter bar */}
        <div className="space-y-3">
          {/* Source tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {SOURCE_TABS.map(tab => (
              <Button
                key={tab.value}
                variant={sourceFilter === tab.value ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setSourceFilter(tab.value)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Type pills + sort */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              {TYPE_PILLS.map(pill => (
                <Badge
                  key={pill.value}
                  variant={typeFilter === pill.value ? 'default' : 'outline'}
                  className={cn(
                    "cursor-pointer text-xs px-2.5 py-1 transition-colors",
                    typeFilter === pill.value ? '' : 'hover:bg-accent'
                  )}
                  onClick={() => setTypeFilter(pill.value)}
                >
                  {pill.label}
                </Badge>
              ))}
            </div>

            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SlidersHorizontal className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="helpful">Most Helpful</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-video rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Compass className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <h3 className="font-semibold text-lg">No content yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Content from sponsors, contributors, and member reviews will appear here once published.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {visible.map(item => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center pt-4">
                <Button variant="outline" onClick={() => setVisibleCount(prev => prev + 12)}>
                  Load More
                </Button>
              </div>
            )}
          </>
        )}

        <div className="h-20 md:hidden" />
      </div>
    </div>
  );
}
