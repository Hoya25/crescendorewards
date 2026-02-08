import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Volume2, VolumeX, ChevronRight, ExternalLink } from 'lucide-react';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { useNavigate } from 'react-router-dom';

interface FeaturedBrand {
  id: string;
  name: string;
  description: string;
  hero_video_url: string | null;
  image_url: string | null;
  logo_emoji: string;
  logo_color: string;
  shop_url: string;
  category: string;
}

interface HeroVideoSectionProps {
  brands: FeaturedBrand[];
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    let videoId: string | null = null;
    if (parsed.hostname.includes('youtube.com')) {
      videoId = parsed.searchParams.get('v');
    } else if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.slice(1);
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1`;
    }
  } catch {}

  // Vimeo
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('vimeo.com')) {
      const vimeoId = parsed.pathname.split('/').filter(Boolean).pop();
      if (vimeoId) {
        return `https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&background=1`;
      }
    }
  } catch {}

  return null;
}

export function HeroVideoSection({ brands }: HeroVideoSectionProps) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  const activeBrand = brands[activeIndex];

  // Auto-advance every 15 seconds
  useEffect(() => {
    if (brands.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % brands.length);
    }, 15000);
    return () => clearInterval(timer);
  }, [brands.length]);

  const hasVideo = activeBrand?.hero_video_url;
  const embedUrl = hasVideo ? getYouTubeEmbedUrl(activeBrand.hero_video_url!) : null;

  if (!activeBrand) return null;

  return (
    <section className="relative w-full rounded-xl overflow-hidden" style={{ minHeight: '50vh' }}>
      {/* Background */}
      {embedUrl ? (
        <div className="absolute inset-0">
          <iframe
            src={embedUrl.replace('mute=1', isMuted ? 'mute=1' : 'mute=0')}
            className="w-full h-full border-0"
            style={{ objectFit: 'cover' }}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={`${activeBrand.name} video`}
          />
        </div>
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--muted)))`,
          }}
        >
          {activeBrand.image_url ? (
            <ImageWithFallback
              src={activeBrand.image_url}
              alt={activeBrand.name}
              className="w-32 h-32 object-contain opacity-30"
            />
          ) : (
            <span className="text-[120px] opacity-20">{activeBrand.logo_emoji}</span>
          )}
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col justify-end h-full p-6 md:p-10" style={{ minHeight: '50vh' }}>
        <div className="max-w-2xl space-y-3">
          {/* Brand logo + badge */}
          <div className="flex items-center gap-3">
            {activeBrand.image_url ? (
              <ImageWithFallback
                src={activeBrand.image_url}
                alt={activeBrand.name}
                className="w-10 h-10 object-contain rounded-lg bg-white/10 p-1"
              />
            ) : (
              <span className="text-2xl">{activeBrand.logo_emoji}</span>
            )}
            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
              {activeBrand.category}
            </Badge>
          </div>

          {!embedUrl && (
            <p className="text-white/60 text-sm">Featured Brand Content Coming Soon</p>
          )}

          <h2 className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg">
            {activeBrand.name}
          </h2>
          <p className="text-white/80 text-sm md:text-base max-w-lg">
            {activeBrand.description}
          </p>

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
              onClick={() => window.open(activeBrand.shop_url, '_blank')}
            >
              Shop {activeBrand.name}
              <ExternalLink className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 gap-1"
              onClick={() => navigate(`/brands/${activeBrand.id}`)}
            >
              Learn More <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Dots indicator */}
        {brands.length > 1 && (
          <div className="flex items-center gap-2 mt-6">
            {brands.map((_, i) => (
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
