import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { PlatformBadge } from './PlatformIcon';
import type { FeaturedCreator } from '@/types/creators';
import { CheckCircle2 } from 'lucide-react';

interface CreatorShowcaseProps {
  creators: FeaturedCreator[];
  mode: 'collage' | 'single' | 'carousel';
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function CreatorAvatar({ creator, sizeClass, showBadge = true }: { creator: FeaturedCreator; sizeClass: string; showBadge?: boolean }) {
  return (
    <div className={cn("relative shrink-0 rounded-full overflow-visible", sizeClass)}>
      <img
        src={creator.image_url}
        alt={creator.name}
        className={cn("rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-md transition-transform duration-200 hover:scale-110", sizeClass)}
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/placeholder.svg';
        }}
      />
      {showBadge && <PlatformBadge platform={creator.platform} size={14} />}
      {creator.is_verified && (
        <div className="absolute -top-0.5 -left-0.5 bg-blue-500 rounded-full p-0.5">
          <CheckCircle2 className="w-2.5 h-2.5 text-white" />
        </div>
      )}
    </div>
  );
}

function CollageMode({ creators, maxDisplay = 4, size }: Omit<CreatorShowcaseProps, 'mode'>) {
  const sizeMap = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
  const sizeClass = sizeMap[size || 'md'];
  const visible = creators.slice(0, maxDisplay);
  const remaining = creators.length - visible.length;

  return (
    <div className="flex items-center">
      <div className="flex items-center">
        {visible.map((c, i) => (
          <div key={c.id} className={cn("relative", i > 0 && "-ml-3")} style={{ zIndex: i + 1 }}>
            <CreatorAvatar creator={c} sizeClass={sizeClass} showBadge={i === 0} />
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <span className="ml-2 text-xs text-muted-foreground font-medium">+{remaining} more</span>
      )}
    </div>
  );
}

function SingleMode({ creators, size }: Omit<CreatorShowcaseProps, 'mode'>) {
  const creator = creators[0];
  if (!creator) return null;

  return (
    <div className="relative w-full h-full">
      <img
        src={creator.image_url}
        alt={creator.name}
        className="w-full h-full object-cover"
        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-white/50 shrink-0">
            <img src={creator.image_url} alt="" className="w-full h-full object-cover" />
          </div>
          <span className="text-white text-xs font-medium truncate">
            Featuring {creator.handle || creator.name}
          </span>
          {creator.is_verified && <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0" />}
        </div>
      </div>
    </div>
  );
}

function CarouselMode({ creators }: Omit<CreatorShowcaseProps, 'mode'>) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % creators.length);
  }, [creators.length]);

  useEffect(() => {
    if (creators.length <= 1) return;
    const interval = setInterval(next, 4000);
    return () => clearInterval(interval);
  }, [next, creators.length]);

  if (creators.length === 0) return null;
  const creator = creators[current];

  return (
    <div className="relative w-full h-full group" onMouseEnter={() => {}} >
      <img
        src={creator.image_url}
        alt={creator.name}
        className="w-full h-full object-cover transition-opacity duration-500"
        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <span className="text-white text-xs font-medium">
          Featuring {creator.handle || creator.name}
        </span>
      </div>
      {creators.length > 1 && (
        <div className="absolute bottom-1 right-3 flex gap-1">
          {creators.map((_, i) => (
            <button
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                i === current ? "bg-white w-3" : "bg-white/50"
              )}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CreatorShowcase({ creators, mode, maxDisplay = 4, size = 'md', className }: CreatorShowcaseProps) {
  if (!creators || creators.length === 0) return null;

  return (
    <div className={className}>
      {mode === 'collage' && <CollageMode creators={creators} maxDisplay={maxDisplay} size={size} />}
      {mode === 'single' && <SingleMode creators={creators} size={size} />}
      {mode === 'carousel' && <CarouselMode creators={creators} size={size} />}
    </div>
  );
}

export function CreatorHandles({ creators, max = 2 }: { creators: FeaturedCreator[]; max?: number }) {
  if (!creators || creators.length === 0) return null;
  const visible = creators.slice(0, max);
  const remaining = creators.length - max;

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
      <span>Featuring</span>
      {visible.map((c, i) => (
        <span key={c.id}>
          <a
            href={c.profile_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {c.handle || c.name}
          </a>
          {i < visible.length - 1 && ', '}
        </span>
      ))}
      {remaining > 0 && <span>+ {remaining} more</span>}
    </div>
  );
}
