import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, ChevronRight, Building2, UserCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeaturedContent {
  id: string;
  title: string;
  description: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  source_type: string;
  source_name: string | null;
  reward_id: string | null;
}

interface HeroVideoSectionProps {
  content: FeaturedContent[];
}

const SOURCE_DISPLAY: Record<string, { icon: typeof Building2; prefix: string; emoji: string }> = {
  sponsor: { icon: Building2, prefix: 'From', emoji: '🏢' },
  contributor: { icon: UserCircle, prefix: 'Shared by', emoji: '👤' },
  member: { icon: Users, prefix: 'Review by', emoji: '👥' },
};

function getEmbedUrl(url: string, muted: boolean): string | null {
  try {
    const parsed = new URL(url);
    let videoId: string | null = null;
    if (parsed.hostname.includes('youtube.com')) {
      videoId = parsed.searchParams.get('v');
    } else if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.slice(1);
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1`;
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const vimeoId = parsed.pathname.split('/').filter(Boolean).pop();
      if (vimeoId) {
        return `https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=${muted ? 1 : 0}&loop=1&background=1`;
      }
    }
  } catch {}
  return null;
}

export function HeroVideoSection({ content }: HeroVideoSectionProps) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  const active = content[activeIndex];

  useEffect(() => {
    if (content.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % content.length);
    }, 15000);
    return () => clearInterval(timer);
  }, [content.length]);

  if (!active) return null;

  const embedUrl = active.media_url ? getEmbedUrl(active.media_url, isMuted) : null;
  const source = SOURCE_DISPLAY[active.source_type] || SOURCE_DISPLAY.member;

  return (
    <section className="relative w-full rounded-xl overflow-hidden" style={{ minHeight: '50vh' }}>
      {/* Background */}
      {embedUrl ? (
        <div className="absolute inset-0">
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            style={{ objectFit: 'cover' }}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={active.title}
          />
        </div>
      ) : active.thumbnail_url ? (
        <div className="absolute inset-0">
          <img src={active.thumbnail_url} alt={active.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--muted)))' }}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col justify-end h-full p-6 md:p-10" style={{ minHeight: '50vh' }}>
        <div className="max-w-2xl space-y-3">
          {/* Source badge */}
          <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm gap-1.5">
            <span>{source.emoji}</span>
            {source.prefix} {active.source_name || 'Community'}
            {active.source_type === 'sponsor' && <span className="opacity-70">· Sponsor</span>}
          </Badge>

          <h2 className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg">
            {active.title}
          </h2>
          {active.description && (
            <p className="text-white/80 text-sm md:text-base max-w-lg">
              {active.description}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            {embedUrl && (
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 bg-white/20 text-white border-0 backdrop-blur-sm hover:bg-white/30"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {isMuted ? 'Unmute' : 'Mute'}
              </Button>
            )}
            <Button
              size="sm"
              className="gap-2"
              onClick={() => navigate(active.reward_id ? `/rewards/${active.reward_id}` : '/rewards')}
            >
              {active.reward_id ? 'View Reward' : 'Explore Rewards'}
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Dots indicator */}
        {content.length > 1 && (
          <div className="flex items-center gap-2 mt-6">
            {content.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === activeIndex ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
